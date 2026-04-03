export type BreakMarkerVariant = 'scheduled' | 'taken';

export interface BreakChartMarker {
  timestamp: number;
  variant: BreakMarkerVariant;
}

/**
 * Maps break_history rows to vertical chart markers within [windowStart, windowEnd].
 */
export const breakHistoryToChartMarkers = (
  rows: Array<{ scheduled_time: number; actual_time: number | null; was_taken: number }>,
  windowStart: number,
  windowEnd: number
): BreakChartMarker[] => {
  const out: BreakChartMarker[] = [];
  for (const r of rows) {
    if (r.scheduled_time >= windowStart && r.scheduled_time <= windowEnd) {
      out.push({ timestamp: r.scheduled_time, variant: 'scheduled' });
      if (r.was_taken && r.actual_time != null && r.actual_time >= windowStart && r.actual_time <= windowEnd) {
        out.push({ timestamp: r.actual_time, variant: 'taken' });
      }
    }
  }
  return out.sort((a, b) => a.timestamp - b.timestamp);
};

export const summarizeBreakAdherence = (
  rows: Array<{ was_taken: number; was_snoozed: number }>
): { scheduled: number; taken: number; snoozed: number; skipped: number; adherencePct: number | null } => {
  const scheduled = rows.length;
  const taken = rows.filter((r) => r.was_taken).length;
  const snoozed = rows.filter((r) => r.was_snoozed).length;
  const skipped = rows.filter((r) => !r.was_taken && !r.was_snoozed).length;
  const adherencePct = scheduled > 0 ? Math.round((taken / scheduled) * 100) : null;
  return { scheduled, taken, snoozed, skipped, adherencePct };
};
