import { useEffect, useState } from 'react';
import { WebcamView } from './components/WebcamView';
import { StatusHUD } from './components/StatusHUD';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { Onboarding } from './components/Onboarding';
import { UpdateBanner } from './components/UpdateBanner';
import { CalibrationView } from './components/CalibrationView';
import { StretchGuide } from './components/StretchGuide';
import { SystemMonitor } from './components/SystemMonitor';
import { BreakCountdown } from './components/BreakCountdown';
import { BreakPrompt } from './components/BreakPrompt';
import { LiveState } from '../../models/types';
import { Lock, Shield, Activity, LayoutDashboard, Settings as SettingsIcon, Video, RotateCcw } from 'lucide-react';
import logoIcon from './assets/icon.png';
import './styles.css';

function App() {
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [view, setView] = useState<'LIVE' | 'DASHBOARD' | 'SETTINGS'>('LIVE');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showStretchGuide, setShowStretchGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [poorPostureStartTime, setPoorPostureStartTime] = useState<number | null>(null);
  
  // Break management state
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeUntilBreak, setTimeUntilBreak] = useState(0);
  const [showBreakCountdown, setShowBreakCountdown] = useState(false);
  const [isQuietMode, setIsQuietMode] = useState(false);

  useEffect(() => {
    // Check onboarding status
    const checkOnboarding = async () => {
      try {
        const completed = await window.electronAPI.getAppSetting('onboardingCompleted');
        setShowOnboarding(!completed);
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
        setShowOnboarding(true); // Default to showing if error
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();

    // Listen for updates from Main process
    const cleanup = window.electronAPI.onLiveStateUpdate((state) => {
      setLiveState(state);
    });

    // Listen for app updates
    const cleanupUpdate = window.electronAPI.onUpdateAvailable(() => {
      setShowUpdateBanner(true);
    });

    return () => {
      cleanup();
      cleanupUpdate();
    };
  }, []);

  // Break event listeners
  useEffect(() => {
    const unsubCountdown = window.electronAPI.onBreakCountdownUpdate((data) => {
      setTimeUntilBreak(data.timeRemaining);
      setIsQuietMode(!!data.isQuietMode);
      setShowBreakCountdown(true);
    });

    const unsubBreakDue = window.electronAPI.onBreakDue((data) => {
      setBreakDuration(data.duration);
      setShowBreakPrompt(true);
      // Optional: Play sound notification
    });

    const unsubWarning = window.electronAPI.onBreakWarning((data) => {
      // Optional: Play warning ping at 5 minutes
      console.log(`Break in ${data.minutesRemaining} minutes`);
    });

    return () => {
      unsubCountdown();
      unsubBreakDue();
      unsubWarning();
    };
  }, []);

  const handleTakeBreak = async () => {
    setShowBreakPrompt(false);
    await window.electronAPI.startBreak();
    // Break timer would be managed by the app
    // After break ends, call endBreak with current strain
    setTimeout(async () => {
      const currentStrain = liveState ? (liveState.postureScore + liveState.eyeStrainScore) / 2 : 0;
      await window.electronAPI.endBreak(currentStrain);
    }, breakDuration * 60 * 1000);
  };

  const handleSnoozeBreak = async () => {
    setShowBreakPrompt(false);
    await window.electronAPI.snoozeBreak();
  };

  const handleSkipBreak = async () => {
    setShowBreakPrompt(false);
    await window.electronAPI.skipBreak();
  };


  // Track poor posture and trigger stretch guide
  useEffect(() => {
    if (!liveState) return;

    const POOR_POSTURE_THRESHOLD = 10 * 60 * 1000; // 10 minutes

    if (liveState.postureState === 'BAD') {
      if (poorPostureStartTime === null) {
        setPoorPostureStartTime(Date.now());
      } else {
        const duration = Date.now() - poorPostureStartTime;
        if (duration >= POOR_POSTURE_THRESHOLD && !showStretchGuide && !showCalibration) {
          setShowStretchGuide(true);
          setPoorPostureStartTime(null); // Reset timer
        }
      }
    } else {
      // Good posture, reset timer
      if (poorPostureStartTime !== null) {
        setPoorPostureStartTime(null);
      }
    }
  }, [liveState, poorPostureStartTime, showStretchGuide, showCalibration]);

  const handleOnboardingComplete = async () => {
    try {
      await window.electronAPI.setAppSetting('onboardingCompleted', true);
      setShowOnboarding(false);
    } catch (err) {
      console.error('Failed to save onboarding status:', err);
      setShowOnboarding(false);
    }
  };

  const handleCalibrationComplete = () => {
    setShowCalibration(false);
  };

  const handleStretchComplete = () => {
    setShowStretchGuide(false);
  };

  const handleStretchSnooze = () => {
    setShowStretchGuide(false);
    // Restart poor posture timer (5 minutes from now will trigger again if still bad posture)
    setPoorPostureStartTime(Date.now() - (5 * 60 * 1000)); // Set timer to 5 minutes ago
  };

  const handleStretchDismiss = () => {
    setShowStretchGuide(false);
    setPoorPostureStartTime(null); // Reset completely
  };

  // Expose calibration trigger for Settings component
  (window as any).triggerCalibration = () => {
    setShowCalibration(true);
  };

  // Expose stretch guide trigger for Settings component
  (window as any).triggerStretchGuide = () => {
    setShowStretchGuide(true);
  };

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0a0e17',
        color: 'white'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e17 0%, #1a1f2e 100%)',
    }}>
      {showUpdateBanner && <UpdateBanner onDismiss={() => setShowUpdateBanner(false)} />}
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      {showCalibration && <CalibrationView onComplete={handleCalibrationComplete} onCancel={() => setShowCalibration(false)} />}
      {showStretchGuide && <StretchGuide onComplete={handleStretchComplete} onSnooze={handleStretchSnooze} onDismiss={handleStretchDismiss} />}
      
      {/* Simple Clean Top Bar */}
      <div style={{
        background: 'rgba(17, 24, 39, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(234, 88, 12, 0.2)',
        padding: 'var(--space-4) var(--space-6)',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <img 
              src={logoIcon}
              alt="ErgoSense" 
              style={{
                width: '24px',
                height: '32px',
              }}
            />
            <div>
              <h1 style={{ 
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'white',
                margin: 0,
                lineHeight: 1,
              }}>
                ErgoSense
              </h1>
              <div style={{
                fontSize: '0.7rem',
                color: 'var(--text-tertiary)',
                marginTop: '2px',
              }}>
                AI Ergonomics Assistant
              </div>
            </div>
          </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {[
                { id: 'LIVE', label: 'Live', icon: <Video size={18} /> },
                { id: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
                { id: 'SETTINGS', label: 'Settings', icon: <SettingsIcon size={18} /> },
              ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: view === tab.id ? 'var(--gradient-primary)' : 'transparent',
                  color: view === tab.id ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: 'var(--space-8)' }}>
        {view === 'LIVE' ? (
          <div className="animate-fadeIn">
            <div style={{ 
              maxWidth: '1200px', 
              margin: '0 auto',
            }}>
              <h2 style={{ 
                marginBottom: 'var(--space-6)',
                textAlign: 'center',
                fontSize: '1.75rem',
              }}>
                Real-Time Ergonomics Monitoring
              </h2>
              <div className="flex gap-8 justify-center" style={{ flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ 
                    fontSize: '1rem',
                    marginBottom: 'var(--space-4)',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                  }}>
                    Camera Feed
                  </h3>
                  <WebcamView />
                  <div style={{
                    marginTop: 'var(--space-4)',
                    padding: 'var(--space-4)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 'var(--radius-lg)',
                    maxWidth: '640px',
                    display: 'flex',
                    alignItems: 'start',
                    gap: 'var(--space-3)',
                  }}>
                    <Shield size={24} className="text-success" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--success-light)' }}>
                        100% Private & Secure
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                        All AI processing happens locally on your device. No video or images are ever recorded, stored, or sent to the cloud. Your privacy is guaranteed.
                      </p>
                    </div>
                  </div>
                  <SystemMonitor />
                </div>
                <div>
                  <h3 style={{ 
                    fontSize: '1rem',
                    marginBottom: 'var(--space-4)',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                  }}>
                    Health Metrics
                  </h3>
                  <StatusHUD state={liveState} />
                </div>
              </div>
            </div>
          </div>
        ) : view === 'DASHBOARD' ? (
          <Dashboard />
        ) : (
          <Settings />
        )}
      </div>

      {/* Footer */}
      {/* Break Management UI */}
      {showBreakCountdown && view === 'LIVE' && (
        <BreakCountdown 
          timeRemaining={timeUntilBreak} 
          isQuietMode={isQuietMode}
          onViewDetails={() => setView('SETTINGS')}
        />
      )}

      {showBreakPrompt && (
        <BreakPrompt
          duration={breakDuration}
          onTakeBreak={handleTakeBreak}
          onSnooze={handleSnoozeBreak}
          onSkip={handleSkipBreak}
        />
      )}

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(17, 24, 39, 0.8)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: 'var(--space-3) var(--space-8)',
        fontSize: '0.75rem',
        color: 'var(--text-tertiary)',
        textAlign: 'center',
      }}>
        <div className="flex justify-between items-center">
          <div>
            ErgoSense v1.0 • Desktop Ergonomics Assistant
          </div>
          <div className="flex items-center gap-4">
            {liveState && (
              <>
                <div className="flex items-center gap-2">
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                  }} className="animate-pulse" />
                  <span>System Active</span>
                </div>
                <div>
                  Posture: {(liveState.postureScore * 100).toFixed(0)}%
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
