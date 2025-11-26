import React from 'react';

interface BreakCountdownProps {
  timeRemaining: number; // seconds until next break
  isQuietMode?: boolean;
  onViewDetails?: () => void;
}

export const BreakCountdown: React.FC<BreakCountdownProps> = ({ 
  timeRemaining,
  isQuietMode = false,
  onViewDetails 
}) => {
  if (isQuietMode) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--text-tertiary)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 1000,
          opacity: 0.8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: '1.25rem' }}>🌙</span>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Quiet Mode
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Break reminders paused
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Convert seconds to minutes
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  // Color progression: green → yellow → red
  let color = '#10b981'; // green
  if (minutes < 5) {
    color = '#ef4444'; // red
  } else if (minutes < 15) {
    color = '#f59e0b'; // yellow
  }
  
  // Format time display
  const timeText = minutes > 0 
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : `${seconds}s`;

  return (
    <div
      onClick={onViewDetails}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: 'var(--space-3) var(--space-4)',
        background: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 'var(--radius-lg)',
        border: `2px solid ${color}`,
        boxShadow: `0 4px 16px ${color}40`,
        cursor: 'pointer',
        zIndex: 1000,
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          Next break in
        </div>
        <div style={{ 
          fontSize: '1rem', 
          fontWeight: 800, 
          color,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {timeText}
        </div>
      </div>
    </div>
  );
};
