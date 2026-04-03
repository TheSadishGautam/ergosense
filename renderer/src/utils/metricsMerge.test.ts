import { describe, expect, it } from 'vitest';
import { MetricRecord } from '../../../models/types';
import { mergeMetricSeriesByMinute } from './metricsMerge';

describe('mergeMetricSeriesByMinute', () => {
  it('aligns two metric streams by minute bucket', () => {
    const posture: MetricRecord[] = [
      { id: 1, timestamp: 61_000, type: 'POSTURE', value: 0.9, metadata: '' },
      { id: 2, timestamp: 120_000, type: 'POSTURE', value: 0.7, metadata: '' },
    ];
    const eye: MetricRecord[] = [
      { id: 3, timestamp: 65_000, type: 'EYE', value: 0.1, metadata: '' },
      { id: 4, timestamp: 180_000, type: 'EYE', value: 0.2, metadata: '' },
    ];

    expect(mergeMetricSeriesByMinute(posture, eye)).toEqual([
      { timestamp: 60_000, posture: 0.9, eyeStrain: 0.1 },
      { timestamp: 120_000, posture: 0.7, eyeStrain: 0 },
      { timestamp: 180_000, posture: 0, eyeStrain: 0.2 },
    ]);
  });
});
