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
  /** 0–100 composite score */
  ergoScore100: number;
  summaryLine: string;
  /** Percent delta vs previous period when compare is on and loaded */
  ergoDeltaPct: number | null;
  compareLoading: boolean;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  timeRange,
  onTimeRangeChange,
  compareMode,
  onCompareModeChange,
  lastUpdated,
  ergoScore100,
  summaryLine,
  ergoDeltaPct,
  compareLoading,
}) => {
  const deltaLabel =
    compareMode && compareLoading
      ? 'Loading comparison…'
      : ergoDeltaPct != null
        ? `${ergoDeltaPct > 0 ? '+' : ''}${ergoDeltaPct.toFixed(0)}% vs previous period`
        : null;

  return (
    <header className="dashboard-hero" role="banner">
      <div className="dashboard-hero__accent" aria-hidden />
      <div className="dashboard-hero__row dashboard-hero__row--split">
        <div className="dashboard-hero__intro">
          <div className="dashboard-hero__title-row">
            <div className="dashboard-hero__logo">
              <LayoutGrid size={32} aria-hidden />
            </div>
            <h1 className="dashboard-hero__title">ErgoSense Dashboard</h1>
          </div>
          <div className="dashboard-hero__score-block">
            <div className="dashboard-hero__score-label">Ergo score</div>
            <div className="dashboard-hero__score-row">
              <span className="dashboard-hero__score-value" aria-label={`Ergo score ${ergoScore100} out of 100`}>
                {Math.round(ergoScore100)}
              </span>
              <span className="dashboard-hero__score-denom">/100</span>
              {deltaLabel && (
                <span
                  className={`dashboard-hero__delta ${ergoDeltaPct != null && ergoDeltaPct < 0 ? 'is-negative' : ''} ${ergoDeltaPct != null && ergoDeltaPct > 0 ? 'is-positive' : ''}`}
                  aria-label={deltaLabel}
                >
                  {deltaLabel}
                </span>
              )}
            </div>
            <p className="dashboard-hero__summary">{summaryLine}</p>
          </div>
          <p className="dashboard-hero__meta">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading metrics...'}
          </p>
        </div>
        <div className="dashboard-hero__controls">
          <div className="dashboard-compare-toggle" role="group" aria-label="Compare to previous period">
            <button
              type="button"
              className={`dashboard-compare-toggle__btn ${!compareMode ? 'is-active' : ''}`}
              onClick={() => onCompareModeChange(false)}
              aria-pressed={!compareMode}
            >
              Current
            </button>
            <button
              type="button"
              className={`dashboard-compare-toggle__btn ${compareMode ? 'is-active' : ''}`}
              onClick={() => onCompareModeChange(true)}
              aria-pressed={compareMode}
            >
              Vs previous
            </button>
          </div>
          <TimeRangeSelector selected={timeRange} onChange={onTimeRangeChange} />
        </div>
      </div>
    </header>
  );
};
