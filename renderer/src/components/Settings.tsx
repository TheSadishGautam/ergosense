import React, { useState, useEffect, useRef } from 'react';
import { NotificationSettings, NotificationType } from '../../../models/types';
import { BreakSettings } from './settings/types';
import { NotificationAlertSection } from './settings/NotificationAlertSection';
import { SmartBreakSection } from './settings/SmartBreakSection';
import { SystemPreferencesSection } from './settings/SystemPreferencesSection';
import { CalibrationSection } from './settings/CalibrationSection';
import { StretchGuideSection } from './settings/StretchGuideSection';
import { Check, X, RotateCcw, Save, AlertCircle } from 'lucide-react';

interface SettingsProps {
  onOpenCalibration: () => void;
  onOpenStretchGuide: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onOpenCalibration, onOpenStretchGuide }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    posture: { enabled: true, threshold: 0.4 },
    eyeStrain: { enabled: true, threshold: 0.6 },
    blinkRate: { enabled: true, threshold: 10 },
    breaks: { enabled: true, intervalMinutes: 20 },
    sound: false,
  });
  
  const [breakSettings, setBreakSettings] = useState<BreakSettings>({
    enabled: true,
    baseInterval: 45,
    breakDuration: 5,
    adaptToStrain: true,
    soundEnabled: true,
    showCountdown: true,
    quietHours: [],
  });

  const [autoStart, setAutoStart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newQuietStart, setNewQuietStart] = useState('');
  const [newQuietEnd, setNewQuietEnd] = useState('');

  // Dirty state tracking
  const initialSettingsRef = useRef<NotificationSettings | null>(null);
  const initialBreakSettingsRef = useRef<BreakSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Check for changes
  useEffect(() => {
    if (!initialSettingsRef.current || !initialBreakSettingsRef.current) return;

    const settingsChanged = JSON.stringify(settings) !== JSON.stringify(initialSettingsRef.current);
    const breakSettingsChanged = JSON.stringify(breakSettings) !== JSON.stringify(initialBreakSettingsRef.current);
    
    setIsDirty(settingsChanged || breakSettingsChanged);
  }, [settings, breakSettings]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loaded = await window.electronAPI.getNotificationSettings();
      setSettings(loaded);
      
      // Load break settings
      try {
        const loadedBreaks = await window.electronAPI.getBreakSettings();
        if (loadedBreaks) {
          setBreakSettings(loadedBreaks);
          initialBreakSettingsRef.current = JSON.parse(JSON.stringify(loadedBreaks));
        }
      } catch (e) {
        console.warn('Failed to load break settings', e);
      }
      
      initialSettingsRef.current = JSON.parse(JSON.stringify(loaded));
      
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
      await window.electronAPI.updateBreakSettings(breakSettings);
      
      // Update initial state
      initialSettingsRef.current = JSON.parse(JSON.stringify(settings));
      initialBreakSettingsRef.current = JSON.parse(JSON.stringify(breakSettings));
      setIsDirty(false);

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

  const handleReset = () => {
    if (initialSettingsRef.current) {
      setSettings(JSON.parse(JSON.stringify(initialSettingsRef.current)));
    }
    if (initialBreakSettingsRef.current) {
      setBreakSettings(JSON.parse(JSON.stringify(initialBreakSettingsRef.current)));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <div className="animate-spin" style={{ marginRight: 'var(--space-2)' }}><RotateCcw size={20} /></div>
        Loading settings...
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
        <NotificationAlertSection
          title="Posture Alerts"
          description="Get notified when your posture falls below the threshold"
          headerEmoji="🧍"
          enabled={settings.posture.enabled}
          onEnabledChange={(enabled) =>
            setSettings({ ...settings, posture: { ...settings.posture, enabled } })
          }
          thresholdLabel="Alert Threshold"
          thresholdDisplay={`${(settings.posture.threshold * 100).toFixed(0)}%`}
          sliderMin={0}
          sliderMax={100}
          sliderValue={Math.round(settings.posture.threshold * 100)}
          onSliderChange={(v) =>
            setSettings({ ...settings, posture: { ...settings.posture, threshold: v / 100 } })
          }
          helperText="Alert when posture score falls below this value"
          onTest={() => testNotification(NotificationType.POSTURE)}
        />

        <NotificationAlertSection
          title="Eye Strain Alerts"
          description="Get notified when eye strain exceeds the threshold"
          headerEmoji="👁️"
          enabled={settings.eyeStrain.enabled}
          onEnabledChange={(enabled) =>
            setSettings({ ...settings, eyeStrain: { ...settings.eyeStrain, enabled } })
          }
          thresholdLabel="Alert Threshold"
          thresholdDisplay={`${(settings.eyeStrain.threshold * 100).toFixed(0)}%`}
          sliderMin={0}
          sliderMax={100}
          sliderValue={Math.round(settings.eyeStrain.threshold * 100)}
          onSliderChange={(v) =>
            setSettings({ ...settings, eyeStrain: { ...settings.eyeStrain, threshold: v / 100 } })
          }
          helperText="Alert when eye strain exceeds this value"
          onTest={() => testNotification(NotificationType.EYE_STRAIN)}
        />

        <NotificationAlertSection
          title="Blink Rate Alerts"
          description="Get notified when blink rate is too low"
          headerEmoji="✨"
          enabled={settings.blinkRate.enabled}
          onEnabledChange={(enabled) =>
            setSettings({ ...settings, blinkRate: { ...settings.blinkRate, enabled } })
          }
          thresholdLabel="Minimum Blink Rate"
          thresholdDisplay={`${settings.blinkRate.threshold} /min`}
          sliderMin={5}
          sliderMax={20}
          sliderValue={settings.blinkRate.threshold}
          onSliderChange={(v) =>
            setSettings({ ...settings, blinkRate: { ...settings.blinkRate, threshold: v } })
          }
          helperText="Alert when blink rate falls below this value (healthy: 12-20/min)"
          onTest={() => testNotification(NotificationType.BLINK_RATE)}
          testButtonStyle="bell"
        />

        <SmartBreakSection
          breakSettings={breakSettings}
          setBreakSettings={setBreakSettings}
          newQuietStart={newQuietStart}
          newQuietEnd={newQuietEnd}
          setNewQuietStart={setNewQuietStart}
          setNewQuietEnd={setNewQuietEnd}
          onTestBreakPrompt={async () => {
            await window.electronAPI.startBreak();
          }}
        />

        <SystemPreferencesSection
          settings={settings}
          setSettings={setSettings}
          autoStart={autoStart}
          onAutoStartChange={handleAutoStartChange}
        />

        <CalibrationSection onOpenCalibration={onOpenCalibration} />

        <StretchGuideSection onOpenStretchGuide={onOpenStretchGuide} />
      </div>

      {/* Floating Action Bar */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: `translateX(-50%) translateY(${isDirty ? '0' : '100px'})`,
        background: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: 'var(--space-3) var(--space-6)',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 100,
      }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Unsaved changes
        </div>
        <div style={{ height: '20px', width: '1px', background: 'var(--border-color)' }} />
        <button 
          type="button"
          onClick={handleReset}
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Reset
        </button>
        <button 
          type="button"
          onClick={saveSettings}
          className="btn btn-primary btn-sm flex items-center gap-2"
          disabled={saving || !isDirty}
        >
          {saving ? <div className="animate-spin"><RotateCcw size={14} /></div> : <Save size={16} />}
          Save Changes
        </button>
      </div>

      {/* Success/Error Toast */}
      {message && (
        <div
          role="alert"
          aria-live="assertive"
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
            {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
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
            type="button"
            onClick={() => setMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: 'var(--space-1)',
              opacity: 0.8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
