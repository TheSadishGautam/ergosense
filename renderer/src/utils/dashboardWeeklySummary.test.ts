import { describe, expect, it } from 'vitest';
import { buildWeeklySummary } from './dashboardWeeklySummary';

describe('buildWeeklySummary', () => {
  it('surfaces wins and regressions from trends', () => {
    const r = buildWeeklySummary({
      postureTrend: 8,
      eyeTrend: -8,
      blinkTrend: -10,
      adherencePct: 80,
    });
    expect(r.wins.some((w) => w.includes('Posture'))).toBe(true);
    expect(r.regressions.length).toBeGreaterThan(0);
    expect(r.nextGoal.length).toBeGreaterThan(10);
  });
});
