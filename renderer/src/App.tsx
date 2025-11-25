import { useEffect, useState } from 'react';
import { WebcamView } from './components/WebcamView';
import { StatusHUD } from './components/StatusHUD';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { Onboarding } from './components/Onboarding';
import { LiveState } from '../../models/types';
import logoIcon from './assets/icon.png';
import './styles.css';

function App() {
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [view, setView] = useState<'LIVE' | 'DASHBOARD' | 'SETTINGS'>('LIVE');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

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

    return cleanup;
  }, []);

  const handleOnboardingComplete = async () => {
    try {
      await window.electronAPI.setAppSetting('onboardingCompleted', true);
      setShowOnboarding(false);
    } catch (err) {
      console.error('Failed to save onboarding status:', err);
      setShowOnboarding(false);
    }
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
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      
      {/* Top Bar */}
      <div style={{
        background: 'rgba(17, 24, 39, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(234, 88, 12, 0.2)',
        padding: 'var(--space-4) var(--space-8)',
      }} className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Logo Icon */}
            <img 
              src={logoIcon}
              alt="ErgoSense" 
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'contain',
              }}
            />
            <h1 style={{ 
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'white',
              margin: 0,
            }}>
              ErgoSense
            </h1>
          </div>
          <div className="badge badge-success" style={{ fontSize: '0.7rem' }}>
            LIVE
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setView('LIVE')} 
            className={`btn ${view === 'LIVE' ? 'btn-active' : 'btn-ghost'}`}
            style={{
              transition: 'all 0.3s ease',
              transform: view === 'LIVE' ? 'scale(1.05)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (view !== 'LIVE') {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (view !== 'LIVE') {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '';
              }
            }}
          >
            <span style={{ fontSize: '1.125rem', marginRight: 'var(--space-2)' }}>📹</span>
            Live View
          </button>
          <button 
            onClick={() => setView('DASHBOARD')} 
            className={`btn ${view === 'DASHBOARD' ? 'btn-active' : 'btn-ghost'}`}
            style={{
              transition: 'all 0.3s ease',
              transform: view === 'DASHBOARD' ? 'scale(1.05)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (view !== 'DASHBOARD') {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (view !== 'DASHBOARD') {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '';
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 'var(--space-2)' }}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            Dashboard
          </button>
          <button 
            onClick={() => setView('SETTINGS')} 
            className={`btn ${view === 'SETTINGS' ? 'btn-active' : 'btn-ghost'}`}
            style={{
              transition: 'all 0.3s ease',
              transform: view === 'SETTINGS' ? 'scale(1.05)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (view !== 'SETTINGS') {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (view !== 'SETTINGS') {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '';
              }
            }}
          >
            <span style={{ fontSize: '1.125rem', marginRight: 'var(--space-2)' }}>⚙️</span>
            Settings
          </button>
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
                    <span style={{ fontSize: '1.25rem' }}>🔒</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--success-light)' }}>
                        100% Private & Secure
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                        All AI processing happens locally on your device. No video or images are ever recorded, stored, or sent to the cloud. Your privacy is guaranteed.
                      </p>
                    </div>
                  </div>
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
