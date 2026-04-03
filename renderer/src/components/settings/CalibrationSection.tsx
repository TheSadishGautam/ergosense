import React from 'react';
import { Activity } from 'lucide-react';
import { SettingsSectionCard } from './SettingsSectionCard';

interface CalibrationSectionProps {
  onOpenCalibration: () => void;
}

export const CalibrationSection: React.FC<CalibrationSectionProps> = ({ onOpenCalibration }) => {
  return (
    <SettingsSectionCard style={{ border: '2px solid var(--brand-orange)' }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
        <div
          style={{
            padding: 'var(--space-2)',
            background: 'var(--gradient-orange)',
            borderRadius: 'var(--radius-md)',
            fontSize: '1.25rem',
          }}
        >
          <Activity size={20} />
        </div>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Personal Posture Baseline</h3>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
        Calibrate ErgoSense to learn YOUR ideal posture. This creates a personalized baseline instead of using generic standards.
      </p>

      <div
        style={{
          padding: 'var(--space-4)',
          background: 'rgba(234, 88, 12, 0.1)',
          border: '1px solid rgba(234, 88, 12, 0.3)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>✨ How it works:</div>
          <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', color: 'var(--text-secondary)' }}>
            <li>Sit in your best posture for 60 seconds</li>
            <li>ErgoSense measures your shoulder angle, neck position, and distance</li>
            <li>Future alerts are personalized to YOU</li>
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenCalibration}
        className="btn"
        style={{
          background: 'var(--gradient-orange)',
          color: 'white',
          width: '100%',
          padding: 'var(--space-4)',
          fontSize: '1rem',
          fontWeight: 700,
        }}
      >
        <Activity size={20} /> Start Calibration (60s)
      </button>
    </SettingsSectionCard>
  );
};
