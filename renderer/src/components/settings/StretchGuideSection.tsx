import React from 'react';
import { Activity } from 'lucide-react';
import { SettingsSectionCard } from './SettingsSectionCard';

interface StretchGuideSectionProps {
  onOpenStretchGuide: () => void;
}

export const StretchGuideSection: React.FC<StretchGuideSectionProps> = ({ onOpenStretchGuide }) => {
  return (
    <SettingsSectionCard style={{ border: '2px solid #10b981' }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
        <div
          style={{
            padding: 'var(--space-2)',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: 'var(--radius-md)',
            fontSize: '1.25rem',
          }}
        >
          <Activity size={20} />
        </div>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Stretch Guide Testing</h3>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
        Test the micro-stretch animation feature. Normally triggers after 10 minutes of poor posture.
      </p>

      <button
        onClick={onOpenStretchGuide}
        className="btn"
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          width: '100%',
          padding: 'var(--space-4)',
          fontSize: '1rem',
          fontWeight: 700,
        }}
      >
        <Activity size={20} /> Test Stretch Guide
      </button>
    </SettingsSectionCard>
  );
};
