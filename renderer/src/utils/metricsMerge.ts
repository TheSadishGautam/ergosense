import { MetricRecord } from '../../../models/types';

export interface CombinedMetricPoint {
  timestamp: number;
  posture: number;
  eyeStrain: number;
}

/** Minute-aligned current vs previous window for compare overlay charts */
export interface CombinedComparePoint {
  timestamp: number;
  posture: number | null;
  eyeStrain: number | null;
  posturePrev: number | null;
  eyeStrainPrev: number | null;
}

export interface BlinkComparePoint {
  timestamp: number;
  value: number | null;
  valuePrev: number | null;
}

export interface CompareAlignedSeries {
  combined: CombinedComparePoint[];
  blink: BlinkComparePoint[];
}

/**
 * Aligns current and previous windows to the same minute slots (x = current period time)
 * so trend charts can overlay “previous” as a dashed series.
 */
export const buildCompareAlignedSeries = (
  posture: MetricRecord[],
  eye: MetricRecord[],
  blink: MetricRecord[],
  windowMs: number
): CompareAlignedSeries => {
  const now = Date.now();
  const currentStart = now - windowMs;
  const previousStart = now - windowMs * 2;
  const bucketMs = 60_000;
  const slots = Math.max(1, Math.ceil(windowMs / bucketMs));

  const buildMapSegment = (recs: MetricRecord[], start: number, end: number, inclusiveEnd: boolean) => {
    const m = new Map<number, number>();
    recs.forEach((r) => {
      const inRange = inclusiveEnd
        ? r.timestamp >= start && r.timestamp <= end
        : r.timestamp >= start && r.timestamp < end;
      if (inRange) {
        m.set(Math.floor(r.timestamp / bucketMs), r.value);
      }
    });
    return m;
  };

  const pCur = buildMapSegment(posture, currentStart, now, true);
  const pPrev = buildMapSegment(posture, previousStart, currentStart, false);
  const eCur = buildMapSegment(eye, currentStart, now, true);
  const ePrev = buildMapSegment(eye, previousStart, currentStart, false);
  const bCur = buildMapSegment(blink, currentStart, now, true);
  const bPrev = buildMapSegment(blink, previousStart, currentStart, false);

  const combined: CombinedComparePoint[] = [];
  const blinkRows: BlinkComparePoint[] = [];

  for (let i = 0; i < slots; i++) {
    const ts = currentStart + i * bucketMs;
    const bCurKey = Math.floor(ts / bucketMs);
    const tsPrev = previousStart + i * bucketMs;
    const bPrevKey = Math.floor(tsPrev / bucketMs);

    combined.push({
      timestamp: ts,
      posture: pCur.get(bCurKey) ?? null,
      eyeStrain: eCur.get(bCurKey) ?? null,
      posturePrev: pPrev.get(bPrevKey) ?? null,
      eyeStrainPrev: ePrev.get(bPrevKey) ?? null,
    });

    blinkRows.push({
      timestamp: ts,
      value: bCur.get(bCurKey) ?? null,
      valuePrev: bPrev.get(bPrevKey) ?? null,
    });
  }

  return { combined, blink: blinkRows };
};

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
