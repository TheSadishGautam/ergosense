import React from 'react';

interface UpdateBannerProps {
  onDismiss: () => void;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({ onDismiss }) => {
  const handleDownload = () => {
    window.open('https://github.com/TheSadishGautam/ErgoSense/releases/latest', '_blank');
  };

  return (
    <div
      role="region"
      aria-label="App update available"
      style={{
        background: 'linear-gradient(90deg, #ea580c 0%, #c2410c 100%)',
        color: 'white',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '1.2rem' }}>🚀</span>
        <div>
          <span style={{ fontWeight: 600 }}>New version available!</span>
          <span style={{ marginLeft: '8px', opacity: 0.9, fontSize: '0.9rem' }}>
            A new update for ErgoSense is ready to download.
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          className="update-banner-download-btn"
          onClick={handleDownload}
          style={{
            background: 'white',
            color: '#ea580c',
            border: 'none',
            padding: '6px 16px',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Download Update
        </button>
        <button
          type="button"
          className="update-banner-dismiss-btn"
          onClick={onDismiss}
          aria-label="Dismiss update notice"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};
