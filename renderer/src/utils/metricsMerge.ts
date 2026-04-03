import { MetricRecord } from '../../../models/types';

export interface CombinedMetricPoint {
  timestamp: number;
  posture: number;
  eyeStrain: number;
}

export const mergeMetricSeriesByMinute = (
  posture: MetricRecord[],
  eye: MetricRecord[]
): CombinedMetricPoint[] => {
  const bucketMs = 60_000;
  const postureByBucket = new Map<number, number>();
  const eyeByBucket = new Map<number, number>();

  posture.forEach((sample) => {
    postureByBucket.set(Math.floor(sample.timestamp / bucketMs), sample.value);
  });
  eye.forEach((sample) => {
    eyeByBucket.set(Math.floor(sample.timestamp / bucketMs), sample.value);
  });

  const allBuckets = new Set<number>([...postureByBucket.keys(), ...eyeByBucket.keys()]);
  return [...allBuckets]
    .sort((a, b) => a - b)
    .map((bucket) => ({
      timestamp: bucket * bucketMs,
      posture: postureByBucket.get(bucket) ?? 0,
      eyeStrain: eyeByBucket.get(bucket) ?? 0,
    }));
};
