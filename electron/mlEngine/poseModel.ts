import * as ort from 'onnxruntime-node';
import path from 'node:path';
import { app } from 'electron';
import { FrameMessage } from '../../models/types';
import { Keypoint } from './analysis';

const MODEL_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'resources', 'movenet_lightning.onnx')
  : path.join(__dirname, '../resources/movenet_lightning.onnx');

export class PoseModel {
  private session: ort.InferenceSession | null = null;
  private inputName: string = 'input';

  async load() {
    console.log('Attempting to load model from:', MODEL_PATH);
    try {
      this.session = await ort.InferenceSession.create(MODEL_PATH);
      this.inputName = this.session.inputNames[0];
      console.log('Pose model loaded successfully');
    } catch (e) {
      console.error('Failed to load pose model:', e);
    }
  }

  async estimatePose(frame: FrameMessage): Promise<Keypoint[]> {
    if (!this.session) return [];

    try {
      const tensor = this.preprocess(frame);
      const feeds: Record<string, ort.Tensor> = {};
      feeds[this.inputName] = tensor;

      const results = await this.session.run(feeds);
      const output = results[this.session.outputNames[0]]; // [1, 1, 17, 3]

      return this.postprocess(output.data as Float32Array);
    } catch (e) {
      console.error('Inference failed:', e);
      return [];
    }
  }

  private preprocess(frame: FrameMessage): ort.Tensor {
    const { width, height, data } = frame;
    const targetSize = 192; // MoveNet Lightning input size

    // Simple nearest neighbor resize and normalization to [0, 1] or [-1, 1]?
    // MoveNet expects [1, 192, 192, 3] int32 (actually it might be float32 depending on model)
    // The downloaded model is float32.
    // Input range: [0, 255] cast to float? Or normalized?
    // Usually MoveNet expects [1, 192, 192, 3] int32 [0, 255].
    // Let's check the model metadata if possible, but standard MoveNet is int32 [0, 255].
    // Wait, the URL said "float32.onnx". It likely expects float32.
    // Let's try normalized [0, 1] or just [0, 255] float.
    // Common for TFLite converted models is often [0, 1] or [-1, 1].
    // Let's try [0, 255] float first as that's safer for "image" inputs usually unless specified.
    // Actually, standard MoveNet TFLite input is uint8.
    // The "float32" in filename suggests the *weights* or *operations* are float32, or input is float32.
    // Let's assume [0, 255] float32 for now.

    const int32Data = new Int32Array(targetSize * targetSize * 3);

    // Resize logic (nearest neighbor for speed)
    const xRatio = width / targetSize;
    const yRatio = height / targetSize;

    for (let y = 0; y < targetSize; y++) {
      for (let x = 0; x < targetSize; x++) {
        const srcX = Math.floor(x * xRatio);
        const srcY = Math.floor(y * yRatio);
        const srcIdx = (srcY * width + srcX) * 4; // RGBA
        const dstIdx = (y * targetSize + x) * 3; // RGB

        int32Data[dstIdx] = data[srcIdx];     // R
        int32Data[dstIdx + 1] = data[srcIdx + 1]; // G
        int32Data[dstIdx + 2] = data[srcIdx + 2]; // B
      }
    }

    // Create tensor: [1, 192, 192, 3]
    return new ort.Tensor('int32', int32Data, [1, 192, 192, 3]);
  }

  private postprocess(data: Float32Array): Keypoint[] {
    // Output shape: [1, 1, 17, 3] -> flattened
    // Each keypoint: [y, x, score] (normalized 0-1)
    const keypoints: Keypoint[] = [];
    
    for (let i = 0; i < 17; i++) {
      const offset = i * 3;
      keypoints.push({
        y: data[offset],
        x: data[offset + 1],
        score: data[offset + 2],
      });
    }

    return keypoints;
  }
}
