import { describe, expect, it, vi, afterEach } from 'vitest';
import { MetricRecord } from '../../../models/types';
import { mergeMetricSeriesByMinute, buildCompareAlignedSeries } from './metricsMerge';

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

describe('buildCompareAlignedSeries', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aligns current and previous windows to the same minute slots', () => {
    const bucketMs = 60_000;
    const windowMs = 2 * bucketMs;
    const now = 120 * bucketMs;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const currentStart = now - windowMs;
    const previousStart = now - windowMs * 2;

    const posture: MetricRecord[] = [
      { id: 1, timestamp: currentStart + 30_000, type: 'POSTURE', value: 0.8, metadata: '' },
      { id: 2, timestamp: previousStart + 30_000, type: 'POSTURE', value: 0.5, metadata: '' },
    ];
    const eye: MetricRecord[] = [
      { id: 3, timestamp: currentStart + bucketMs, type: 'EYE', value: 0.2, metadata: '' },
      { id: 4, timestamp: previousStart + bucketMs, type: 'EYE', value: 0.4, metadata: '' },
    ];
    const blink: MetricRecord[] = [
      { id: 5, timestamp: currentStart + 30_000, type: 'BLINK', value: 14, metadata: '' },
      { id: 6, timestamp: previousStart + 30_000, type: 'BLINK', value: 10, metadata: '' },
    ];

    const { combined, blink: blinkRows } = buildCompareAlignedSeries(posture, eye, blink, windowMs);

    expect(combined).toHaveLength(2);
    expect(combined[0].timestamp).toBe(currentStart);
    expect(combined[0].posture).toBe(0.8);
    expect(combined[0].posturePrev).toBe(0.5);
    expect(combined[0].eyeStrain).toBeNull();
    expect(combined[0].eyeStrainPrev).toBeNull();

    expect(combined[1].timestamp).toBe(currentStart + bucketMs);
    expect(combined[1].eyeStrain).toBe(0.2);
    expect(combined[1].eyeStrainPrev).toBe(0.4);

    expect(blinkRows[0].value).toBe(14);
    expect(blinkRows[0].valuePrev).toBe(10);
  });
});
