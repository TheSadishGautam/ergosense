import { MetricRecord } from '../../../models/types';
import { calculateAverage } from './chartHelpers';

export interface ComparisonDeltas {
  posture: number;
  eyeStrain: number;
  blinks: number;
  ergonomic: number;
  focusMinutes: number;
}

const pctDelta = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

const splitIntoPeriods = (series: MetricRecord[], windowMs: number) => {
  const now = Date.now();
  const currentStart = now - windowMs;
  const previousStart = now - windowMs * 2;

  const current = series.filter((x) => x.timestamp >= currentStart && x.timestamp <= now);
  const previous = series.filter((x) => x.timestamp >= previousStart && x.timestamp < currentStart);

  return { current, previous };
};

export const buildComparisonDeltas = (data: {
  posture: MetricRecord[];
  eye: MetricRecord[];
  blink: MetricRecord[];
  presence: MetricRecord[];
}, windowMs: number): ComparisonDeltas => {
  const posture = splitIntoPeriods(data.posture, windowMs);
  const eye = splitIntoPeriods(data.eye, windowMs);
  const blink = splitIntoPeriods(data.blink, windowMs);
  const presence = splitIntoPeriods(data.presence, windowMs);

  const currentPosture = calculateAverage(posture.current);
  const previousPosture = calculateAverage(posture.previous);

  const currentEye = calculateAverage(eye.current);
  const previousEye = calculateAverage(eye.previous);

  const currentBlinks = calculateAverage(blink.current);
  const previousBlinks = calculateAverage(blink.previous);

  const currentFocus = presence.current.filter((p) => p.value === 1).length;
  const previousFocus = presence.previous.filter((p) => p.value === 1).length;

  const currentErgo = currentPosture * 0.4 + (1 - currentEye) * 0.4 + Math.min(currentBlinks / 15, 1) * 0.2;
  const previousErgo = previousPosture * 0.4 + (1 - previousEye) * 0.4 + Math.min(previousBlinks / 15, 1) * 0.2;

  return {
    posture: pctDelta(currentPosture, previousPosture),
    eyeStrain: pctDelta(currentEye, previousEye),
    blinks: pctDelta(currentBlinks, previousBlinks),
    ergonomic: pctDelta(currentErgo, previousErgo),
    focusMinutes: pctDelta(currentFocus, previousFocus),
  };
};
