import { MetricRecord } from '../../../models/types';

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

export const formatPercent = (value: number): string => {
  return `${Math.round(value * 100)}%`;
};

export const formatScore = (score: number): string => {
  return `${Math.round(score * 100)}`;
};

export const getMetricColor = (type: string, value: number): string => {
  if (type === 'POSTURE') {
    if (value >= 0.7) return '#10b981';
    if (value >= 0.4) return '#f59e0b';
    return '#ef4444';
  }
  
  if (type === 'EYE') {
    if (value <= 0.3) return '#10b981';
    if (value <= 0.6) return '#f59e0b';
    return '#ef4444';
  }
  
  if (type === 'BLINK') {
    if (value >= 12 && value <= 20) return '#10b981';
    if (value >= 8 && value <= 25) return '#f59e0b';
    return '#ef4444';
  }
  
  return '#3b82f6';
};

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

export const calculateAverage = (metrics: MetricRecord[]): number => {
  if (metrics.length === 0) return 0;
  return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
};

export const getMinMax = (metrics: MetricRecord[]): { min: number; max: number } => {
  if (metrics.length === 0) return { min: 0, max: 0 };
  
  const values = metrics.map(m => m.value);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
};
