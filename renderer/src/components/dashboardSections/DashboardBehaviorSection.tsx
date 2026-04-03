import React from 'react';
import { Activity, Eye, Zap, Clock, Calendar, Coffee } from 'lucide-react';
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

export interface BreakAdherenceSnapshot {
  scheduled: number;
  taken: number;
  adherencePct: number | null;
}

export interface DashboardBehaviorSectionProps {
  derived: DerivedSnapshot;
  timeRange: TimeRange;
  comparisonDeltas?: {
    posture: number;
    eyeStrain: number;
    blinks: number;
    ergonomic: number;
    focusMinutes: number;
  } | null;
  breakAdherence: BreakAdherenceSnapshot | null;
}

export const DashboardBehaviorSection: React.FC<DashboardBehaviorSectionProps> = ({
  derived,
  timeRange,
  comparisonDeltas,
  breakAdherence,
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
          title="Focus time"
          value={derived.totalPresenceMinutes}
          unit="min"
          trend={comparisonDeltas ? comparisonDeltas.focusMinutes : undefined}
          icon={<Clock />}
          subtitle={comparisonDeltas ? 'Vs previous period' : 'Active time detected'}
          status="excellent"
        />
      </div>
      <div className="card-glass" style={{ animation: 'none' }}>
        <MetricCard
          title="Break reminders"
          value={
            breakAdherence && breakAdherence.scheduled > 0 && breakAdherence.adherencePct != null
              ? breakAdherence.adherencePct.toFixed(0)
              : '—'
          }
          unit={breakAdherence && breakAdherence.scheduled > 0 ? '% taken' : ''}
          icon={<Coffee />}
          subtitle={
            breakAdherence && breakAdherence.scheduled > 0
              ? `${breakAdherence.taken} of ${breakAdherence.scheduled} taken in range`
              : 'No break events in this window yet'
          }
          status={
            breakAdherence?.adherencePct == null
              ? 'good'
              : breakAdherence.adherencePct >= 70
                ? 'excellent'
                : breakAdherence.adherencePct >= 45
                  ? 'warning'
                  : 'danger'
          }
        />
      </div>
      <div className="card-glass" style={{ animation: 'none' }}>
        <MetricCard title="Time range" value={timeRange} icon={<Calendar />} subtitle="Dashboard window" />
      </div>
    </div>
  </>
);
