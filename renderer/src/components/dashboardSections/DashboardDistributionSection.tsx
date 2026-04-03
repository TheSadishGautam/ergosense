import React, { useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART } from '../../utils/theme';
import { postureDistributionTotal, PostureDistributionSlice } from '../../utils/postureDistribution';

export type { PostureDistributionSlice };

export interface HourlyPoint {
  hour: number;
  value: number;
}

export interface DashboardDistributionSectionProps {
  postureDistribution: PostureDistributionSlice[];
  hourlyData: HourlyPoint[];
}

export const DashboardDistributionSection: React.FC<DashboardDistributionSectionProps> = ({
  postureDistribution,
  hourlyData,
}) => {
  const postureTotal = postureDistributionTotal(postureDistribution);
  /** Recharts draws nothing when every slice is 0; also omit zero slices so labels stay readable. */
  const pieData = useMemo(
    () => postureDistribution.filter((s) => s.value > 0),
    [postureDistribution]
  );

  return (
  <div className="grid grid-cols-2 gap-6" style={{ marginBottom: 'var(--space-8)' }}>
    <section
      className="card-glass dashboard-chart-card dashboard-chart-border--info"
      data-dashboard-hover="green"
      role="region"
      aria-label="Posture distribution pie chart"
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="dashboard-chart-icon dashboard-chart-icon--success">
          <span style={{ fontSize: '1.25rem' }}>🎯</span>
        </div>
        <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700 }}>Posture distribution</h3>
      </div>
      {postureTotal === 0 ? (
        <div
          className="dashboard-chart-empty"
          role="status"
          style={{
            minHeight: 250,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            lineHeight: 1.6,
          }}
        >
          No posture samples in this time range. Keep the Live tab running with the camera so ErgoSense can record
          posture scores (saved about once per minute while you are in frame).
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData as { name: string; value: number; color: string }[]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </section>

    <section
      className="card dashboard-chart-card"
      data-dashboard-hover="purple"
      role="region"
      aria-label="Hourly posture average line chart"
      style={{
        background: 'var(--gradient-card)',
        border: '1px solid rgba(168, 85, 247, 0.2)',
      }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="dashboard-chart-icon dashboard-chart-icon--orange">
          <span style={{ fontSize: '1.25rem' }}>⏰</span>
        </div>
        <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700 }}>Hourly Posture Average</h3>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={hourlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="hour"
            tickFormatter={(h) => `${h}:00`}
            stroke="var(--text-tertiary)"
            style={{ fontSize: '0.75rem' }}
          />
          <YAxis domain={[0, 1]} stroke="var(--text-tertiary)" style={{ fontSize: '0.75rem' }} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={CHART.postureMid}
            strokeWidth={3}
            dot={{ fill: CHART.posture, r: 4 }}
            name="Posture Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  </div>
  );
};
