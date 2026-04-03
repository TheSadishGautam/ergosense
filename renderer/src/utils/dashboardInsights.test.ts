import { describe, expect, it } from 'vitest';
import { buildDashboardInsights } from './dashboardInsights';

const base = {
  avgPosture: 0.8,
  avgEyeStrain: 0.1,
  avgBlinks: 16,
  postureTrend: 0,
  eyeTrend: 0,
  blinkTrend: 0,
  totalDataPoints: 40,
};

describe('buildDashboardInsights', () => {
  it('returns low posture critical insight', () => {
    const r = buildDashboardInsights({ ...base, avgPosture: 0.35 });
    expect(r.recommendations.some((x) => x.id === 'posture-critical')).toBe(true);
  });

  it('returns low blink insight', () => {
    const r = buildDashboardInsights({ ...base, avgBlinks: 8 });
    expect(r.recommendations.some((x) => x.id === 'blink-low')).toBe(true);
  });

  it('pads to three recommendations with generic tips when few rules fire', () => {
    const r = buildDashboardInsights(base);
    expect(r.recommendations.length).toBe(3);
    expect(r.findings.length).toBeGreaterThan(0);
  });
});
