import React from 'react';
import { COLORS, GRADIENTS } from '../utils/theme';
import { StatusLevel } from '../utils/statusHelpers';
import { TrendingUp, TrendingDown, AlertTriangle, AlertOctagon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  status?: StatusLevel;
  icon?: React.ReactNode;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  status = 'good',
  icon,
  subtitle,
}) => {
  const getStatusGradient = () => {
    switch (status) {
      case 'excellent': return GRADIENTS.excellent;
      case 'good': return GRADIENTS.good;
      case 'warning': return GRADIENTS.warning;
      case 'danger': return GRADIENTS.danger;
      default: return GRADIENTS.card;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'excellent': return COLORS.excellent;
      case 'good': return COLORS.good;
      case 'warning': return COLORS.warning;
      case 'danger': return COLORS.danger;
      default: return COLORS.warning;
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />;
  };

  const getTrendColor = () => {
    if (!trend) return 'var(--text-tertiary)';
    if (title.toLowerCase().includes('strain')) {
      return trend < 0 ? 'var(--success-light)' : 'var(--danger-light)';
    }
    return trend > 0 ? 'var(--success-light)' : 'var(--danger-light)';
  };

  return (
    <div 
      className="card animate-fadeIn" 
      style={{
        position: 'relative',
        background: getStatusGradient(),
        border: `1px solid ${getStatusColor()}30`,
        overflow: 'hidden',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
        e.currentTarget.style.boxShadow = `0 12px 24px ${getStatusColor()}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Gradient Glow Effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${getStatusColor()} 0%, transparent 100%)`,
      }} />

      {/* Icon Background Blur */}
      {icon && (
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          fontSize: '6rem',
          opacity: 0.05,
          pointerEvents: 'none',
        }}>
          {icon}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: '0.7rem', 
              color: 'var(--text-tertiary)', 
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 700,
              marginBottom: 'var(--space-1)',
            }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ 
                fontSize: '0.7rem', 
                color: 'var(--text-tertiary)', 
                opacity: 0.7,
              }}>
                {subtitle}
              </div>
            )}
          </div>
          {icon && (
            <div style={{ 
              fontSize: '2rem',
              filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
            }}>
              {icon}
            </div>
          )}
        </div>

        {/* Value Display */}
        <div className="flex items-end justify-between" style={{ marginBottom: 'var(--space-2)' }}>
          <div className="flex items-baseline gap-2">
            <div style={{ 
              fontSize: '2.5rem', 
              fontWeight: 800, 
              color: 'var(--text-primary)',
              lineHeight: 1,
              background: `linear-gradient(135deg, ${getStatusColor()} 0%, ${getStatusColor()}80 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {value}
            </div>
            {unit && (
              <div style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-tertiary)', 
                fontWeight: 600,
                marginBottom: '0.25rem',
              }}>
                {unit}
              </div>
            )}
          </div>

          {trend !== undefined && trend !== 0 && (
            <div 
              className="flex items-center gap-1" 
              style={{
                padding: 'var(--space-1) var(--space-2)',
                background: getTrendColor() + '20',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: getTrendColor(),
              }}
            >
              <span style={{ fontSize: '1rem' }}>{getTrendIcon()}</span>
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div style={{
          width: '100%',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          marginTop: 'var(--space-3)',
        }}>
          <div style={{
            width: status === 'excellent' ? '100%' : status === 'good' ? '85%' : status === 'warning' ? '60%' : '30%',
            height: '100%',
            background: getStatusColor(),
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.5s ease',
          }} />
        </div>

        {/* Alert Message */}
        {status !== 'good' && status !== 'excellent' && (
          <div style={{
            marginTop: 'var(--space-3)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            background: status === 'warning' 
              ? 'rgba(245, 158, 11, 0.15)' 
              : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${getStatusColor()}40`,
            fontSize: '0.7rem',
            color: status === 'warning' ? 'var(--warning-light)' : 'var(--danger-light)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}>
            <span>{status === 'warning' ? <AlertTriangle size={12} /> : <AlertOctagon size={12} />}</span>
            <span>{status === 'warning' ? 'Needs attention' : 'Action required'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
