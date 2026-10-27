import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FrameMessage } from '../../../models/types';

const FRAME_INTERVAL_MS = 150;
const WIDTH = 224;
const HEIGHT = 224;

const isWindows = navigator.userAgent.includes('Windows');

const describeCameraError = (err: unknown): string => {
  const name = err instanceof DOMException || err instanceof Error ? err.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return isWindows
        ? 'Camera access is blocked. Open Windows Settings → Privacy & security → Camera and turn on "Let desktop apps access your camera".'
        : 'Camera access is blocked. Allow ErgoSense to use the camera in your system privacy settings.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'The camera is in use by another app (e.g. Teams, Zoom, or another ErgoSense window). Close it and try again.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No camera was found. Connect a webcam and try again.';
    default:
      return 'The camera could not be started. Check that it is connected and not in use, then try again.';
  }
};

export interface WebcamViewProps {
  /** When true, releases the camera and stops sending frames (e.g. during calibration modal). */
  suspendWhen?: boolean;
}

export const WebcamView = React.memo(({ suspendWhen = false }: WebcamViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastSentAtRef = useRef(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const captureAndSendFrame = useCallback(() => {
    if (suspendWhen) return;
    if (!videoRef.current || !canvasRef.current) return;
    if (document.hidden) return;

    const now = Date.now();
    if (now - lastSentAtRef.current < FRAME_INTERVAL_MS) return;
    lastSentAtRef.current = now;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    ctx.drawImage(video, 0, 0, WIDTH, HEIGHT);

    const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);

    const frameMessage: FrameMessage = {
      width: WIDTH,
      height: HEIGHT,
      data: new Uint8Array(imageData.data.buffer),
      timestamp: Date.now(),
    };

    window.electronAPI.sendFrame(frameMessage);
  }, [suspendWhen]);

  useEffect(() => {
    if (suspendWhen) {
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let activeStream: MediaStream | null = null;

    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        activeStream = stream;
        setCameraError(null);
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
        }

        intervalId = setInterval(captureAndSendFrame, FRAME_INTERVAL_MS);
      } catch (err) {
        console.error('Error accessing webcam:', err);
        if (!cancelled) setCameraError(describeCameraError(err));
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [suspendWhen, captureAndSendFrame, retryCount]);

  if (suspendWhen) {
    return (
      <div
        className="card"
        style={{
          position: 'relative',
          width: '420px',
          height: '315px',
          padding: 'var(--space-6)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          textAlign: 'center',
        }}
      >
        Camera paused while calibration is open. Close the calibration dialog to resume Live capture.
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        position: 'relative',
        width: '420px',
        height: '315px',
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          borderRadius: 'var(--radius-xl)',
        }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {cameraError && (
        <div
          role="alert"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-4)',
            padding: 'var(--space-6)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          {cameraError}
          <button type="button" className="btn btn-primary" onClick={() => setRetryCount((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          top: 'var(--space-4)',
          right: 'var(--space-4)',
          padding: 'var(--space-2) var(--space-3)',
          background: 'rgba(16, 185, 129, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'white',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
        LIVE
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 'var(--space-4)',
          left: 'var(--space-4)',
          right: 'var(--space-4)',
          padding: 'var(--space-3)',
          background: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: 'var(--radius-lg)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
        }}
      >
        📹 Camera active - Analyzing posture & eye movement
      </div>
    </div>
  );
});
