import React from 'react';
import { formatTime } from '../utils/chartHelpers';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        minWidth: '180px',
      }}>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)',
          marginBottom: 'var(--space-2)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: 'var(--space-1)',
        }}>
          {typeof label === 'number' ? formatTime(label) : label}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: entry.color || entry.fill,
                }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {entry.name}:
                </span>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {/* Format based on value range or name */}
                {entry.name.toLowerCase().includes('rate') || entry.name.toLowerCase().includes('blink') 
                  ? `${Number(entry.value).toFixed(0)}/min`
                  : `${(Number(entry.value) * 100).toFixed(0)}%`
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
