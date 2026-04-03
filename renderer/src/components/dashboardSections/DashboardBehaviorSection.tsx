import React from 'react';
import { Activity, Eye, Zap, Clock, Calendar } from 'lucide-react';
import { MetricCard } from '../MetricCard';
import { getPostureStatus, getEyeStatus, getBlinkStatus } from '../../utils/statusHelpers';
import { TimeRange } from '../../hooks/useMetrics';

export interface DerivedSnapshot {
  avgPosture: number;
  avgEyeStrain: number;
  avgBlinks: number;
  postureTrend: number;
  eyeTrend: number;
  blinkTrend: number;
  totalPresenceMinutes: number;
}

export interface DashboardBehaviorSectionProps {
  derived: DerivedSnapshot;
  ergonomicScore: number;
  timeRange: TimeRange;
  comparisonDeltas?: {
    posture: number;
    eyeStrain: number;
    blinks: number;
    ergonomic: number;
    focusMinutes: number;
  } | null;
}

export const DashboardBehaviorSection: React.FC<DashboardBehaviorSectionProps> = ({
  derived,
  ergonomicScore,
  timeRange,
  comparisonDeltas,
}) => (
  <>
    <div className="dashboard-grid dashboard-grid--3" style={{ marginBottom: 'var(--space-8)' }}>
      <div className="card-glass" style={{ animation: 'none' }}>
        <MetricCard
          title="Posture Score"
          value={(derived.avgPosture * 100).toFixed(0)}
          unit="%"
          trend={comparisonDeltas ? comparisonDeltas.posture : derived.postureTrend}
          status={getPostureStatus(derived.avgPosture)}
          icon={<Activity />}
          subtitle={comparisonDeltas ? 'Vs previous period' : 'Average posture quality'}
        />
      </div>
      <div className="card-glass" style={{ animation: 'none' }}>
        <MetricCard
          title="Eye Strain"
          value={(derived.avgEyeStrain * 100).toFixed(0)}
          unit="%"
          trend={comparisonDeltas ? comparisonDeltas.eyeStrain : derived.eyeTrend}
          status={getEyeStatus(derived.avgEyeStrain)}
          icon={<Eye />}
          subtitle={comparisonDeltas ? 'Vs previous period' : 'Eye fatigue level'}
        />
      </div>
      <div className="card-glass" style={{ animation: 'none' }}>
        <MetricCard
          title="Blink Rate"
          value={derived.avgBlinks.toFixed(0)}
          unit="/min"
          trend={comparisonDeltas ? comparisonDeltas.blinks : derived.blinkTrend}
          status={getBlinkStatus(derived.avgBlinks)}
          icon={<Zap />}
          subtitle={comparisonDeltas ? 'Vs previous period' : 'Blinks per minute'}
        />
      </div>
    </div>

    <div className="dashboard-grid dashboard-grid--3" style={{ marginBottom: 'var(--space-8)' }}>
      <div className="card-glass" style={{ animation: 'none' }}>
        <MetricCard
          title="Ergonomic Score"
          value={(ergonomicScore * 100).toFixed(0)}
          unit="/100"
          trend={comparisonDeltas ? comparisonDeltas.ergonomic : undefined}
          status={
            ergonomicScore >= 0.85
              ? 'excellent'
              : ergonomicScore >= 0.7
                ? 'good'
                : ergonomicScore >= 0.5
                  ? 'warning'
                  : 'danger'
          }
          icon={<Activity />}
          subtitle={comparisonDeltas ? 'Vs previous period' : 'Overall health index'}
        />
      </div>
      <div className="card-glass" style={{ animation: 'none' }}>
        <MetricCard
          title="Focus Time"
          value={derived.totalPresenceMinutes}
          unit="min"
          trend={comparisonDeltas ? comparisonDeltas.focusMinutes : undefined}
          icon={<Clock />}
          subtitle={comparisonDeltas ? 'Vs previous period' : 'Active time detected'}
          status="excellent"
        />
      </div>
      <div className="card-glass" style={{ animation: 'none' }}>
        <MetricCard title="Time Range" value={timeRange} icon={<Calendar />} subtitle="Time range displayed" />
      </div>
    </div>
  </>
);
