import React from 'react';
import { LayoutDashboard, Settings as SettingsIcon, Video } from 'lucide-react';
import logoIcon from '../../assets/icon.png';

export type AppView = 'LIVE' | 'DASHBOARD' | 'SETTINGS';

interface AppShellProps {
  view: AppView;
  onViewChange: (view: AppView) => void;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}

const tabs: Array<{ id: AppView; label: string; icon: React.ReactNode }> = [
  { id: 'LIVE', label: 'Live', icon: <Video size={18} /> },
  { id: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'SETTINGS', label: 'Settings', icon: <SettingsIcon size={18} /> },
];

export const AppShell: React.FC<AppShellProps> = ({ view, onViewChange, children, footerContent }) => {
  const activeIndex = tabs.findIndex((tab) => tab.id === view);

  const focusTabAt = (index: number) => {
    const next = tabs[(index + tabs.length) % tabs.length];
    onViewChange(next.id);
    queueMicrotask(() => {
      const id = `tab-${next.id.toLowerCase()}`;
      const node = document.getElementById(id) as HTMLButtonElement | null;
      node?.focus();
    });
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusTabAt(index + 1);
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusTabAt(index - 1);
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      focusTabAt(0);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      focusTabAt(tabs.length - 1);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e17 0%, #1a1f2e 100%)' }}>
      <div
        style={{
          background: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(234, 88, 12, 0.2)',
          padding: 'var(--space-4) var(--space-6)',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <img src={logoIcon} alt="ErgoSense" style={{ width: '24px', height: '32px' }} />
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>ErgoSense</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                AI Ergonomics Assistant
              </div>
            </div>
          </div>

          <nav aria-label="Primary">
            <div style={{ display: 'flex', gap: 'var(--space-2)' }} role="tablist" aria-label="Main navigation">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                id={`tab-${tab.id.toLowerCase()}`}
                onClick={() => onViewChange(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                role="tab"
                aria-selected={view === tab.id}
                aria-controls={`panel-${tab.id.toLowerCase()}`}
                tabIndex={index === activeIndex ? 0 : -1}
                type="button"
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
          </nav>
        </div>
      </div>

      <main style={{ padding: 'var(--space-8) var(--space-8) calc(var(--space-16) + var(--space-6))' }}>{children}</main>

      <footer
        style={{
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
          zIndex: 'var(--z-overlay)',
        }}
      >
        {footerContent}
      </footer>
    </div>
  );
};
