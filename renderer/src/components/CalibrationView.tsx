import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { FrameMessage } from '../../../models/types';

interface CalibrationViewProps {
  onComplete: () => void;
  onCancel: () => void;
}

const FRAME_INTERVAL_MS = 150;
const FRAME_W = 224;
const FRAME_H = 224;
const CALIBRATION_DURATION_SEC = 60;

type Stage = 'INSTRUCTION' | 'CALIBRATING' | 'COMPLETE' | 'FAILED';

export const CalibrationView: React.FC<CalibrationViewProps> = ({ onComplete, onCancel }) => {
  const [stage, setStage] = useState<Stage>('INSTRUCTION');
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(CALIBRATION_DURATION_SEC);
  const [failReason, setFailReason] = useState<string | null>(null);
  const primaryActionRef = useRef<HTMLButtonElement | null>(null);
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<Stage>(stage);
  stageRef.current = stage;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  /** IPC: progress + completion from main process (ML engine). */
  useEffect(() => {
    const unsubProgress = window.electronAPI.onCalibrationProgress((p) => {
      if (stageRef.current !== 'CALIBRATING') return;
      setProgress(Math.min(100, p));
      setTimeRemaining(Math.max(0, Math.ceil(CALIBRATION_DURATION_SEC * (1 - p / 100))));
    });

    const unsubComplete = window.electronAPI.onCalibrationComplete(() => {
      if (stageRef.current !== 'CALIBRATING') return;
      setStage('COMPLETE');
      completionTimeoutRef.current = setTimeout(() => {
        onCompleteRef.current();
      }, 2000);
    });

    const unsubFailed = window.electronAPI.onCalibrationFailed((reason) => {
      if (stageRef.current !== 'CALIBRATING') return;
      setFailReason(reason);
      setStage('FAILED');
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubFailed();
    };
  }, []);

  /** Release camera when leaving calibrating; do not cancel ML here (success path). */
  useEffect(() => {
    if (stage !== 'CALIBRATING') return;

    let stream: MediaStream | null = null;

    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
        }
      } catch (err) {
        console.error('Failed to start webcam for calibration:', err);
        setFailReason('Could not access the camera. Allow camera access and try again.');
        setStage('FAILED');
        void window.electronAPI.cancelCalibration();
      }
    };

    void startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stage]);

  /** Send frames to the same ML pipeline as Live (required for calibration). */
  useEffect(() => {
    if (stage !== 'CALIBRATING') return;

    const canvas = document.createElement('canvas');
    const iv = setInterval(() => {
      if (document.hidden) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      canvas.width = FRAME_W;
      canvas.height = FRAME_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, FRAME_W, FRAME_H);
      const imageData = ctx.getImageData(0, 0, FRAME_W, FRAME_H);

      const frameMessage: FrameMessage = {
        width: FRAME_W,
        height: FRAME_H,
        data: new Uint8Array(imageData.data.buffer),
        timestamp: Date.now(),
      };

      window.electronAPI.sendFrame(frameMessage);
    }, FRAME_INTERVAL_MS);

    return () => clearInterval(iv);
  }, [stage]);

  /** If the dialog unmounts while a session is active, cancel ML state. */
  useEffect(() => {
    return () => {
      void window.electronAPI.cancelCalibration();
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
        completionTimeoutRef.current = null;
      }
    };
  }, []);

  const startCalibration = useCallback(async () => {
    setFailReason(null);
    setProgress(0);
    setTimeRemaining(CALIBRATION_DURATION_SEC);
    await window.electronAPI.startCalibration();
    setStage('CALIBRATING');
  }, []);

  const requestCancel = useCallback(async () => {
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }
    await window.electronAPI.cancelCalibration();
    onCancel();
  }, [onCancel]);

  const cancelCalibration = useCallback(() => {
    if (stage === 'INSTRUCTION' || stage === 'CALIBRATING') {
      void requestCancel();
    }
  }, [stage, requestCancel]);

  useEscapeKey(cancelCalibration, stage !== 'COMPLETE');

  useEffect(() => {
    primaryActionRef.current?.focus();
  }, [stage]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calibration-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(10, 14, 23, 0.98) 0%, rgba(26, 31, 46, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8)',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(234, 88, 12, 0.3)',
          padding: 'var(--space-8)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'var(--gradient-orange)',
          }}
        />

        {stage === 'INSTRUCTION' && (
          <div className="animate-fadeIn">
            <div
              style={{
                textAlign: 'center',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: 'var(--space-4)',
                  background: 'var(--gradient-orange)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '3rem',
                  marginBottom: 'var(--space-4)',
                  boxShadow: '0 4px 20px rgba(234, 88, 12, 0.4)',
                }}
              >
                🎯
              </div>
              <h2
                id="calibration-title"
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  margin: 0,
                  marginBottom: 'var(--space-2)',
                  color: 'white',
                }}
              >
                Calibrate your posture
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1rem',
                  margin: 0,
                }}
              >
                Let&apos;s learn what good posture looks like for you
              </p>
            </div>

            <div
              style={{
                background: 'rgba(234, 88, 12, 0.1)',
                border: '1px solid rgba(234, 88, 12, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  marginTop: 0,
                  marginBottom: 'var(--space-4)',
                  color: '#fb923c',
                }}
              >
                Instructions
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  fontSize: '0.9rem',
                  lineHeight: 1.8,
                  color: 'var(--text-primary)',
                }}
              >
                <li style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <span style={{ color: '#fb923c' }}>1.</span>
                  <span>Sit upright with your back straight against your chair</span>
                </li>
                <li style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <span style={{ color: '#fb923c' }}>2.</span>
                  <span>Relax your shoulders and keep them level</span>
                </li>
                <li style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <span style={{ color: '#fb923c' }}>3.</span>
                  <span>Position your monitor at eye level, about 50–70cm away</span>
                </li>
                <li style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <span style={{ color: '#fb923c' }}>4.</span>
                  <span>
                    Maintain this position for <strong>60 seconds</strong>
                  </span>
                </li>
              </ul>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 'var(--space-4)',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => void requestCancel()}
                className="btn btn-ghost"
                style={{
                  padding: 'var(--space-3) var(--space-6)',
                  fontSize: '1rem',
                }}
              >
                Cancel
              </button>
              <button
                ref={primaryActionRef}
                type="button"
                onClick={() => void startCalibration()}
                className="btn btn-active"
                style={{
                  padding: 'var(--space-3) var(--space-6)',
                  fontSize: '1rem',
                  background: 'var(--gradient-orange)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.4)',
                }}
              >
                Start calibration
              </button>
            </div>
          </div>
        )}

        {stage === 'CALIBRATING' && (
          <div className="animate-fadeIn">
            <div
              style={{
                textAlign: 'center',
                marginBottom: 'var(--space-4)',
              }}
            >
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  margin: 0,
                  marginBottom: 'var(--space-2)',
                  color: 'white',
                }}
              >
                Calibrating…
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  margin: 0,
                }}
              >
                Hold your best posture. Stay in frame so we can capture your baseline.
              </p>
            </div>

            <div
              style={{
                position: 'relative',
                marginBottom: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '2px solid var(--brand-orange)',
                boxShadow: '0 4px 20px rgba(234, 88, 12, 0.3)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '320px',
                  background: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <video
                  ref={videoRef}
                  id="calibration-video"
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: 'var(--space-4)',
                    left: 'var(--space-4)',
                    right: 'var(--space-4)',
                    padding: 'var(--space-3)',
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(234, 88, 12, 0.5)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      fontSize: '0.875rem',
                      color: 'white',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }} aria-hidden>
                      💡
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '4px' }}>Tips</div>
                      <div style={{ fontSize: '0.75rem', color: '#fb923c' }}>
                        Keep shoulders relaxed and level
                        <br />
                        Back against the chair
                        <br />
                        Face the camera
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    bottom: 'var(--space-4)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: 'var(--space-3) var(--space-6)',
                    background: 'rgba(234, 88, 12, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 'var(--radius-full)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: 'white',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <span aria-hidden>⏱️</span>
                    <span>{timeRemaining}s</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-full)',
                height: '12px',
                overflow: 'hidden',
                marginBottom: 'var(--space-3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                style={{
                  background: 'var(--gradient-orange)',
                  height: '100%',
                  width: `${progress}%`,
                  transition: 'width 0.15s linear',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: '0 0 10px rgba(234, 88, 12, 0.5)',
                }}
              />
            </div>

            <div
              style={{
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: '0.875rem',
                marginBottom: 'var(--space-4)',
              }}
            >
              {Math.round(progress)}% complete
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="button" onClick={() => void requestCancel()} className="btn btn-ghost">
                Cancel calibration
              </button>
            </div>
          </div>
        )}

        {stage === 'COMPLETE' && (
          <div className="animate-fadeIn" style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-block',
                padding: 'var(--space-4)',
                background: 'var(--gradient-success)',
                borderRadius: '50%',
                fontSize: '4rem',
                marginBottom: 'var(--space-4)',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
              }}
              aria-hidden
            >
              ✓
            </div>
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                margin: 0,
                marginBottom: 'var(--space-2)',
                color: 'white',
              }}
            >
              Calibration complete
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '1rem',
                margin: 0,
              }}
            >
              ErgoSense saved your personal posture baseline.
            </p>
          </div>
        )}

        {stage === 'FAILED' && (
          <div className="animate-fadeIn" style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                margin: 0,
                marginBottom: 'var(--space-3)',
                color: 'white',
              }}
            >
              Calibration did not finish
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 1.6 }}>
              {failReason || 'Something went wrong. You can try again.'}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void requestCancel()}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-active"
                style={{ background: 'var(--gradient-orange)', border: 'none' }}
                onClick={() => {
                  setFailReason(null);
                  setStage('INSTRUCTION');
                }}
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
