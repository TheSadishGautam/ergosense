import { MetricRecord } from '../../../models/types';
import { COLORS } from './theme';

export interface PostureDistributionSlice {
  name: string;
  value: number;
  color: string;
}

/** Normalize stored metric to 0–1 (handles legacy or mistaken 0–100 scale). */
export const normalizePostureScore = (raw: number): number | null => {
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  let v = n;
  if (v > 1) v = v / 100;
  return Math.max(0, Math.min(1, v));
};

/**
 * Count posture samples into quality tiers (mutually exclusive, same rules as dashboard cards).
 */
export const buildPostureDistribution = (posture: MetricRecord[]): PostureDistributionSlice[] => {
  let excellent = 0;
  let good = 0;
  let fair = 0;
  let poor = 0;

  for (const p of posture) {
    const x = normalizePostureScore(p.value);
    if (x === null) continue;
    if (x >= 0.85) excellent += 1;
    else if (x >= 0.7) good += 1;
    else if (x >= 0.4) fair += 1;
    else poor += 1;
  }

  return [
    { name: 'Excellent', value: excellent, color: COLORS.excellent },
    { name: 'Good', value: good, color: COLORS.good },
    { name: 'Fair', value: fair, color: COLORS.warning },
    { name: 'Poor', value: poor, color: COLORS.danger },
  ];
};

export const postureDistributionTotal = (slices: PostureDistributionSlice[]): number =>
  slices.reduce((sum, s) => sum + s.value, 0);
