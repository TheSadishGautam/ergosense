import React from 'react';
import { CheckCircle, AlertTriangle, LayoutGrid } from 'lucide-react';
import { PostureZone, PostureZoneData } from '../../../models/types';

interface PostureHeatmapProps {
  zoneData: PostureZoneData[];
}

export const PostureHeatmap: React.FC<PostureHeatmapProps> = ({ zoneData }) => {
  const zoneConfig: Record<PostureZone, { label: string; color: string; }> = {
    [PostureZone.CENTER]: { label: 'Optimal', color: '#10b981' },
    [PostureZone.FORWARD]: { label: 'Leaning Forward', color: '#ef4444' },
    [PostureZone.LEFT_TILT]: { label: 'Left Tilt', color: '#f59e0b' },
    [PostureZone.RIGHT_TILT]: { label: 'Right Tilt', color: '#f59e0b' },
    [PostureZone.TOO_CLOSE]: { label: 'Too Close', color: '#8b5cf6' },
    [PostureZone.TOO_FAR]: { label: 'Too Far', color: '#6366f1' },
  };

  const getPercentage = (zone: PostureZone) => {
    const data = zoneData.find(z => z.zone === zone);
    return data ? data.percentage : 0;
  };

  const centerPercentage = getPercentage(PostureZone.CENTER);
  const totalBadPosture = 100 - centerPercentage;

  // Get top 3 problematic zones
  const problemZones = Object.keys(PostureZone)
    .map(key => PostureZone[key as keyof typeof PostureZone])
    .filter(zone => zone !== PostureZone.CENTER)
    .map(zone => ({ zone, percentage: getPercentage(zone) }))
    .filter(item => item.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  return (
    <div>
      {/* Large Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-5)',
      }}>
        {/* Main Score Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <CheckCircle size={14} className="text-success" /> Good Posture Time
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
              {centerPercentage.toFixed(0)}%
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              of session
            </div>
          </div>
          <div style={{ 
            height: '6px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${centerPercentage}%`,
              height: '100%',
              background: '#10b981',
            }} />
          </div>
        </div>

        {/* Needs Improvement */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          border: '2px solid rgba(239, 68, 68, 0.3)',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <AlertTriangle size={14} className="text-danger" /> Poor Posture
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ef4444', lineHeight: 1, marginBottom: 'var(--space-2)' }}>
            {totalBadPosture.toFixed(0)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Room for improvement
          </div>
        </div>

        {/* Total Zones */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          border: '2px solid rgba(59, 130, 246, 0.3)',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <LayoutGrid size={14} className="text-primary" /> Positions
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#3b82f6', lineHeight: 1, marginBottom: 'var(--space-2)' }}>
            {problemZones.length + 1}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Detected zones
          </div>
        </div>
      </div>

      {/* Problem Zones Breakdown */}
      {problemZones.length > 0 && (
        <div style={{
          background: 'rgba(17, 24, 39, 0.6)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h4 style={{ 
            fontSize: '0.875rem', 
            fontWeight: 700, 
            marginBottom: 'var(--space-4)',
            color: 'var(--text-primary)',
          }}>
            Most Common Issues
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
            {problemZones.map(({ zone, percentage }) => {
              const config = zoneConfig[zone];
              
              return (
                <div key={zone} style={{
                  padding: 'var(--space-4)',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `4px solid ${config.color}`,
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>
                    {config.label}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: config.color }}>
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
