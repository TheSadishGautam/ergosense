import React from 'react';
import { LiveState } from '../../../models/types';
import { getPostureStatus, getEyeStatus, getBlinkStatus } from '../utils/statusHelpers';
import { COLORS } from '../utils/theme';
import { Moon, AlertTriangle, CheckCircle, Zap, Activity, Eye } from 'lucide-react';

interface StatusHUDProps {
  state: LiveState | null;
}

export const StatusHUD: React.FC<StatusHUDProps> = ({ state }) => {
  if (!state) {
    return (
      <div className="card" style={{ 
        padding: 'var(--space-8)', 
        textAlign: 'center',
        minWidth: '400px',
      }}>
        <div className="animate-pulse" style={{ color: 'var(--text-tertiary)' }}>
          Waiting for camera feed...
        </div>
      </div>
    );
  }

  if (state.isUserPresent === false) {
    return (
      <div className="card" style={{ 
        padding: 'var(--space-8)', 
        textAlign: 'center',
        minWidth: '400px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}>
        <div style={{ marginBottom: 'var(--space-4)', opacity: 0.5, display: 'flex', justifyContent: 'center' }}>
          <Moon size={48} />
        </div>
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>User Away</h3>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
          Monitoring paused until you return.
        </p>
      </div>
    );
  }

  const getPostureColor = () => {
    const status = getPostureStatus(state.postureScore);
    return COLORS[status];
  };

  const getEyeColor = () => {
    const status = getEyeStatus(state.eyeStrainScore);
    return COLORS[status];
  };

  const getBlinkRateColor = () => {
    const rate = state.blinkRate || 0;
    const status = getBlinkStatus(rate);
    return COLORS[status];
  };

  const posturePercentage = state.postureScore * 100;
  const eyePercentage = (1 - state.eyeStrainScore) * 100; // Invert for display

  // SVG circle parameters
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const getStrokeDashoffset = (percentage: number) => {
    return circumference - (percentage / 100) * circumference;
  };

  return (
    <div style={{ minWidth: '450px' }} className="animate-fadeIn">
      {/* Alert Banner */}
      {(state.postureScore < 0.4 || (state.blinkRate && state.blinkRate < 10)) && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
          border: '1px solid var(--danger)',
          marginBottom: 'var(--space-4)',
          padding: 'var(--space-4)',
        }}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="text-danger" />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--danger-light)', fontSize: '0.875rem' }}>
                Attention Required
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {state.postureScore < 0.4 && 'Poor posture detected. '}
                {state.blinkRate && state.blinkRate < 10 && 'Low blink rate. Take a break!'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Status Card */}
      <div className="card">
        <h3 style={{ 
          marginBottom: 'var(--space-6)', 
          fontSize: '1.25rem',
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Live Monitoring
        </h3>

        {/* Progress Circles */}
        <div className="flex justify-around" style={{ marginBottom: 'var(--space-6)' }}>
          {/* Posture Circle */}
          <div style={{ textAlign: 'center' }}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="var(--gray-800)"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={getPostureColor()}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={getStrokeDashoffset(posturePercentage)}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                className="animate-glow"
              />
              <text
                x="60"
                y="60"
                textAnchor="middle"
                dy="7"
                fontSize="24"
                fontWeight="700"
                fill="var(--text-primary)"
                transform="rotate(90 60 60)"
              >
                {Math.round(posturePercentage)}%
              </text>
            </svg>
            <div style={{ 
              marginTop: 'var(--space-2)', 
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
            }}>
              <Activity size={16} /> Posture
            </div>
            <div className="badge badge-success" style={{ 
              marginTop: 'var(--space-1)',
              background: `${getPostureColor()}20`,
              color: getPostureColor(),
              border: `1px solid ${getPostureColor()}`,
            }}>
              {state.postureState}
            </div>
          </div>

          {/* Eye Health Circle */}
          <div style={{ textAlign: 'center' }}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="var(--gray-800)"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={getEyeColor()}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={getStrokeDashoffset(eyePercentage)}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                className="animate-glow"
              />
              <text
                x="60"
                y="60"
                textAnchor="middle"
                dy="7"
                fontSize="24"
                fontWeight="700"
                fill="var(--text-primary)"
                transform="rotate(90 60 60)"
              >
                {Math.round(eyePercentage)}%
              </text>
            </svg>
            <div style={{ 
              marginTop: 'var(--space-2)', 
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
            }}>
              <Eye size={16} /> Eye Health
            </div>
            <div className="badge badge-info" style={{ 
              marginTop: 'var(--space-1)',
              background: `${getEyeColor()}20`,
              color: getEyeColor(),
              border: `1px solid ${getEyeColor()}`,
            }}>
              {state.eyeState}
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}>
          <div style={{ 
            padding: 'var(--space-4)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>
              BLINK RATE
            </div>
            <div style={{ 
              fontSize: '1.75rem', 
              fontWeight: 700,
              color: getBlinkRateColor(),
            }}>
              {state.blinkRate?.toFixed(0) || '0'}<span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>/min</span>
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-tertiary)',
              marginTop: 'var(--space-1)',
            }}>
              Target: 12-20/min
            </div>
          </div>

          <div style={{ 
            padding: 'var(--space-4)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>
              POSTURE SCORE
            </div>
            <div style={{ 
              fontSize: '1.75rem', 
              fontWeight: 700,
              color: getPostureColor(),
            }}>
              {(state.postureScore * 100).toFixed(0)}<span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>%</span>
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-tertiary)',
              marginTop: 'var(--space-1)',
            }}>
              {state.postureScore >= 0.7 ? 'Excellent!' : state.postureScore >= 0.4 ? 'Good' : 'Needs work'}
            </div>
          </div>

          <div style={{ 
            padding: 'var(--space-4)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>
              EYE STRAIN
            </div>
            <div style={{ 
              fontSize: '1.75rem', 
              fontWeight: 700,
              color: getEyeColor(),
            }}>
              {(state.eyeStrainScore * 100).toFixed(0)}<span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>%</span>
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-tertiary)',
              marginTop: 'var(--space-1)',
            }}>
              {state.eyeStrainScore <= 0.3 ? 'Low' : state.eyeStrainScore <= 0.6 ? 'Moderate' : 'High'}
            </div>
          </div>

          <div style={{ 
            padding: 'var(--space-4)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>
              OVERALL STATUS
            </div>
            <div style={{ 
              fontSize: '1.75rem', 
              fontWeight: 700,
              color: state.postureScore >= 0.7 && state.eyeStrainScore <= 0.3 ? '#10b981' : '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}>
              {state.postureScore >= 0.7 && state.eyeStrainScore <= 0.3 ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-tertiary)',
              marginTop: 'var(--space-1)',
            }}>
              {state.postureScore >= 0.7 && state.eyeStrainScore <= 0.3 ? 'Optimal' : 'Needs attention'}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {(state.blinkRate && state.blinkRate < 12) && (
          <div style={{
            padding: 'var(--space-4)',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--info)',
          }}>
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-info" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--info-light)' }}>
                  Tip: Blink more frequently
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Try the 20-20-20 rule to reduce eye strain
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
