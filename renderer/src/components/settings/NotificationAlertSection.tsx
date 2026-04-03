import React, { useId } from 'react';
import { Bell } from 'lucide-react';
import { SettingsSectionCard } from './SettingsSectionCard';

export interface NotificationAlertSectionProps {
  title: string;
  description: string;
  headerEmoji: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  thresholdLabel: string;
  thresholdDisplay: React.ReactNode;
  sliderMin: number;
  sliderMax: number;
  sliderStep?: number;
  sliderValue: number;
  onSliderChange: (value: number) => void;
  helperText: string;
  onTest: () => void;
  testButtonStyle?: 'emoji' | 'bell';
}

export const NotificationAlertSection: React.FC<NotificationAlertSectionProps> = ({
  title,
  description,
  headerEmoji,
  enabled,
  onEnabledChange,
  thresholdLabel,
  thresholdDisplay,
  sliderMin,
  sliderMax,
  sliderStep = 1,
  sliderValue,
  onSliderChange,
  helperText,
  onTest,
  testButtonStyle = 'emoji',
}) => {
  const sliderId = useId();
  const helperId = useId();

  return (
    <SettingsSectionCard>
      <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: '1.5rem' }}>{headerEmoji}</span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{title}</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: 0 }}>{description}</p>
        </div>
        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 600 }}>Enabled</span>
        </label>
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2)' }}>
          <label htmlFor={sliderId} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {thresholdLabel}
          </label>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--brand-orange)' }}>
            {thresholdDisplay}
          </span>
        </div>
        <input
          id={sliderId}
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={sliderStep}
          value={sliderValue}
          onChange={(e) => onSliderChange(parseInt(e.target.value, 10))}
          disabled={!enabled}
          aria-describedby={helperId}
          style={{ width: '100%' }}
        />
        <p id={helperId} style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
          {helperText}
        </p>
      </div>

      <button
        type="button"
        onClick={onTest}
        className={`btn btn-sm ${testButtonStyle === 'bell' ? 'flex items-center gap-2' : ''}`}
        style={{ background: 'var(--gradient-orange)', color: 'white' }}
      >
        {testButtonStyle === 'bell' ? (
          <>
            <Bell size={16} /> Test Alert
          </>
        ) : (
          <>🔔 Test Alert</>
        )}
      </button>
    </SettingsSectionCard>
  );
};
