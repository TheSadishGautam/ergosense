import { describe, expect, it } from 'vitest';
import { breakHistoryToChartMarkers, summarizeBreakAdherence } from './breakChartMarkers';

describe('breakHistoryToChartMarkers', () => {
  it('maps scheduled and taken breaks inside the window', () => {
    const windowStart = 1000;
    const windowEnd = 2000;
    const rows = [
      { scheduled_time: 1200, actual_time: 1250, was_taken: 1 },
      { scheduled_time: 900, actual_time: null, was_taken: 0 },
    ];
    const m = breakHistoryToChartMarkers(rows, windowStart, windowEnd);
    expect(m.some((x) => x.timestamp === 1200 && x.variant === 'scheduled')).toBe(true);
    expect(m.some((x) => x.timestamp === 1250 && x.variant === 'taken')).toBe(true);
  });
});

describe('summarizeBreakAdherence', () => {
  it('computes adherence percentage', () => {
    const s = summarizeBreakAdherence([
      { was_taken: 1, was_snoozed: 0 },
      { was_taken: 1, was_snoozed: 0 },
      { was_taken: 0, was_snoozed: 0 },
    ]);
    expect(s.scheduled).toBe(3);
    expect(s.taken).toBe(2);
    expect(s.adherencePct).toBe(67);
  });
});
