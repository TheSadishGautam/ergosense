import React, { useState, useEffect } from 'react';
import { PostureZoneData } from '../../../models/types';
import { useMetrics, TimeRange } from '../hooks/useMetrics';
import { aggregateByHour } from '../utils/chartHelpers';
import { mergeMetricSeriesByMinute, buildCompareAlignedSeries, CompareAlignedSeries } from '../utils/metricsMerge';
import { COLORS } from '../utils/theme';
import { buildDashboardInsights } from '../utils/dashboardInsights';
import { buildComparisonDeltas, ComparisonDeltas } from '../utils/dashboardCompare';
import { DASHBOARD_TIME_WINDOWS_MS } from '../utils/dashboardTimeWindows';
import {
  DashboardHero,
  DashboardBehaviorSection,
  DashboardTrendsSection,
  DashboardDistributionSection,
  DashboardInsightsSection,
  DashboardSpatialSection,
  DashboardSkeleton,
} from './dashboardSections';

export const Dashboard: React.FC = React.memo(() => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24H');
  const [compareMode, setCompareMode] = useState(false);
  const { data, derived, loading, lastUpdated } = useMetrics(timeRange);
  const [zoneData, setZoneData] = useState<PostureZoneData[]>([]);
  const [comparisonDeltas, setComparisonDeltas] = useState<ComparisonDeltas | null>(null);
  const [compareChartData, setCompareChartData] = useState<CompareAlignedSeries | null>(null);

  useEffect(() => {
    const fetchZoneData = async () => {
      try {
        const zones = await window.electronAPI.getZoneMetrics(DASHBOARD_TIME_WINDOWS_MS[timeRange]);
        setZoneData((zones as PostureZoneData[]) || []);
      } catch (err) {
        console.error('Failed to fetch zone data:', err);
      }
    };
    fetchZoneData();
  }, [timeRange]);

  useEffect(() => {
    if (!compareMode) {
      setComparisonDeltas(null);
      setCompareChartData(null);
      return;
    }

    let cancelled = false;
    const windowMs = DASHBOARD_TIME_WINDOWS_MS[timeRange];

    const loadComparison = async () => {
      try {
        const [posture, eye, blink, presence] = await Promise.all([
          window.electronAPI.getMetrics('POSTURE', windowMs * 2),
          window.electronAPI.getMetrics('EYE', windowMs * 2),
          window.electronAPI.getMetrics('BLINK', windowMs * 2),
          window.electronAPI.getMetrics('PRESENCE', windowMs * 2),
        ]);

        if (cancelled) return;

        setComparisonDeltas(
          buildComparisonDeltas(
            { posture, eye, blink, presence },
            windowMs
          )
        );
        setCompareChartData(buildCompareAlignedSeries(posture, eye, blink, windowMs));
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load comparison metrics:', err);
          setComparisonDeltas(null);
          setCompareChartData(null);
        }
      }
    };

    loadComparison();
    return () => {
      cancelled = true;
    };
  }, [compareMode, timeRange]);

  const ergonomicScore = React.useMemo(
    () =>
      derived.avgPosture * 0.4 +
      (1 - derived.avgEyeStrain) * 0.4 +
      Math.min(derived.avgBlinks / 15, 1) * 0.2,
    [derived]
  );

  const combinedData = React.useMemo(
    () => mergeMetricSeriesByMinute(data.posture, data.eye),
    [data.posture, data.eye]
  );

  const postureDistribution = React.useMemo(
    () => [
      { name: 'Excellent', value: data.posture.filter((p) => p.value >= 0.85).length, color: COLORS.excellent },
      { name: 'Good', value: data.posture.filter((p) => p.value >= 0.7 && p.value < 0.85).length, color: COLORS.good },
      { name: 'Fair', value: data.posture.filter((p) => p.value >= 0.4 && p.value < 0.7).length, color: COLORS.warning },
      { name: 'Poor', value: data.posture.filter((p) => p.value < 0.4).length, color: COLORS.danger },
    ],
    [data.posture]
  );

  const hourlyData = React.useMemo(() => aggregateByHour(data.posture), [data.posture]);

  const insights = React.useMemo(
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

  if (loading) {
    return <DashboardSkeleton />;
  }

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
      />

      {compareMode && !comparisonDeltas && (
        <div className="dashboard-compare-note" role="status" aria-live="polite">
          Comparison mode enabled. Loading previous-period deltas...
        </div>
      )}

      <DashboardBehaviorSection
        derived={derived}
        ergonomicScore={ergonomicScore}
        timeRange={timeRange}
        comparisonDeltas={compareMode ? comparisonDeltas : null}
      />

      <DashboardTrendsSection
        combinedData={combinedData}
        blinkSeries={data.blink}
        compareChartData={compareMode ? compareChartData : null}
      />

      <DashboardDistributionSection postureDistribution={postureDistribution} hourlyData={hourlyData} />

      <DashboardInsightsSection findings={insights.findings} recommendations={insights.recommendations} />

      <DashboardSpatialSection
        zoneData={zoneData}
        monitorTimeRangeMs={DASHBOARD_TIME_WINDOWS_MS[timeRange]}
      />
    </div>
  );
});
