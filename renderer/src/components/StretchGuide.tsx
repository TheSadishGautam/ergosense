import React, { useState, useEffect } from 'react';
import { StretchExercise, getStretchRoutine, calculateRoutineDuration } from '../../../models/stretches';

interface StretchGuideProps {
  onComplete: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
}

export const StretchGuide: React.FC<StretchGuideProps> = ({ onComplete, onSnooze, onDismiss }) => {
  const [routine] = useState<StretchExercise[]>(() => getStretchRoutine(3));
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(routine[0]?.duration || 0);
  const [isPaused, setIsPaused] = useState(false);

  const currentExercise = routine[currentExerciseIndex];
  const totalDuration = calculateRoutineDuration(routine);
  const progress = ((currentExerciseIndex / routine.length) + (1 - timeRemaining / currentExercise.duration) / routine.length) * 100;

  useEffect(() => {
    if (isPaused || !currentExercise) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Move to next exercise
          if (currentExerciseIndex < routine.length - 1) {
            setCurrentExerciseIndex(currentExerciseIndex + 1);
            setCurrentStep(0);
            return routine[currentExerciseIndex + 1].duration;
          } else {
            // Routine complete
            onComplete();
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentExerciseIndex, isPaused, routine, currentExercise, onComplete]);

  const handleNext = () => {
    if (currentExerciseIndex < routine.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentStep(0);
      setTimeRemaining(routine[currentExerciseIndex + 1].duration);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  if (!currentExercise) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, rgba(10, 14, 23, 0.98) 0%, rgba(26, 31, 46, 0.98) 100%)',
      backdropFilter: 'blur(20px)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--space-8)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-6)',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>
            ⏸️ Time for a Stretch Break!
          </h2>
          <p style={{ margin: 0, marginTop: 'var(--space-1)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Take a quick {totalDuration}-second break to relieve tension
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={onSnooze}
            className="btn btn-ghost"
            style={{ fontSize: '0.875rem' }}
          >
            ⏰ Snooze 5min
          </button>
          <button
            onClick={onDismiss}
            className="btn btn-ghost"
            style={{ fontSize: '0.875rem' }}
          >
            ✕ Dismiss
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 'var(--radius-full)',
        height: '8px',
        overflow: 'hidden',
        marginBottom: 'var(--space-6)',
      }}>
        <div style={{
          background: 'var(--gradient-orange)',
          height: '100%',
          width: `${progress}%`,
          transition: 'width 0.3s ease',
          borderRadius: 'var(--radius-full)',
        }} />
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
          borderRadius: 'var(--radius-xl)',
          border: `2px solid ${currentExercise.targetArea === 'eyes' ? '#3b82f6' : currentExercise.targetArea === 'neck' ? '#f59e0b' : '#10b981'}`,
          padding: 'var(--space-8)',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        }}>
          {/* Exercise indicator */}
          <div style={{
            position: 'absolute',
            top: 'var(--space-4)',
            right: 'var(--space-4)',
            background: 'rgba(234, 88, 12, 0.2)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#fb923c',
          }}>
            {currentExerciseIndex + 1} / {routine.length}
          </div>

          {/* Animation emoji */}
          <div style={{
            fontSize: '6rem',
            marginBottom: 'var(--space-4)',
            animation: 'float 3s ease-in-out infinite',
          }}>
            {currentExercise.animation}
          </div>

          {/* Exercise name */}
          <h3 style={{
            fontSize: '2rem',
            fontWeight: 800,
            margin: 0,
            marginBottom: 'var(--space-2)',
            color: 'white',
          }}>
            {currentExercise.name}
          </h3>

          {/* Description */}
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            margin: 0,
            marginBottom: 'var(--space-6)',
          }}>
            {currentExercise.description}
          </p>

          {/* Timer */}
          <div style={{
            display: 'inline-block',
            padding: 'var(--space-4) var(--space-6)',
            background: 'var(--gradient-orange)',
            borderRadius: 'var(--radius-full)',
            marginBottom: 'var(--space-6)',
            boxShadow: '0 4px 16px rgba(234, 88, 12, 0.4)',
          }}>
            <div style={{
              fontSize: '3rem',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1,
            }}>
              {timeRemaining}s
            </div>
          </div>

          {/* Instructions */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            textAlign: 'left',
            marginBottom: 'var(--space-6)',
          }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              marginBottom: 'var(--space-3)',
              color: '#fb923c',
            }}>
              📋 Instructions:
            </div>
            <ol style={{
              margin: 0,
              paddingLeft: 'var(--space-5)',
              fontSize: '0.875rem',
              lineHeight: 1.8,
              color: 'var(--text-primary)',
            }}>
              {currentExercise.instructions.map((instruction, i) => (
                <li key={i} style={{
                  marginBottom: 'var(--space-2)',
                  opacity: currentStep >= i ? 1 : 0.5,
                }}>
                  {instruction}
                </li>
              ))}
            </ol>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="btn"
              style={{
                background: isPaused ? 'var(--gradient-success)' : 'rgba(255, 255, 255, 0.1)',
                padding: 'var(--space-3) var(--space-6)',
              }}
            >
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            {currentExerciseIndex < routine.length - 1 && (
              <button
                onClick={handleSkip}
                className="btn btn-ghost"
                style={{ padding: 'var(--space-3) var(--space-6)' }}
              >
                ⏭️ Skip Exercise
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating animation keyframe */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};
