import { describe, expect, it } from 'vitest';
import { MetricRecord } from '../../../models/types';
import { buildPostureDistribution, normalizePostureScore } from './postureDistribution';

describe('normalizePostureScore', () => {
  it('treats 0-1 as scores', () => {
    expect(normalizePostureScore(0.9)).toBe(0.9);
  });

  it('maps legacy 0-100 to 0-1', () => {
    expect(normalizePostureScore(72)).toBe(0.72);
  });
});

describe('buildPostureDistribution', () => {
  it('buckets exclusively with else-if chain', () => {
    const posture: MetricRecord[] = [
      { id: 1, timestamp: 1, type: 'POSTURE', value: 0.9, metadata: '' },
      { id: 2, timestamp: 2, type: 'POSTURE', value: 0.75, metadata: '' },
      { id: 3, timestamp: 3, type: 'POSTURE', value: 0.55, metadata: '' },
      { id: 4, timestamp: 4, type: 'POSTURE', value: 0.2, metadata: '' },
    ];
    const s = buildPostureDistribution(posture);
    expect(s.find((x) => x.name === 'Excellent')?.value).toBe(1);
    expect(s.find((x) => x.name === 'Good')?.value).toBe(1);
    expect(s.find((x) => x.name === 'Fair')?.value).toBe(1);
    expect(s.find((x) => x.name === 'Poor')?.value).toBe(1);
  });
});
