/**
 * Chart Helpers
 * Utilities for formatting data and configuring charts
 */

import { MetricRecord } from '../../../models/types';

/**
 * Format timestamp to readable time
 */
export const formatTime = (timestamp: number, format: 'short' | 'long' = 'short'): string => {
  const date = new Date(timestamp);
  
  if (format === 'short') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  return date.toLocaleString([], { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Format percentage
 */
export const formatPercent = (value: number): string => {
  return `${Math.round(value * 100)}%`;
};

/**
 * Format score (0-1) to percentage
 */
export const formatScore = (score: number): string => {
  return `${Math.round(score * 100)}`;
};

/**
 * Get color based on metric type and value
 */
export const getMetricColor = (type: string, value: number): string => {
  if (type === 'POSTURE') {
    if (value >= 0.7) return '#10b981'; // success
    if (value >= 0.4) return '#f59e0b'; // warning
    return '#ef4444'; // danger
  }
  
  if (type === 'EYE') {
    if (value <= 0.3) return '#10b981'; // success (low strain)
    if (value <= 0.6) return '#f59e0b'; // warning
    return '#ef4444'; // danger (high strain)
  }
  
  if (type === 'BLINK') {
    if (value >= 12 && value <= 20) return '#10b981'; // success (ideal range)
    if (value >= 8 && value <= 25) return '#f59e0b'; // warning
    return '#ef4444'; // danger
  }
  
  return '#3b82f6'; // default blue
};

/**
 * Calculate trend from metrics (returns percentage change)
 */
export const calculateTrend = (metrics: MetricRecord[]): number => {
  if (metrics.length < 2) return 0;
  
  const recent = metrics.slice(-5);
  const older = metrics.slice(-10, -5);
  
  if (older.length === 0) return 0;
  
  const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
  const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;
  
  if (olderAvg === 0) return 0;
  
  return ((recentAvg - olderAvg) / olderAvg) * 100;
};

/**
 * Get gradient colors for charts
 */
export const chartGradients = {
  posture: {
    start: '#10b981',
    end: '#059669',
  },
  eye: {
    start: '#ef4444',
    end: '#dc2626',
  },
  blink: {
    start: '#3b82f6',
    end: '#1d4ed8',
  },
  purple: {
    start: '#8b5cf6',
    end: '#6d28d9',
  },
};

/**
 * Aggregate metrics by hour
 */
export const aggregateByHour = (metrics: MetricRecord[]): { hour: number; value: number }[] => {
  const hourlyData: { [key: number]: number[] } = {};
  
  metrics.forEach(metric => {
    const hour = new Date(metric.timestamp).getHours();
    if (!hourlyData[hour]) hourlyData[hour] = [];
    hourlyData[hour].push(metric.value);
  });
  
  return Object.entries(hourlyData).map(([hour, values]) => ({
    hour: parseInt(hour),
    value: values.reduce((sum, v) => sum + v, 0) / values.length,
  }));
};

/**
 * Calculate average from metrics
 */
export const calculateAverage = (metrics: MetricRecord[]): number => {
  if (metrics.length === 0) return 0;
  return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
};

/**
 * Get min/max from metrics
 */
export const getMinMax = (metrics: MetricRecord[]): { min: number; max: number } => {
  if (metrics.length === 0) return { min: 0, max: 0 };
  
  const values = metrics.map(m => m.value);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
};
