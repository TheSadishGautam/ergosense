import React, { useEffect, useState } from 'react';
import { Monitor, ArrowLeft, ArrowRight } from 'lucide-react';
import { MonitorGazeData } from '../../../models/types';

interface MultiMonitorStatsProps {
  timeRange: number;
}

export const MultiMonitorStats: React.FC<MultiMonitorStatsProps> = ({ timeRange }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await window.electronAPI.getMonitorMetrics(timeRange);
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch monitor metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [timeRange]);

  if (loading || !metrics || metrics.totalTime === 0) {
    return (
      <div style={{
        background: 'rgba(17, 24, 39, 0.6)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        color: 'var(--text-tertiary)',
      }}>
        {loading ? 'Loading monitor data...' : 'No multi-monitor usage data yet'}
      </div>
    );
  }

  const positionConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    CENTER: { label: 'Primary Monitor', color: '#10b981', icon: <Monitor size={16} /> },
    LEFT: { label: 'Left Monitor', color: '#3b82f6', icon: <ArrowLeft size={16} /> },
    RIGHT: { label: 'Right Monitor', color: '#8b5cf6', icon: <ArrowRight size={16} /> },
  };

  const centerPercentage = metrics.data.find((d: any) => d.position === 'CENTER')?.percentage || 0;
  const switchesPerHour = (metrics.switches / (timeRange / (1000 * 60 * 60)));

  return (
    <div style={{
      background: 'rgba(17, 24, 39, 0.6)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-5)',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}>
          <Monitor size={24} />
        </div>
        <h3 style={{ 
          margin: 0, 
          fontSize: '1.25rem', 
          fontWeight: 700,
        }}>
          Multi-Monitor Usage
        </h3>
      </div>

      {/* Position Distribution */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        {metrics.data.map((item: MonitorGazeData) => {
          if (item.percentage < 0.5) return null;
          const config = positionConfig[item.position];
          
          return (
            <div key={item.position} style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-2)',
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-2)',
                  fontSize: '0.875rem',
                }}>
                  <span style={{ fontSize: '1rem' }}>{config.icon}</span>
                  <span>{config.label}</span>
                </div>
                <span style={{ 
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: config.color,
                }}>
                  {item.percentage.toFixed(1)}%
                </span>
              </div>

              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${item.percentage}%`,
                  height: '100%',
                  background: config.color,
                  borderRadius: 'var(--radius-full)',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--space-4)',
      }}>
        <div style={{
          padding: 'var(--space-4)',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>
            Monitor Switches
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
            {metrics.switches}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
            {switchesPerHour.toFixed(1)} per hour
          </div>
        </div>

        <div style={{
          padding: 'var(--space-4)',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>
            Primary Focus
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
            {centerPercentage.toFixed(0)}%
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
            of total time
          </div>
        </div>
      </div>
    </div>
  );
};

