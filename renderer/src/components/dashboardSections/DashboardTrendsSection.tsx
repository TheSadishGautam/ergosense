import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Zap } from 'lucide-react';
import { CustomTooltip } from '../CustomTooltip';
import { formatTime } from '../../utils/chartHelpers';
import { MetricRecord } from '../../../../models/types';
import { CombinedMetricPoint, CompareAlignedSeries } from '../../utils/metricsMerge';
import { CHART } from '../../utils/theme';
import { BreakChartMarker } from '../../utils/breakChartMarkers';

const MAX_BREAK_MARKERS = 64;

export interface DashboardTrendsSectionProps {
  combinedData: CombinedMetricPoint[];
  blinkSeries: MetricRecord[];
  /** When set (compare mode loaded), charts overlay previous period on the same time axis */
  compareChartData: CompareAlignedSeries | null;
  /** Vertical markers for scheduled vs taken breaks (same x-axis as metrics) */
  breakMarkers: BreakChartMarker[];
}

export const DashboardTrendsSection: React.FC<DashboardTrendsSectionProps> = ({
  combinedData,
  blinkSeries,
  compareChartData,
  breakMarkers,
}) => {
  const useCompare = Boolean(compareChartData);
  const postureEyeData = useCompare ? compareChartData!.combined : combinedData;
  const blinkChartData = useCompare ? compareChartData!.blink : blinkSeries;
  const markers = breakMarkers.slice(0, MAX_BREAK_MARKERS);
  const hasBreakOverlay = markers.length > 0;

  return (
    <div
      className="dashboard-grid dashboard-grid--2"
      style={{ marginBottom: 'var(--space-8)' }}
    >
      <section
        className="card-glass dashboard-chart-card dashboard-chart-border--info"
        data-dashboard-hover="orange"
        role="region"
        aria-label="Posture and eye strain trends chart"
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${CHART.infoStroke} 0%, ${CHART.infoStrokeEnd} 100%)`,
          }}
        />
        <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="dashboard-chart-icon dashboard-chart-icon--orange">
            <TrendingUp size={20} />
          </div>
          <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700 }}>
            Posture & eye strain trends
            {useCompare && (
              <span className="dashboard-chart-compare-caption" style={{ fontWeight: 500 }}>
                {' '}
                (solid = current, dashed = previous period)
              </span>
            )}
            {hasBreakOverlay && (
              <span className="dashboard-chart-break-caption" style={{ fontWeight: 500 }}>
                {' '}
                · Gray = break due, green = break taken
              </span>
            )}
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={postureEyeData}>
            <defs>
              <linearGradient id="colorPosture" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART.posture} stopOpacity={0.8} />
                <stop offset="95%" stopColor={CHART.posture} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorEye" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART.eyeStrain} stopOpacity={0.8} />
                <stop offset="95%" stopColor={CHART.eyeStrain} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(ts) => formatTime(ts)}
              stroke="var(--text-tertiary)"
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis domain={[0, 1]} stroke="var(--text-tertiary)" style={{ fontSize: '0.75rem' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="posture"
              stroke={CHART.posture}
              fillOpacity={1}
              fill="url(#colorPosture)"
              name="Posture"
              strokeWidth={2}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="eyeStrain"
              stroke={CHART.eyeStrain}
              fillOpacity={1}
              fill="url(#colorEye)"
              name="Eye strain"
              strokeWidth={2}
              connectNulls
            />
            {useCompare && (
              <>
                <Area
                  type="monotone"
                  dataKey="posturePrev"
                  stroke={CHART.posturePrev}
                  fillOpacity={0}
                  fill="none"
                  name="Posture (previous)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="eyeStrainPrev"
                  stroke={CHART.eyeStrainPrev}
                  fillOpacity={0}
                  fill="none"
                  name="Eye strain (previous)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  connectNulls
                />
              </>
            )}
            {markers.map((m, i) => (
              <ReferenceLine
                key={`pe-break-${m.timestamp}-${m.variant}-${i}`}
                x={m.timestamp}
                stroke={m.variant === 'taken' ? '#22c55e' : '#94a3b8'}
                strokeDasharray={m.variant === 'taken' ? undefined : '4 4'}
                strokeOpacity={0.9}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <section
        className="card-glass dashboard-chart-card dashboard-chart-border--info"
        data-dashboard-hover="orange"
        role="region"
        aria-label="Blink frequency chart"
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${CHART.infoStroke} 0%, ${CHART.infoStrokeEnd} 100%)`,
          }}
        />
        <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="dashboard-chart-icon dashboard-chart-icon--orange">
            <Zap size={20} />
          </div>
          <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700 }}>
            Blink frequency
            {useCompare && (
              <span className="dashboard-chart-compare-caption" style={{ fontWeight: 500 }}>
                {' '}
                (grouped: current vs previous)
              </span>
            )}
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={blinkChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(ts) => formatTime(ts)}
              stroke="var(--text-tertiary)"
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis stroke="var(--text-tertiary)" style={{ fontSize: '0.75rem' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {useCompare ? (
              <>
                <Bar dataKey="value" fill={CHART.barBlink} name="Blinks/min (current)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="valuePrev" fill={CHART.barBlinkPrev} name="Blinks/min (previous)" radius={[8, 8, 0, 0]} />
              </>
            ) : (
              <Bar dataKey="value" fill={CHART.barBlink} name="Blinks/min" radius={[8, 8, 0, 0]} />
            )}
            {markers.map((m, i) => (
              <ReferenceLine
                key={`bl-break-${m.timestamp}-${m.variant}-${i}`}
                x={m.timestamp}
                stroke={m.variant === 'taken' ? '#22c55e' : '#94a3b8'}
                strokeDasharray={m.variant === 'taken' ? undefined : '4 4'}
                strokeOpacity={0.9}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <div
          style={{
            marginTop: 'var(--space-4)',
            padding: 'var(--space-3)',
            background: 'rgba(234, 88, 12, 0.15)',
            border: '1px solid rgba(234, 88, 12, 0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            color: 'var(--brand-primary-light)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <Zap size={16} /> Target: 12-20 blinks per minute
        </div>
      </section>
    </div>
  );
};
