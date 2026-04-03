import React, { useId } from 'react';
import { Bell, Clock } from 'lucide-react';
import { BreakSettings } from './types';
import { SettingsSectionCard } from './SettingsSectionCard';

interface SmartBreakSectionProps {
  breakSettings: BreakSettings;
  setBreakSettings: React.Dispatch<React.SetStateAction<BreakSettings>>;
  newQuietStart: string;
  newQuietEnd: string;
  setNewQuietStart: React.Dispatch<React.SetStateAction<string>>;
  setNewQuietEnd: React.Dispatch<React.SetStateAction<string>>;
  onTestBreakPrompt: () => Promise<void>;
}

export const SmartBreakSection: React.FC<SmartBreakSectionProps> = ({
  breakSettings,
  setBreakSettings,
  newQuietStart,
  newQuietEnd,
  setNewQuietStart,
  setNewQuietEnd,
  onTestBreakPrompt,
}) => {
  const baseIntervalId = useId();
  const breakDurationId = useId();
  const quietStartId = useId();
  const quietEndId = useId();

  return (
    <SettingsSectionCard>
      <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)' }}>
            <Clock size={20} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Smart Break Reminders</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: 0 }}>
            Intelligent break scheduling based on your activity and strain
          </p>
        </div>
        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={breakSettings.enabled}
            onChange={(e) => setBreakSettings({ ...breakSettings, enabled: e.target.checked })}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 600 }}>Enabled</span>
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2)' }}>
            <label htmlFor={baseIntervalId} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              Work Interval
            </label>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-orange)' }}>{breakSettings.baseInterval} min</span>
          </div>
          <input
            id={baseIntervalId}
            type="range"
            min="30"
            max="90"
            step="5"
            value={breakSettings.baseInterval}
            onChange={(e) => setBreakSettings({ ...breakSettings, baseInterval: parseInt(e.target.value) })}
            disabled={!breakSettings.enabled}
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
            Base time between breaks (adjusted by strain if adaptive)
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2)' }}>
            <label htmlFor={breakDurationId} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              Break Duration
            </label>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-orange)' }}>{breakSettings.breakDuration} min</span>
          </div>
          <input
            id={breakDurationId}
            type="range"
            min="3"
            max="15"
            step="1"
            value={breakSettings.breakDuration}
            onChange={(e) => setBreakSettings({ ...breakSettings, breakDuration: parseInt(e.target.value) })}
            disabled={!breakSettings.enabled}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <label
            className="flex items-center gap-3"
            style={{ cursor: 'pointer', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}
          >
            <input
              type="checkbox"
              checked={breakSettings.adaptToStrain}
              onChange={(e) => setBreakSettings({ ...breakSettings, adaptToStrain: e.target.checked })}
              disabled={!breakSettings.enabled}
              style={{ width: '18px', height: '18px' }}
            />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Adaptive Timing</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Adjust based on strain</div>
            </div>
          </label>

          <label
            className="flex items-center gap-3"
            style={{ cursor: 'pointer', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}
          >
            <input
              type="checkbox"
              checked={breakSettings.soundEnabled}
              onChange={(e) => setBreakSettings({ ...breakSettings, soundEnabled: e.target.checked })}
              disabled={!breakSettings.enabled}
              style={{ width: '18px', height: '18px' }}
            />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Sound Alerts</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Ping before break</div>
            </div>
          </label>
        </div>

        <label
          className="flex items-center gap-3"
          style={{ cursor: 'pointer', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}
        >
          <input
            type="checkbox"
            checked={breakSettings.showCountdown}
            onChange={(e) => setBreakSettings({ ...breakSettings, showCountdown: e.target.checked })}
            disabled={!breakSettings.enabled}
            style={{ width: '18px', height: '18px' }}
          />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Show Countdown</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Mini timer in bottom corner</div>
          </div>
        </label>

        <div style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Quiet Hours</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
            No break reminders during these times
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            {breakSettings.quietHours.map((range, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-2)',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                  {range.start} - {range.end}
                </span>
                <button
                  onClick={() => {
                    const newHours = [...breakSettings.quietHours];
                    newHours.splice(index, 1);
                    setBreakSettings({ ...breakSettings, quietHours: newHours });
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
            {breakSettings.quietHours.length === 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No quiet hours set</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <input
              id={quietStartId}
              type="time"
              value={newQuietStart}
              onChange={(e) => setNewQuietStart(e.target.value)}
              aria-label="Quiet hours start time"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: 'var(--space-1)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
              }}
            />
            <span style={{ color: 'var(--text-tertiary)' }}>to</span>
            <input
              id={quietEndId}
              type="time"
              value={newQuietEnd}
              onChange={(e) => setNewQuietEnd(e.target.value)}
              aria-label="Quiet hours end time"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: 'var(--space-1)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (newQuietStart && newQuietEnd) {
                  const newHours = [...breakSettings.quietHours];
                  newHours.push({ start: newQuietStart, end: newQuietEnd });
                  setBreakSettings({ ...breakSettings, quietHours: newHours });
                  setNewQuietStart('');
                  setNewQuietEnd('');
                }
              }}
              className="btn btn-sm"
              style={{
                padding: 'var(--space-1) var(--space-3)',
                fontSize: '0.75rem',
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={onTestBreakPrompt}
        className="btn btn-sm flex items-center gap-2"
        style={{ background: 'var(--gradient-orange)', color: 'white' }}
      >
        <Bell size={16} /> Test Break Prompt
      </button>
    </SettingsSectionCard>
  );
};
