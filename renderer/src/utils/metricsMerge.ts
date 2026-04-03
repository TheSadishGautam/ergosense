import { MetricRecord } from '../../../models/types';

/** Long ranges only: cap points so Recharts does not freeze on 7D/30D. ≤24H keeps 1-minute buckets. */
const MAX_CHART_POINTS_LONG_RANGE = 420;
const MAX_CHART_POINTS_DAY_OR_LESS = 1440;

export const chartBucketMsForWindow = (windowMs: number): number => {
  const minBucket = 60_000;
  const maxPoints =
    windowMs > 24 * 60 * 60 * 1000 ? MAX_CHART_POINTS_LONG_RANGE : MAX_CHART_POINTS_DAY_OR_LESS;
  let bucket = minBucket;
  while (Math.ceil(windowMs / bucket) > maxPoints) {
    const next = bucket * 2;
    if (next <= bucket) break;
    bucket = next;
  }
  return bucket;
};

const aggregateByBucket = (recs: MetricRecord[], bucketMs: number): Map<number, number> => {
  const sums = new Map<number, { sum: number; n: number }>();
  recs.forEach((sample) => {
    const b = Math.floor(sample.timestamp / bucketMs);
    const cur = sums.get(b) ?? { sum: 0, n: 0 };
    cur.sum += sample.value;
    cur.n += 1;
    sums.set(b, cur);
  });
  const m = new Map<number, number>();
  sums.forEach((v, k) => m.set(k, v.sum / v.n));
  return m;
};

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
  const bucketMs = chartBucketMsForWindow(windowMs);
  const slots = Math.max(1, Math.ceil(windowMs / bucketMs));

  const buildMapSegment = (recs: MetricRecord[], start: number, end: number, inclusiveEnd: boolean) => {
    const inWindow = recs.filter((r) =>
      inclusiveEnd ? r.timestamp >= start && r.timestamp <= end : r.timestamp >= start && r.timestamp < end
    );
    return aggregateByBucket(inWindow, bucketMs);
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

/**
 * @param windowMs When set, bucket size scales up for long ranges so charts stay under ~400 points.
 */
export const mergeMetricSeriesByMinute = (
  posture: MetricRecord[],
  eye: MetricRecord[],
  windowMs?: number
): CombinedMetricPoint[] => {
  const bucketMs = windowMs != null ? chartBucketMsForWindow(windowMs) : 60_000;
  const postureByBucket = aggregateByBucket(posture, bucketMs);
  const eyeByBucket = aggregateByBucket(eye, bucketMs);

  const allBuckets = new Set<number>([...postureByBucket.keys(), ...eyeByBucket.keys()]);
  return [...allBuckets]
    .sort((a, b) => a - b)
    .map((bucket) => ({
      timestamp: bucket * bucketMs,
      posture: postureByBucket.get(bucket) ?? 0,
      eyeStrain: eyeByBucket.get(bucket) ?? 0,
    }));
};

/** Downsamples raw blink samples to the same adaptive buckets as trend charts (avoids huge bar counts on 7D/30D). */
export const aggregateBlinkSeriesForChart = (blink: MetricRecord[], windowMs: number): MetricRecord[] => {
  const bucketMs = chartBucketMsForWindow(windowMs);
  const sums = new Map<number, { sum: number; n: number }>();
  blink.forEach((b) => {
    const key = Math.floor(b.timestamp / bucketMs);
    const cur = sums.get(key) ?? { sum: 0, n: 0 };
    cur.sum += b.value;
    cur.n += 1;
    sums.set(key, cur);
  });
  return [...sums.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bucket, { sum, n }], idx) => ({
      id: idx,
      timestamp: bucket * bucketMs,
      type: 'BLINK' as const,
      value: sum / n,
      metadata: '',
    }));
};
