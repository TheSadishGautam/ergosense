import React, { useState, useEffect } from 'react';

interface CalibrationViewProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const CalibrationView: React.FC<CalibrationViewProps> = ({ onComplete, onCancel }) => {
  const [stage, setStage] = useState<'INSTRUCTION' | 'CALIBRATING' | 'COMPLETE'>('INSTRUCTION');
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const CALIBRATION_DURATION = 60; // 60 seconds

  useEffect(() => {
    if (stage !== 'CALIBRATING') return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, CALIBRATION_DURATION - elapsed);
      const progressPercent = (elapsed / CALIBRATION_DURATION) * 100;

      setTimeRemaining(Math.ceil(remaining));
      setProgress(Math.min(100, progressPercent));

      if (remaining <= 0) {
        clearInterval(interval);
        setStage('COMPLETE');
        setTimeout(() => {
          onComplete();
        }, 2000); // Show success message for 2 seconds
      }
    }, 100);

    return () => clearInterval(interval);
  }, [stage, onComplete]);

  const startCalibration = () => {
    window.electronAPI.startCalibration();
    setStage('CALIBRATING');
  };

  // Start webcam when calibration begins
  useEffect(() => {
    if (stage !== 'CALIBRATING') return;

    let stream: MediaStream | null = null;
    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        const video = document.getElementById('calibration-video') as HTMLVideoElement;
        if (video && stream) {
          video.srcObject = stream;
        }
      } catch (err) {
        console.error('Failed to start webcam:', err);
      }
    };

    startWebcam();

    return () => {
      // Cleanup: stop webcam when unmounting or leaving calibration
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stage]);

  return (
    <div style={{
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
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(234, 88, 12, 0.3)',
        padding: 'var(--space-8)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Orange accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'var(--gradient-orange)',
        }} />

        {stage === 'INSTRUCTION' && (
          <div className="animate-fadeIn">
            <div style={{
              textAlign: 'center',
              marginBottom: 'var(--space-6)',
            }}>
              <div style={{
                display: 'inline-block',
                padding: 'var(--space-4)',
                background: 'var(--gradient-orange)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '3rem',
                marginBottom: 'var(--space-4)',
                boxShadow: '0 4px 20px rgba(234, 88, 12, 0.4)',
              }}>
                🎯
              </div>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                margin: 0,
                marginBottom: 'var(--space-2)',
                color: 'white',
              }}>
                Calibrate Your Posture
              </h2>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '1rem',
                margin: 0,
              }}>
                Let's learn what good posture looks like for you
              </p>
            </div>

            <div style={{
              background: 'rgba(234, 88, 12, 0.1)',
              border: '1px solid rgba(234, 88, 12, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              marginBottom: 'var(--space-6)',
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 700,
                marginTop: 0,
                marginBottom: 'var(--space-4)',
                color: '#fb923c',
              }}>
                📋 Instructions
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: '0.9rem',
                lineHeight: 1.8,
                color: 'var(--text-primary)',
              }}>
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
                  <span>Position your monitor at eye level, about 50-70cm away</span>
                </li>
                <li style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <span style={{ color: '#fb923c' }}>4.</span>
                  <span>Maintain this position for <strong>60 seconds</strong></span>
                </li>
              </ul>
            </div>

            <div style={{
              display: 'flex',
              gap: 'var(--space-4)',
              justifyContent: 'center',
            }}>
              <button
                onClick={onCancel}
                className="btn btn-ghost"
                style={{
                  padding: 'var(--space-3) var(--space-6)',
                  fontSize: '1rem',
                }}
              >
                Cancel
              </button>
              <button
                onClick={startCalibration}
                className="btn btn-active"
                style={{
                  padding: 'var(--space-3) var(--space-6)',
                  fontSize: '1rem',
                  background: 'var(--gradient-orange)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.4)',
                }}
              >
                Start Calibration
              </button>
            </div>
          </div>
        )}

        {stage === 'CALIBRATING' && (
          <div className="animate-fadeIn">
            <div style={{
              textAlign: 'center',
              marginBottom: 'var(--space-4)',
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                margin: 0,
                marginBottom: 'var(--space-2)',
                color: 'white',
              }}>
                Calibrating...
              </h2>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                margin: 0,
              }}>
                Hold your best posture. Stay still!
              </p>
            </div>

            {/* Camera Feed with Overlay */}
            <div style={{
              position: 'relative',
              marginBottom: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '2px solid var(--brand-orange)',
              boxShadow: '0 4px 20px rgba(234, 88, 12, 0.3)',
            }}>
              {/* WebcamView placeholder - We'll import this */}
              <div style={{
                width: '100%',
                height: '320px',
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                {/* This will be replaced with actual WebcamView */}
                <video
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
                
                {/* Real-time feedback overlay */}
                <div style={{
                  position: 'absolute',
                  top: 'var(--space-4)',
                  left: 'var(--space-4)',
                  right: 'var(--space-4)',
                  padding: 'var(--space-3)',
                  background: 'rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(234, 88, 12, 0.5)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    fontSize: '0.875rem',
                    color: 'white',
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>💡</span>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '4px' }}>Tips:</div>
                      <div style={{ fontSize: '0.75rem', color: '#fb923c' }}>
                        ✓ Keep shoulders relaxed and level<br />
                        ✓ Back straight against chair<br />
                        ✓ Monitor at eye level
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timer overlay */}
                <div style={{
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
                }}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'white',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}>
                    <span>⏱️</span>
                    <span>{timeRemaining}s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-full)',
              height: '12px',
              overflow: 'hidden',
              marginBottom: 'var(--space-3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <div style={{
                background: 'var(--gradient-orange)',
                height: '100%',
                width: `${progress}%`,
                transition: 'width 0.1s linear',
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 0 10px rgba(234, 88, 12, 0.5)',
              }} />
            </div>

            <div style={{
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: '0.875rem',
            }}>
              {Math.round(progress)}% complete
            </div>
          </div>
        )}

        {stage === 'COMPLETE' && (
          <div className="animate-fadeIn" style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-block',
              padding: 'var(--space-4)',
              background: 'var(--gradient-success)',
              borderRadius: '50%',
              fontSize: '4rem',
              marginBottom: 'var(--space-4)',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            }}>
              ✓
            </div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              margin: 0,
              marginBottom: 'var(--space-2)',
              color: 'white',
            }}>
              Calibration Complete!
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              margin: 0,
            }}>
              ErgoSense now knows your ideal posture
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
