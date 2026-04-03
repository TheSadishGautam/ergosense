import { useState } from 'react';
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
import { Shield } from 'lucide-react';
import { AppShell, AppView } from './components/layout/AppShell';
import { useLiveState } from './hooks/useLiveState';
import { useBreakManager } from './hooks/useBreakManager';
import { useOnboarding } from './hooks/useOnboarding';
import { usePostureStretch } from './hooks/usePostureStretch';
import './styles.css';

function App() {
  const [view, setView] = useState<AppView>('LIVE');
  const [showCalibration, setShowCalibration] = useState(false);
  const { loading, showOnboarding, completeOnboarding } = useOnboarding();
  const { liveState, showUpdateBanner, dismissUpdateBanner } = useLiveState();
  const {
    showStretchGuide,
    openStretchGuide,
    completeStretchGuide,
    snoozeStretchGuide,
    dismissStretchGuide,
  } = usePostureStretch(liveState, showCalibration);
  const {
    showBreakPrompt,
    breakDuration,
    timeUntilBreak,
    showBreakCountdown,
    isQuietMode,
    handleTakeBreak,
    handleSnoozeBreak,
    handleSkipBreak,
  } = useBreakManager(liveState);

  const handleCalibrationComplete = () => {
    setShowCalibration(false);
  };

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0e17',
          color: 'white',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <AppShell
      view={view}
      onViewChange={setView}
      footerContent={
        <div className="flex justify-between items-center">
          <div>ErgoSense v1.0 • Desktop Ergonomics Assistant</div>
          <div className="flex items-center gap-4">
            {liveState && (
              <>
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#10b981',
                    }}
                    className="animate-pulse"
                  />
                  <span>System Active</span>
                </div>
                <div>Posture: {(liveState.postureScore * 100).toFixed(0)}%</div>
              </>
            )}
          </div>
        </div>
      }
    >
      {showUpdateBanner && <UpdateBanner onDismiss={dismissUpdateBanner} />}
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
      {showCalibration && <CalibrationView onComplete={handleCalibrationComplete} onCancel={() => setShowCalibration(false)} />}
      {showStretchGuide && <StretchGuide onComplete={completeStretchGuide} onSnooze={snoozeStretchGuide} onDismiss={dismissStretchGuide} />}
      <section
        id="panel-live"
        role="tabpanel"
        aria-labelledby="tab-live"
        aria-hidden={view !== 'LIVE'}
        style={{ display: view === 'LIVE' ? 'block' : 'none' }}
        className="animate-fadeIn"
      >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
            }}
          >
            <h1 id="live-monitoring-title" style={{ marginBottom: 'var(--space-6)', textAlign: 'center', fontSize: '1.75rem' }}>
              Real-Time Ergonomics Monitoring
            </h1>
            <div className="flex gap-8 justify-center" style={{ flexWrap: 'wrap' }}>
              <div>
                <h2
                  id="camera-feed-title"
                  style={{
                    fontSize: '1rem',
                    marginBottom: 'var(--space-4)',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                  }}
                >
                  Camera Feed
                </h2>
                <WebcamView />
                <div
                  style={{
                    marginTop: 'var(--space-4)',
                    padding: 'var(--space-4)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 'var(--radius-lg)',
                    maxWidth: '640px',
                    display: 'flex',
                    alignItems: 'start',
                    gap: 'var(--space-3)',
                  }}
                >
                  <Shield size={24} className="text-success" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--success-light)' }}>
                      100% Private & Secure
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginTop: 'var(--space-1)',
                      }}
                    >
                      All AI processing happens locally on your device. No video or images are ever recorded, stored, or sent
                      to the cloud. Your privacy is guaranteed.
                    </p>
                  </div>
                </div>
                <SystemMonitor />
              </div>
              <div>
                <h2
                  id="health-metrics-title"
                  style={{
                    fontSize: '1rem',
                    marginBottom: 'var(--space-4)',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                  }}
                >
                  Health Metrics
                </h2>
                <StatusHUD state={liveState} />
              </div>
            </div>
          </div>
      </section>
      <section
        id="panel-dashboard"
        role="tabpanel"
        aria-labelledby="tab-dashboard"
        aria-hidden={view !== 'DASHBOARD'}
        style={{ display: view === 'DASHBOARD' ? 'block' : 'none' }}
      >
        <Dashboard />
      </section>
      <section
        id="panel-settings"
        role="tabpanel"
        aria-labelledby="tab-settings"
        aria-hidden={view !== 'SETTINGS'}
        style={{ display: view === 'SETTINGS' ? 'block' : 'none' }}
      >
        <Settings onOpenCalibration={() => setShowCalibration(true)} onOpenStretchGuide={openStretchGuide} />
      </section>

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
    </AppShell>
  );
}

export default App;
