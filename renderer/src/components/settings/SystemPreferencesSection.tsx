import React from 'react';
import { Settings as SettingsIcon, Volume2 } from 'lucide-react';
import { NotificationSettings } from '../../../../models/types';
import { SettingsSectionCard } from './SettingsSectionCard';

interface SystemPreferencesSectionProps {
  settings: NotificationSettings;
  setSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  autoStart: boolean;
  onAutoStartChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export const SystemPreferencesSection: React.FC<SystemPreferencesSectionProps> = ({
  settings,
  setSettings,
  autoStart,
  onAutoStartChange,
}) => {
  return (
    <SettingsSectionCard>
      <h3
        style={{
          marginBottom: 'var(--space-4)',
          fontSize: '1.25rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <SettingsIcon size={20} /> System & Preferences
      </h3>

      <div className="flex flex-col gap-4">
        <label
          className="flex items-center justify-between"
          style={{ cursor: 'pointer', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}
        >
          <div className="flex items-center gap-3">
            <Volume2 size={18} className="text-secondary" />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Notification Sound</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Play sound with notifications</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.sound}
            onChange={(e) => setSettings({ ...settings, sound: e.target.checked })}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
        </label>

        <label
          className="flex items-center justify-between"
          style={{ cursor: 'pointer', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}
        >
          <div>
            <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Run on Startup</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
              Automatically start ErgoSense when you log in
            </div>
          </div>
          <input
            type="checkbox"
            checked={autoStart}
            onChange={onAutoStartChange}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
        </label>

        <div
          style={{
            padding: 'var(--space-3)',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          <strong>ℹ️ Background Mode:</strong> Closing the window will minimize ErgoSense to the system tray. Right-click the tray icon
          to quit completely.
        </div>
      </div>
    </SettingsSectionCard>
  );
};
