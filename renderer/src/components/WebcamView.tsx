import React, { useEffect, useRef } from 'react';
import { FrameMessage } from '../../../models/types';

const FRAME_INTERVAL_MS = 150;
const WIDTH = 224;
const HEIGHT = 224;

export const WebcamView = React.memo(() => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastSentAtRef = useRef(0);

  function captureAndSendFrame() {
    if (!videoRef.current || !canvasRef.current) return;
    if (document.hidden) return;

    const now = Date.now();
    if (now - lastSentAtRef.current < FRAME_INTERVAL_MS) return;
    lastSentAtRef.current = now;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Draw video frame to canvas
    // Downscale for performance (e.g., 224x224 or similar small size)
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    
    ctx.drawImage(video, 0, 0, WIDTH, HEIGHT);

    // Get raw pixel data
    const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    
    // Send to main process
    const frameMessage: FrameMessage = {
      width: WIDTH,
      height: HEIGHT,
      data: new Uint8Array(imageData.data.buffer), // Convert to Uint8Array
      timestamp: Date.now(),
    };

    window.electronAPI.sendFrame(frameMessage);
  }

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }

        intervalId = setInterval(captureAndSendFrame, FRAME_INTERVAL_MS);
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    startCamera();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="card" style={{
      position: 'relative',
      width: '420px',
      height: '315px',
      padding: 0,
      overflow: 'hidden',
    }}>
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
      
      {/* Status Badge */}
      <div style={{
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
      }}>
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          background: 'white',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }} />
        LIVE
      </div>

      {/* Info Overlay */}
      <div style={{
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
      }}>
        📹 Camera active - Analyzing posture & eye movement
      </div>
    </div>
  );
});
