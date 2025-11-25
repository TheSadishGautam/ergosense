/**
 * useMetrics Hook
 * Custom hook for fetching and managing metrics data
 */

import { useState, useEffect } from 'react';
import { MetricRecord } from '../../../models/types';
import { calculateAverage, calculateTrend, getMinMax } from '../utils/chartHelpers';

export type TimeRange = '30M' | '1H' | '6H' | '24H' | '7D' | '30D';

const TIME_RANGES: Record<TimeRange, number> = {
  '30M': 30 * 60 * 1000,
  '1H': 60 * 60 * 1000,
  '6H': 6 * 60 * 60 * 1000,
  '24H': 24 * 60 * 60 * 1000,
  '7D': 7 * 24 * 60 * 60 * 1000,
  '30D': 30 * 24 * 60 * 60 * 1000,
};

interface MetricsData {
  posture: MetricRecord[];
  eye: MetricRecord[];
  blink: MetricRecord[];
  presence: MetricRecord[];
}

interface DerivedMetrics {
  avgPosture: number;
  avgEyeStrain: number;
  avgBlinks: number;
  postureTrend: number;
  eyeTrend: number;
  blinkTrend: number;
  totalDataPoints: number;
  totalPresenceMinutes: number;
}

export const useMetrics = (timeRange: TimeRange, refreshInterval = 60000) => {
  const [data, setData] = useState<MetricsData>({
    posture: [],
    eye: [],
    blink: [],
    presence: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async (isInitialLoad = false) => {
    try {
      // Only show loading spinner on initial load, not on refresh
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      const windowMs = TIME_RANGES[timeRange];
      
      const [posture, eye, blink, presence] = await Promise.all([
        window.electronAPI.getMetrics('POSTURE', windowMs),
        window.electronAPI.getMetrics('EYE', windowMs),
        window.electronAPI.getMetrics('BLINK', windowMs),
        window.electronAPI.getMetrics('PRESENCE', windowMs),
      ]);

      setData({ posture, eye, blink, presence });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError('Failed to load metrics data');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMetrics(true); // Initial load
    
    const interval = setInterval(() => fetchMetrics(false), refreshInterval); // Subsequent refreshes
    
    return () => clearInterval(interval);
  }, [timeRange, refreshInterval]);

  // Calculate derived metrics
  const derived: DerivedMetrics = {
    avgPosture: calculateAverage(data.posture),
    avgEyeStrain: calculateAverage(data.eye),
    avgBlinks: calculateAverage(data.blink),
    postureTrend: calculateTrend(data.posture),
    eyeTrend: calculateTrend(data.eye),
    blinkTrend: calculateTrend(data.blink),
    totalDataPoints: data.posture.length + data.eye.length + data.blink.length,
    totalPresenceMinutes: data.presence.filter(p => p.value === 1).length, // Assuming 1 record = 1 minute
  };

  return {
    data,
    derived,
    loading,
    error,
    lastUpdated,
    refetch: fetchMetrics,
  };
};
