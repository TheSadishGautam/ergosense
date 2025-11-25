import React, { useState, useEffect } from 'react';
import { NotificationSettings, NotificationType } from '../../../models/types';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    posture: { enabled: true, threshold: 0.4 },
    eyeStrain: { enabled: true, threshold: 0.6 },
    blinkRate: { enabled: true, threshold: 10 },
    breaks: { enabled: true, intervalMinutes: 20 },
    sound: false,
  });
  
  const [autoStart, setAutoStart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loaded = await window.electronAPI.getNotificationSettings();
      setSettings(loaded);
      
      // Load auto-start setting
      try {
        const isAutoStart = await window.electronAPI.getAutoStart();
        setAutoStart(isAutoStart);
      } catch (e) {
        console.warn('Auto-start not supported or failed to load', e);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoStartChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setAutoStart(newValue);
    try {
      await window.electronAPI.setAutoStart(newValue);
    } catch (err) {
      console.error('Failed to update auto-start:', err);
      // Revert on failure
      setAutoStart(!newValue);
      setMessage({ type: 'error', text: 'Failed to update startup settings' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await window.electronAPI.updateNotificationSettings(settings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async (type: NotificationType) => {
    try {
      await window.electronAPI.testNotification(type);
    } catch (err) {
      console.error('Failed to send test notification:', err);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      posture: { enabled: true, threshold: 0.4 },
      eyeStrain: { enabled: true, threshold: 0.6 },
      blinkRate: { enabled: true, threshold: 10 },
      breaks: { enabled: true, intervalMinutes: 20 },
      sound: false,
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <div className="animate-pulse">Loading settings...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1000px', margin: '0 auto' }} className="animate-fadeIn">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-2)', fontSize: '2rem', fontWeight: 800 }}>
          ⚙️ Notification Settings
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
          Configure alerts and break reminders for optimal ergonomic health
        </p>
      </div>

      {/* Settings Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Posture Alerts */}
        <div className="card">
          <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-4)' }}>
           <div>
              <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: '1.  5rem' }}>🧍</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Posture Alerts</h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: 0 }}>
                Get notified when your posture falls below the threshold
              </p>
            </div>
            <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.posture.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  posture: { ...settings.posture, enabled: e.target.checked }
                })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>Enabled</span>
            </label>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2)' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Alert Threshold</label>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--brand-orange)' }}>
                {(settings.posture.threshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.posture.threshold * 100}
              onChange={(e) => setSettings({
                ...settings,
                posture: { ...settings.posture, threshold: parseInt(e.target.value) / 100 }
              })}
              disabled={!settings.posture.enabled}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
              Alert when posture score falls below this value
            </p>
          </div>

          <button
            onClick={() => testNotification(NotificationType.POSTURE)}
            className="btn btn-sm"
            style={{ background: 'var(--gradient-orange)', color: 'white' }}
          >
            🔔 Test Alert
          </button>
        </div>

        {/* Eye Strain Alerts */}
        <div className="card">
          <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-4)' }}>
            <div>
              <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: '1.5rem' }}>👁️</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Eye Strain Alerts</h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: 0 }}>
                Get notified when eye strain exceeds the threshold
              </p>
            </div>
            <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.eyeStrain.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  eyeStrain: { ...settings.eyeStrain, enabled: e.target.checked }
                })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>Enabled</span>
            </label>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2)' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Alert Threshold</label>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--brand-orange)' }}>
                {(settings.eyeStrain.threshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.eyeStrain.threshold * 100}
              onChange={(e) => setSettings({
                ...settings,
                eyeStrain: { ...settings.eyeStrain, threshold: parseInt(e.target.value) / 100 }
              })}
              disabled={!settings.eyeStrain.enabled}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
              Alert when eye strain exceeds this value
            </p>
          </div>

          <button
            onClick={() => testNotification(NotificationType.EYE_STRAIN)}
            className="btn btn-sm"
            style={{ background: 'var(--gradient-orange)', color: 'white' }}
          >
            🔔 Test Alert
          </button>
        </div>

        {/* Blink Rate Alerts */}
        <div className="card">
          <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-4)' }}>
            <div>
              <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: '1.5rem' }}>✨</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Blink Rate Alerts</h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: 0 }}>
                Get notified when blink rate is too low
              </p>
            </div>
            <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.blinkRate.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  blinkRate: { ...settings.blinkRate, enabled: e.target.checked }
                })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>Enabled</span>
            </label>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2)' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Minimum Blink Rate</label>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--brand-orange)' }}>
                {settings.blinkRate.threshold} /min
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              value={settings.blinkRate.threshold}
              onChange={(e) => setSettings({
                ...settings,
                blinkRate: { ...settings.blinkRate, threshold: parseInt(e.target.value) }
              })}
              disabled={!settings.blinkRate.enabled}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
              Alert when blink rate falls below this value (healthy: 12-20/min)
            </p>
          </div>

          <button
            onClick={() => testNotification(NotificationType.BLINK_RATE)}
            className="btn btn-sm"
            style={{ background: 'var(--gradient-orange)', color: 'white' }}
          >
            🔔 Test Alert
          </button>
        </div>

        {/* Break Reminders */}
        <div className="card">
          <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-4)' }}>
            <div>
              <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: '1.5rem' }}>⏰</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Break Reminders</h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: 0 }}>
                Regular reminders to follow the 20-20-20 rule
              </p>
            </div>
            <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.breaks.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  breaks: { ...settings.breaks, enabled: e.target.checked }
                })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>Enabled</span>
            </label>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-2)', display: 'block' }}>
              Reminder Interval
            </label>
            <div className="flex gap-2">
              {[10, 20, 30, 60].map(interval => (
                <button
                  key={interval}
                  onClick={() => setSettings({
                    ...settings,
                    breaks: { ...settings.breaks, intervalMinutes: interval }
                  })}
                  disabled={!settings.breaks.enabled}
                  className="btn btn-sm"
                  style={{
                    background: settings.breaks.intervalMinutes === interval ? 'var(--gradient-orange)' : 'transparent',
                    color: settings.breaks.intervalMinutes === interval ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--brand-orange)',
                  }}
                >
                  {interval} min
                </button>
              ))}
            </div>
            <div style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3)',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
            }}>
              <strong>💡 20-20-20 Rule:</strong> Every 20 minutes, look at something 20 feet away for 20 seconds
            </div>
          </div>

          <button
            onClick={() => testNotification(NotificationType.BREAK_REMINDER)}
            className="btn btn-sm"
            style={{ background: 'var(--gradient-orange)', color: 'white' }}
          >
            🔔 Test Reminder
          </button>
        </div>

        {/* System Settings */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: '1.25rem', fontWeight: 700 }}>⚙️ System & Preferences</h3>
          
          <div className="flex flex-col gap-4">
            <label className="flex items-center justify-between" style={{ cursor: 'pointer', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Notification Sound</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                  Play sound with notifications
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.sound}
                onChange={(e) => setSettings({ ...settings, sound: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>

            <label className="flex items-center justify-between" style={{ cursor: 'pointer', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Run on Startup</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                  Automatically start ErgoSense when you log in
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoStart}
                onChange={handleAutoStartChange}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>

             <div style={{ padding: 'var(--space-3)', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <strong>ℹ️ Background Mode:</strong> Closing the window will minimize ErgoSense to the system tray. Right-click the tray icon to quit completely.
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end" style={{ marginTop: 'var(--space-8)' }}>
        <button
          onClick={resetToDefaults}
          className="btn btn-ghost"
        >
          Reset to Defaults
        </button>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="btn btn-primary"
          style={{ background: 'var(--gradient-orange)', minWidth: '120px' }}
        >
          {saving ? 'Saving...' : '💾 Save Settings'}
        </button>
      </div>

      {/* Toast Notification */}
      {message && (
        <div
          style={{
            position: 'fixed',
            top: '100px',
            right: '2rem',
            padding: 'var(--space-4) var(--space-6)',
            background: message.type === 'success'
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)',
            color: 'white',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            animation: 'slideInLeft 0.3s ease',
            minWidth: '300px',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>
            {message.type === 'success' ? '✅' : '❌'}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: 'var(--space-1)' }}>
              {message.type === 'success' ? 'Success!' : 'Error'}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.95 }}>
              {message.text}
            </div>
          </div>
          <button
            onClick={() => setMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.25rem',
              padding: 'var(--space-1)',
              opacity: 0.8,
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
