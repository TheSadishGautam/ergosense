import { describe, expect, it } from 'vitest';
import { buildHeroSummaryLine } from './dashboardHeroCopy';

describe('buildHeroSummaryLine', () => {
  it('returns a non-empty line for strong scores', () => {
    const line = buildHeroSummaryLine({
      avgPosture: 0.9,
      avgEyeStrain: 0.1,
      avgBlinks: 16,
      ergoScore01: 0.9,
    });
    expect(line.length).toBeGreaterThan(10);
  });
});
