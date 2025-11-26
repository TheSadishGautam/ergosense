import React, { useEffect, useState } from 'react';
import { Cpu, Database, Activity } from 'lucide-react';

interface SystemStats {
  memory: number; // MB
  cpu: number; // %
}

export const SystemMonitor: React.FC = React.memo(() => {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await window.electronAPI.getSystemStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div style={{
      marginTop: 'var(--space-4)',
      padding: 'var(--space-4)',
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Database size={14} className="text-secondary" />
          <span style={{ color: 'var(--text-tertiary)' }}>RAM:</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stats.memory} MB</span>
        </div>
        <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Cpu size={14} className="text-secondary" />
          <span style={{ color: 'var(--text-tertiary)' }}>CPU:</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stats.cpu.toFixed(1)}%</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: '#10b981' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }} />
        <Activity size={14} />
        <span>Local Processing Active</span>
      </div>
    </div>
  );
});
