import type * as ORT from 'onnxruntime-node';
import path from 'node:path';
import { app, dialog } from 'electron';
import { FrameMessage } from '../../models/types';

let ort: typeof ORT;

try {
  ort = require('onnxruntime-node');
} catch (e) {
  if (process.platform === 'win32') {
    dialog.showErrorBox(
      'Missing System Dependency',
      'ErgoSense requires the Visual C++ Redistributable to run.\n\nPlease install "Visual C++ Redistributable for Visual Studio 2015-2022" and try again.\n\nError: ' + (e as Error).message
    );
    app.quit();
    process.exit(1);
  } else {
    throw e;
  }
}

const MODEL_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'resources', 'face_mesh.onnx')
  : path.join(__dirname, '../resources/face_mesh.onnx');

export class FaceModel {
  private session: ORT.InferenceSession | null = null;
  private inputName: string = 'input';
  
  async load() {
    console.log('Attempting to load face model from:', MODEL_PATH);
    try {
      this.session = await ort.InferenceSession.create(MODEL_PATH);
      this.inputName = this.session.inputNames[0];
      console.log('Face model loaded successfully');
      console.log('Input names:', this.session.inputNames);
      console.log('Output names:', this.session.outputNames);
    } catch (e) {
      console.error('Failed to load face model:', e);
    }
  }

  async estimateFace(frame: FrameMessage, keypoints?: { y: number; x: number; score: number }[]): Promise<number[]> {
    if (!this.session) return [];

    try {
      // Calculate crop region from keypoints if available
      let cropRect = { x: 0, y: 0, width: frame.width, height: frame.height };
      
      if (keypoints && keypoints.length >= 5) {
        // MoveNet: 0: nose, 1: left_eye, 2: right_eye, 3: left_ear, 4: right_ear
        const nose = keypoints[0];
        const leftEar = keypoints[3];
        const rightEar = keypoints[4];

        if (nose.score > 0.3 && leftEar.score > 0.3 && rightEar.score > 0.3) {
          // Calculate face width based on ears
          // Coordinates are normalized [0, 1]
          const earDist = Math.abs(leftEar.x - rightEar.x);
          const faceSize = earDist * 2.5; // Multiplier to cover full face
          
          const centerX = nose.x;
          const centerY = nose.y;

          // Convert to pixels
          const sizePx = Math.floor(faceSize * frame.width);
          const centerXPx = Math.floor(centerX * frame.width);
          const centerYPx = Math.floor(centerY * frame.height);

          // Make square
          cropRect = {
            x: Math.max(0, centerXPx - sizePx / 2),
            y: Math.max(0, centerYPx - sizePx / 2),
            width: sizePx,
            height: sizePx,
          };

          // Ensure within bounds
          if (cropRect.x + cropRect.width > frame.width) cropRect.width = frame.width - cropRect.x;
          if (cropRect.y + cropRect.height > frame.height) cropRect.height = frame.height - cropRect.y;
          // Keep square-ish if possible, but clipping is safer than OOB
        }
      }

      const tensor = this.preprocess(frame, cropRect);
      const feeds: Record<string, ORT.Tensor> = {};
      feeds[this.inputName] = tensor;

      // Provide crop coordinates
      // The model uses these to re-normalize the output landmarks to the original image space if needed,
      // or just as auxiliary input.
      // We pass the actual crop rect we used.
      
      feeds['crop_x1'] = new ort.Tensor('int32', new Int32Array([Math.floor(cropRect.x)]), [1, 1]);
      feeds['crop_y1'] = new ort.Tensor('int32', new Int32Array([Math.floor(cropRect.y)]), [1, 1]);
      feeds['crop_x2'] = new ort.Tensor('int32', new Int32Array([Math.floor(cropRect.x + cropRect.width)]), [1, 1]);
      feeds['crop_y2'] = new ort.Tensor('int32', new Int32Array([Math.floor(cropRect.y + cropRect.height)]), [1, 1]);
      feeds['crop_width'] = new ort.Tensor('int32', new Int32Array([Math.floor(cropRect.width)]), [1, 1]);
      feeds['crop_height'] = new ort.Tensor('int32', new Int32Array([Math.floor(cropRect.height)]), [1, 1]);

      const results = await this.session.run(feeds);
      
      // Output names: [ 'score', 'final_landmarks' ]
      // We want 'final_landmarks'
      const outputName = 'final_landmarks';
      const output = results[outputName];
      
      return Array.from(output.data as Float32Array);
    } catch (e) {
      console.error('Face inference failed:', e);
      return [];
    }
  }

  private preprocess(frame: FrameMessage, cropRect: { x: number, y: number, width: number, height: number }): ORT.Tensor {
    const { width, height, data } = frame;
    const targetSize = 192; // FaceMesh input size

    const float32Data = new Float32Array(targetSize * targetSize * 3);
    
    // Resize logic with cropping
    const xRatio = cropRect.width / targetSize;
    const yRatio = cropRect.height / targetSize;

    for (let y = 0; y < targetSize; y++) {
      for (let x = 0; x < targetSize; x++) {
        // Map target pixel to source crop pixel
        const cropX = Math.floor(x * xRatio);
        const cropY = Math.floor(y * yRatio);
        
        // Map crop pixel to source frame pixel
        const srcX = Math.floor(cropRect.x + cropX);
        const srcY = Math.floor(cropRect.y + cropY);

        // Clamp to bounds
        const safeSrcX = Math.max(0, Math.min(width - 1, srcX));
        const safeSrcY = Math.max(0, Math.min(height - 1, srcY));

        const srcIdx = (safeSrcY * width + safeSrcX) * 4; // RGBA
        
        // Normalize to [0, 1]
        const r = data[srcIdx] / 255.0;
        const g = data[srcIdx + 1] / 255.0;
        const b = data[srcIdx + 2] / 255.0;

        // NCHW layout
        // R channel
        float32Data[0 * targetSize * targetSize + y * targetSize + x] = r;
        // G channel
        float32Data[1 * targetSize * targetSize + y * targetSize + x] = g;
        // B channel
        float32Data[2 * targetSize * targetSize + y * targetSize + x] = b;
      }
    }

    return new ort.Tensor('float32', float32Data, [1, 3, 192, 192]);
  }
}
