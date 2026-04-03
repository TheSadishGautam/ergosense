import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { TimeRangeSelector } from '../TimeRangeSelector';
import { TimeRange } from '../../hooks/useMetrics';

export interface DashboardHeroProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  compareMode: boolean;
  onCompareModeChange: (enabled: boolean) => void;
  lastUpdated: Date | null;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  timeRange,
  onTimeRangeChange,
  compareMode,
  onCompareModeChange,
  lastUpdated,
}) => (
  <header className="dashboard-hero" role="banner">
    <div className="dashboard-hero__accent" aria-hidden />
    <div className="dashboard-hero__row">
      <div>
        <div className="dashboard-hero__title-row">
          <div className="dashboard-hero__logo">
            <LayoutGrid size={32} aria-hidden />
          </div>
          <h1 className="dashboard-hero__title">ErgoSense Dashboard</h1>
        </div>
        <p className="dashboard-hero__meta">
          {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading metrics...'}
        </p>
      </div>
      <div className="dashboard-hero__controls">
        <div className="dashboard-compare-toggle" role="group" aria-label="Compare mode">
          <button
            type="button"
            className={`dashboard-compare-toggle__btn ${!compareMode ? 'is-active' : ''}`}
            onClick={() => onCompareModeChange(false)}
          >
            Current
          </button>
          <button
            type="button"
            className={`dashboard-compare-toggle__btn ${compareMode ? 'is-active' : ''}`}
            onClick={() => onCompareModeChange(true)}
          >
            Vs Previous
          </button>
        </div>
        <TimeRangeSelector selected={timeRange} onChange={onTimeRangeChange} />
      </div>
    </div>
  </header>
);
