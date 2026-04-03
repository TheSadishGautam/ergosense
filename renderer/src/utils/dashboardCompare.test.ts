import { describe, expect, it, vi } from 'vitest';
import { buildComparisonDeltas } from './dashboardCompare';

describe('buildComparisonDeltas', () => {
  it('calculates period-over-period deltas from 2x window data', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-03T12:00:00.000Z'));

    const now = Date.now();
    const minute = 60_000;
    const windowMs = 60 * minute;

    const previousTime = now - windowMs - 5 * minute;
    const currentTime = now - 5 * minute;

    const result = buildComparisonDeltas(
      {
        posture: [
          { id: 1, timestamp: previousTime, type: 'POSTURE', value: 0.5, metadata: '' },
          { id: 2, timestamp: currentTime, type: 'POSTURE', value: 0.75, metadata: '' },
        ],
        eye: [
          { id: 3, timestamp: previousTime, type: 'EYE', value: 0.4, metadata: '' },
          { id: 4, timestamp: currentTime, type: 'EYE', value: 0.2, metadata: '' },
        ],
        blink: [
          { id: 5, timestamp: previousTime, type: 'BLINK', value: 10, metadata: '' },
          { id: 6, timestamp: currentTime, type: 'BLINK', value: 15, metadata: '' },
        ],
        presence: [
          { id: 7, timestamp: previousTime, type: 'PRESENCE' as any, value: 1, metadata: '' },
          { id: 8, timestamp: currentTime, type: 'PRESENCE' as any, value: 1, metadata: '' },
          { id: 9, timestamp: currentTime + minute, type: 'PRESENCE' as any, value: 1, metadata: '' },
        ],
      },
      windowMs
    );

    expect(result.posture).toBeCloseTo(50, 3);
    expect(result.eyeStrain).toBeCloseTo(-50, 3);
    expect(result.blinks).toBeCloseTo(50, 3);
    expect(result.focusMinutes).toBeCloseTo(100, 3);
    expect(Number.isFinite(result.ergonomic)).toBe(true);
  });
});
