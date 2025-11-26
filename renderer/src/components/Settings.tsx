import React, { useState, useEffect, useRef } from 'react';
import { NotificationSettings, NotificationType } from '../../../models/types';
import { 
  Bell, Clock, Monitor, Settings as SettingsIcon, Volume2, 
  Moon, Sun, Check, X, RotateCcw, Save, Activity, Eye, Zap, 
  Trash2, Plus, AlertCircle 
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    posture: { enabled: true, threshold: 0.4 },
    eyeStrain: { enabled: true, threshold: 0.6 },
    blinkRate: { enabled: true, threshold: 10 },
    breaks: { enabled: true, intervalMinutes: 20 },
    sound: false,
  });
  
  const [breakSettings, setBreakSettings] = useState<any>({
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

  // Dirty state tracking
  const initialSettingsRef = useRef<NotificationSettings | null>(null);
  const initialBreakSettingsRef = useRef<any | null>(null);
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

  const resetToDefaults = () => {
    setSettings({
      posture: { enabled: true, threshold: 0.4 },
      eyeStrain: { enabled: true, threshold: 0.6 },
      blinkRate: { enabled: true, threshold: 10 },
      breaks: { enabled: true, intervalMinutes: 20 },
      sound: false,
    });
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
            className="btn btn-sm flex items-center gap-2"
            style={{ background: 'var(--gradient-orange)', color: 'white' }}
          >
            <Bell size={16} /> Test Alert
          </button>
        </div>

        {/* Smart Break Reminders */}
        <div className="card">
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
            
            {/* Base Interval */}
            <div>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2)' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Work Interval</label>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-orange)' }}>
                  {breakSettings.baseInterval} min
                </span>
              </div>
              <input
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

            {/* Break Duration */}
            <div>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2)' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Break Duration</label>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-orange)' }}>
                  {breakSettings.breakDuration} min
                </span>
              </div>
              <input
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

            {/* Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <label className="flex items-center gap-3" style={{ cursor: 'pointer', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
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

              <label className="flex items-center gap-3" style={{ cursor: 'pointer', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
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

            <label className="flex items-center gap-3" style={{ cursor: 'pointer', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
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

            {/* Quiet Hours */}
            <div style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Quiet Hours</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
                No break reminders during these times
              </div>

              {/* List of quiet hours */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                {breakSettings.quietHours && breakSettings.quietHours.map((range: any, index: number) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 'var(--space-2)',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
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
                {(!breakSettings.quietHours || breakSettings.quietHours.length === 0) && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    No quiet hours set
                  </div>
                )}
              </div>

              {/* Add new range */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <input
                  type="time"
                  id="quiet-start"
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: 'var(--space-1)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem'
                  }}
                />
                <span style={{ color: 'var(--text-tertiary)' }}>to</span>
                <input
                  type="time"
                  id="quiet-end"
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: 'var(--space-1)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem'
                  }}
                />
                <button
                  onClick={() => {
                    const startInput = document.getElementById('quiet-start') as HTMLInputElement;
                    const endInput = document.getElementById('quiet-end') as HTMLInputElement;
                    
                    if (startInput.value && endInput.value) {
                      const newHours = [...(breakSettings.quietHours || [])];
                      newHours.push({ start: startInput.value, end: endInput.value });
                      setBreakSettings({ ...breakSettings, quietHours: newHours });
                      
                      // Clear inputs
                      startInput.value = '';
                      endInput.value = '';
                    }
                  }}
                  className="btn btn-sm"
                  style={{ 
                    padding: 'var(--space-1) var(--space-3)',
                    fontSize: '0.75rem'
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              await window.electronAPI.startBreak();
            }}
            className="btn btn-sm flex items-center gap-2"
            style={{ background: 'var(--gradient-orange)', color: 'white' }}
          >
            <Bell size={16} /> Test Break Prompt
          </button>
        </div>

        {/* System Settings */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <SettingsIcon size={20} /> System & Preferences
          </h3>
          
          <div className="flex flex-col gap-4">
            <label className="flex items-center justify-between" style={{ cursor: 'pointer', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div className="flex items-center gap-3">
                <Volume2 size={18} className="text-secondary" />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Notification Sound</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                    Play sound with notifications
                  </div>
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

        {/* Posture Calibration */}
        <div className="card" style={{ border: '2px solid var(--brand-orange)' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{
              padding: 'var(--space-2)',
              background: 'var(--gradient-orange)',
              borderRadius: 'var(--radius-md)',
              fontSize: '1.25rem',
            }}>
              <Activity size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Personal Posture Baseline</h3>
          </div>
          
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Calibrate ErgoSense to learn YOUR ideal posture. This creates a personalized baseline instead of using generic standards.
          </p>

          <div style={{
            padding: 'var(--space-4)',
            background: 'rgba(234, 88, 12, 0.1)',
            border: '1px solid rgba(234, 88, 12, 0.3)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
          }}>
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
            onClick={() => {
              if ((window as any).triggerCalibration) {
                (window as any).triggerCalibration();
              }
            }}
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
        </div>

        {/* Stretch Guide Testing */}
        <div className="card" style={{ border: '2px solid #10b981' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{
              padding: 'var(--space-2)',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: 'var(--radius-md)',
              fontSize: '1.25rem',
            }}>
              <Activity size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Stretch Guide Testing</h3>
          </div>
          
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Test the micro-stretch animation feature. Normally triggers after 10 minutes of poor posture.
          </p>

          <button
            onClick={() => {
              if ((window as any).triggerStretchGuide) {
                (window as any).triggerStretchGuide();
              }
            }}
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
        </div>
      </div>

      {/* Action Buttons */}
      {/* These buttons are now replaced by the floating bar, but keeping them commented out for reference if needed */}
      {/* <div className="flex gap-4 justify-end" style={{ marginTop: 'var(--space-8)' }}>
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
      </div> */}

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
          onClick={handleReset}
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Reset
        </button>
        <button 
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
