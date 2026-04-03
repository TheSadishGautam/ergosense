import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { Clock, Footprints, Droplets, Eye, Activity, Coffee } from 'lucide-react';

interface BreakPromptProps {
  duration: number; // recommended break duration in minutes
  onTakeBreak: () => void;
  onSnooze: () => void;
  onSkip: () => void;
}

const breakSuggestions = [
  { icon: <Footprints size={32} />, text: 'Take a short walk' },
  { icon: <Droplets size={32} />, text: 'Get some water' },
  { icon: <Eye size={32} />, text: 'Look out the window' },
  { icon: <Activity size={32} />, text: 'Do some desk stretches' },
  { icon: <Coffee size={32} />, text: 'Make a cup of tea' },
];

export const BreakPrompt: React.FC<BreakPromptProps> = ({
  duration,
  onTakeBreak,
  onSnooze,
  onSkip,
}) => {
  const [suggestion] = useState(() => 
    breakSuggestions[Math.floor(Math.random() * breakSuggestions.length)]
  );
  const primaryActionRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    primaryActionRef.current?.focus();
  }, []);

  const skipBreakPrompt = useCallback(() => {
    onSkip();
  }, [onSkip]);
  useEscapeKey(skipBreakPrompt);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="break-prompt-title" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'fadeIn 0.3s ease',
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98) 0%, rgba(31, 41, 55, 0.98) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        maxWidth: '500px',
        width: '90%',
        border: '2px solid rgba(234, 88, 11, 0.5)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        animation: 'slideIn 0.4s ease',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)', display: 'flex', justifyContent: 'center' }}>
            <Clock size={48} />
          </div>
          <h2 id="break-prompt-title" style={{
            fontSize: '1.75rem', 
            fontWeight: 800, 
            margin: 0,
            marginBottom: 'var(--space-2)',
            background: 'linear-gradient(135deg, #ea580b 0%, #fb923c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Time for a Break!
          </h2>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-secondary)', 
            margin: 0,
          }}>
            You've been working hard. Take {duration} minutes to rest and recharge.
          </p>
        </div>

        {/* Suggestion */}
        <div style={{
          padding: 'var(--space-4)',
          background: 'rgba(234, 88, 11, 0.1)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(234, 88, 11, 0.2)',
          marginBottom: 'var(--space-6)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>
            {suggestion.icon}
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {suggestion.text}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button
            ref={primaryActionRef}
            type="button"
            onClick={onTakeBreak}
            className="break-primary-button"
            style={{
              padding: 'var(--space-4)',
              background: 'linear-gradient(135deg, #ea580b 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(234, 88, 11, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            Take Break ({duration} min)
          </button>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button
              type="button"
              onClick={onSnooze}
              className="break-secondary-button"
              style={{
                flex: 1,
                padding: 'var(--space-3)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Snooze 10 min
            </button>

            <button
              type="button"
              onClick={onSkip}
              className="break-skip-button"
              style={{
                flex: 1,
                padding: 'var(--space-3)',
                background: 'transparent',
                color: 'var(--text-tertiary)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Skip
            </button>
          </div>
        </div>

        {/* Info */}
        <div style={{
          marginTop: 'var(--space-4)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)',
        }}>
          Regular breaks improve focus and reduce strain
        </div>
      </div>
    </div>
  );
};
