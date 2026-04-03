import React from 'react';

export const DashboardSkeleton: React.FC = () => (
  <div className="dashboard-page" style={{ padding: 'var(--space-6)', maxWidth: '1400px', margin: '0 auto' }}>
    <div className="dashboard-skeleton dashboard-skeleton--hero" />
    <div className="dashboard-grid dashboard-grid--3" style={{ marginBottom: 'var(--space-8)' }}>
      <div className="dashboard-skeleton dashboard-skeleton--card" />
      <div className="dashboard-skeleton dashboard-skeleton--card" />
      <div className="dashboard-skeleton dashboard-skeleton--card" />
    </div>
    <div className="dashboard-grid dashboard-grid--2" style={{ marginBottom: 'var(--space-8)' }}>
      <div className="dashboard-skeleton dashboard-skeleton--chart" />
      <div className="dashboard-skeleton dashboard-skeleton--chart" />
    </div>
    <div className="dashboard-skeleton dashboard-skeleton--panel" />
  </div>
);
