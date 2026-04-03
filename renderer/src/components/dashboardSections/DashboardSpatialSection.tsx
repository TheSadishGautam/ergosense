import React from 'react';
import { Activity, Monitor } from 'lucide-react';
import { PostureZoneData } from '../../../../models/types';
import { PostureHeatmap } from '../PostureHeatmap';
import { MultiMonitorStats } from '../MultiMonitorStats';

export interface DashboardSpatialSectionProps {
  zoneData: PostureZoneData[];
  monitorTimeRangeMs: number;
}

export const DashboardSpatialSection: React.FC<DashboardSpatialSectionProps> = ({
  zoneData,
  monitorTimeRangeMs,
}) => (
  <>
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
        border: '1px solid rgba(234, 88, 12, 0.3)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(234, 88, 12, 0.2)',
        marginBottom: 'var(--space-6)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <div
          style={{
            padding: 'var(--space-2)',
            background: 'var(--gradient-orange)',
            borderRadius: 'var(--radius-md)',
            fontSize: '1.25rem',
            color: 'white',
          }}
        >
          <Activity size={20} aria-hidden />
        </div>
        <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700 }}>Posture Zone Heatmap</h3>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
        Where does your head spend most of its time?
      </p>
      <PostureHeatmap zoneData={zoneData} />
    </div>

    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
        border: '1px solid rgba(234, 88, 12, 0.3)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(234, 88, 12, 0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <div
          style={{
            padding: 'var(--space-2)',
            background: 'var(--gradient-orange)',
            borderRadius: 'var(--radius-md)',
            fontSize: '1.25rem',
            color: 'white',
          }}
        >
          <Monitor size={20} aria-hidden />
        </div>
        <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700 }}>Multi-Monitor Usage</h3>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
        How much time do you spend looking at each monitor?
      </p>
      <MultiMonitorStats timeRange={monitorTimeRangeMs} />
    </div>
  </>
);
