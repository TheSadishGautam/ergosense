import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PostureZoneData } from '../../../models/types';
import { useMetrics, TimeRange } from '../hooks/useMetrics';
import { aggregateByHour } from '../utils/chartHelpers';
import {
  mergeMetricSeriesByMinute,
  buildCompareAlignedSeries,
  CompareAlignedSeries,
  aggregateBlinkSeriesForChart,
} from '../utils/metricsMerge';
import { buildDashboardInsights, InsightActionKind } from '../utils/dashboardInsights';
import { buildComparisonDeltas, ComparisonDeltas } from '../utils/dashboardCompare';
import { DASHBOARD_TIME_WINDOWS_MS } from '../utils/dashboardTimeWindows';
import { buildHeroSummaryLine } from '../utils/dashboardHeroCopy';
import { buildWeeklySummary } from '../utils/dashboardWeeklySummary';
import { breakHistoryToChartMarkers, summarizeBreakAdherence } from '../utils/breakChartMarkers';
import { buildPostureDistribution } from '../utils/postureDistribution';
import { AppView } from './layout/AppShell';
import {
  DashboardHero,
  DashboardBehaviorSection,
  DashboardTrendsSection,
  DashboardDistributionSection,
  DashboardInsightsSection,
  DashboardSpatialSection,
  DashboardSkeleton,
  DashboardWeeklySummarySection,
} from './dashboardSections';

export interface DashboardProps {
  onNavigate?: (view: AppView) => void;
  onOpenStretchGuide?: () => void;
  onOpenCalibration?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = React.memo(
  ({ onNavigate, onOpenStretchGuide, onOpenCalibration }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('24H');
    const [compareMode, setCompareMode] = useState(false);
    const { data, derived, loading, lastUpdated, error, refetch } = useMetrics(timeRange);
    const [zoneData, setZoneData] = useState<PostureZoneData[]>([]);
    const [comparisonDeltas, setComparisonDeltas] = useState<ComparisonDeltas | null>(null);
    const [compareChartData, setCompareChartData] = useState<CompareAlignedSeries | null>(null);
    const [compareFailed, setCompareFailed] = useState(false);
    const [breakRows, setBreakRows] = useState<
      Array<{ scheduled_time: number; actual_time: number | null; was_taken: number; was_snoozed: number }>
    >([]);

    const windowMs = DASHBOARD_TIME_WINDOWS_MS[timeRange];

    useEffect(() => {
      const fetchZoneData = async () => {
        try {
          const zones = await window.electronAPI.getZoneMetrics(windowMs);
          setZoneData((zones as PostureZoneData[]) || []);
        } catch (err) {
          console.error('Failed to fetch zone data:', err);
        }
      };
      fetchZoneData();
    }, [timeRange, windowMs]);

    useEffect(() => {
      let cancelled = false;
      const loadBreaks = async () => {
        try {
          const rows = await window.electronAPI.getBreakHistoryWindow(windowMs);
          if (!cancelled) setBreakRows(rows);
        } catch (err) {
          console.error('Failed to fetch break history:', err);
          if (!cancelled) setBreakRows([]);
        }
      };
      loadBreaks();
      return () => {
        cancelled = true;
      };
    }, [timeRange, windowMs]);

    useEffect(() => {
      if (!compareMode) {
        setComparisonDeltas(null);
        setCompareChartData(null);
        setCompareFailed(false);
        return;
      }

      let cancelled = false;

      const loadComparison = async () => {
        try {
          setCompareFailed(false);
          const [posture, eye, blink, presence] = await Promise.all([
            window.electronAPI.getMetrics('POSTURE', windowMs * 2),
            window.electronAPI.getMetrics('EYE', windowMs * 2),
            window.electronAPI.getMetrics('BLINK', windowMs * 2),
            window.electronAPI.getMetrics('PRESENCE', windowMs * 2),
          ]);

          if (cancelled) return;

          setComparisonDeltas(buildComparisonDeltas({ posture, eye, blink, presence }, windowMs));
          setCompareChartData(buildCompareAlignedSeries(posture, eye, blink, windowMs));
        } catch (err) {
          if (!cancelled) {
            console.error('Failed to load comparison metrics:', err);
            setComparisonDeltas(null);
            setCompareChartData(null);
            setCompareFailed(true);
          }
        }
      };

      loadComparison();
      return () => {
        cancelled = true;
      };
    }, [compareMode, timeRange, windowMs]);

    const ergonomicScore = useMemo(
      () =>
        derived.avgPosture * 0.4 + (1 - derived.avgEyeStrain) * 0.4 + Math.min(derived.avgBlinks / 15, 1) * 0.2,
      [derived]
    );

    const ergoScore100 = ergonomicScore * 100;

    const summaryLine = useMemo(
      () =>
        buildHeroSummaryLine({
          avgPosture: derived.avgPosture,
          avgEyeStrain: derived.avgEyeStrain,
          avgBlinks: derived.avgBlinks,
          ergoScore01: ergonomicScore,
        }),
      [derived, ergonomicScore]
    );

    const combinedData = useMemo(
      () => mergeMetricSeriesByMinute(data.posture, data.eye, windowMs),
      [data.posture, data.eye, windowMs]
    );

    const blinkForChart = useMemo(
      () => aggregateBlinkSeriesForChart(data.blink, windowMs),
      [data.blink, windowMs]
    );

    const postureDistribution = useMemo(() => buildPostureDistribution(data.posture), [data.posture]);

    const hourlyData = useMemo(() => aggregateByHour(data.posture), [data.posture]);

    const insights = useMemo(
      () =>
        buildDashboardInsights({
          avgPosture: derived.avgPosture,
          avgEyeStrain: derived.avgEyeStrain,
          avgBlinks: derived.avgBlinks,
          postureTrend: derived.postureTrend,
          eyeTrend: derived.eyeTrend,
          blinkTrend: derived.blinkTrend,
          totalDataPoints: derived.totalDataPoints,
        }),
      [derived]
    );

    const breakAdherence = useMemo(() => {
      if (!breakRows.length) return null;
      return summarizeBreakAdherence(breakRows);
    }, [breakRows]);

    const breakMarkers = useMemo(() => {
      const now = Date.now();
      const start = now - windowMs;
      return breakHistoryToChartMarkers(breakRows, start, now);
    }, [breakRows, windowMs]);

    const weeklySummary = useMemo(
      () =>
        buildWeeklySummary({
          postureTrend: derived.postureTrend,
          eyeTrend: derived.eyeTrend,
          blinkTrend: derived.blinkTrend,
          adherencePct: breakAdherence?.adherencePct ?? null,
        }),
      [derived.postureTrend, derived.eyeTrend, derived.blinkTrend, breakAdherence]
    );

    const handleInsightAction = useCallback(
      (kind: InsightActionKind) => {
        switch (kind) {
          case 'navigate-settings':
            onNavigate?.('SETTINGS');
            break;
          case 'navigate-live':
            onNavigate?.('LIVE');
            break;
          case 'open-stretch':
            onOpenStretchGuide?.();
            break;
          case 'open-calibration':
            onOpenCalibration?.();
            break;
          default:
            break;
        }
      },
      [onNavigate, onOpenStretchGuide, onOpenCalibration]
    );

    if (loading) {
      return <DashboardSkeleton />;
    }

    if (error) {
      return (
        <div
          className="dashboard-page dashboard-error-state animate-fadeIn"
          style={{ padding: 'var(--space-8)', maxWidth: '720px', margin: '0 auto' }}
        >
          <h1 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-3)' }}>Could not load metrics</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>{error}</p>
          <button type="button" className="btn" onClick={() => void refetch(true)}>
            Retry
          </button>
        </div>
      );
    }

    const compareLoading = compareMode && !comparisonDeltas && !compareFailed;
    const ergoDeltaPct =
      compareMode && comparisonDeltas && !compareFailed ? comparisonDeltas.ergonomic : null;

    return (
      <div
        className="dashboard-page animate-fadeIn"
        style={{ padding: 'var(--space-6)', maxWidth: '1400px', margin: '0 auto' }}
      >
        <DashboardHero
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          compareMode={compareMode}
          onCompareModeChange={setCompareMode}
          lastUpdated={lastUpdated}
          ergoScore100={ergoScore100}
          summaryLine={summaryLine}
          ergoDeltaPct={ergoDeltaPct}
          compareLoading={compareLoading}
        />

        {derived.totalDataPoints === 0 && (
          <div className="dashboard-empty-banner" role="status">
            No samples in this time range yet. Keep Live monitoring running to build your dashboard.
          </div>
        )}

        {compareMode && compareFailed && (
          <div className="dashboard-compare-note dashboard-compare-note--warn" role="alert">
            Could not load comparison data. Showing current period only.
          </div>
        )}

        {compareMode && compareLoading && (
          <div className="dashboard-compare-note" role="status" aria-live="polite">
            Comparison mode enabled. Loading previous-period deltas…
          </div>
        )}

        <DashboardInsightsSection
          findings={insights.findings}
          recommendations={insights.recommendations}
          onInsightAction={handleInsightAction}
        />

        <DashboardTrendsSection
          combinedData={combinedData}
          blinkSeries={blinkForChart}
          compareChartData={compareMode ? compareChartData : null}
          breakMarkers={breakMarkers}
        />

        <DashboardBehaviorSection
          derived={derived}
          timeRange={timeRange}
          comparisonDeltas={compareMode ? comparisonDeltas : null}
          breakAdherence={breakAdherence}
        />

        <DashboardDistributionSection postureDistribution={postureDistribution} hourlyData={hourlyData} />

        <DashboardSpatialSection zoneData={zoneData} monitorTimeRangeMs={windowMs} />

        <DashboardWeeklySummarySection summary={weeklySummary} />
      </div>
    );
  }
);
