export interface WeeklySummaryBlock {
  wins: string[];
  regressions: string[];
  nextGoal: string;
}

/**
 * Lightweight “weekly” narrative from trend deltas and adherence (no extra IPC).
 */
export const buildWeeklySummary = (input: {
  postureTrend: number;
  eyeTrend: number;
  blinkTrend: number;
  adherencePct: number | null;
}): WeeklySummaryBlock => {
  const wins: string[] = [];
  const regressions: string[] = [];

  if (input.postureTrend > 5) wins.push('Posture is improving vs earlier in the window.');
  if (input.postureTrend < -5) regressions.push('Posture has slipped recently — reset chair and monitor height.');

  if (input.eyeTrend < -5) wins.push('Eye strain is trending down — keep up breaks and distance.');
  if (input.eyeTrend > 5) regressions.push('Eye strain is rising — shorten continuous screen time.');

  if (input.blinkTrend > 5) wins.push('Blink rate is recovering.');
  if (input.blinkTrend < -5) regressions.push('Blinking has slowed — schedule micro-pauses.');

  if (input.adherencePct != null) {
    if (input.adherencePct >= 70) wins.push(`Break reminders: ${input.adherencePct}% taken in this window.`);
    if (input.adherencePct < 50 && input.adherencePct > 0) {
      regressions.push(`Only ${input.adherencePct}% of break reminders were taken — snooze less when possible.`);
    }
  }

  const nextGoal =
    regressions.length > 0
      ? 'Next: address the top regression above, then re-check after your next work block.'
      : wins.length > 0
        ? 'Next: maintain this rhythm and tighten one habit (distance or break timing).'
        : 'Next: collect a bit more active time in this range for sharper trends.';

  return {
    wins: wins.slice(0, 3),
    regressions: regressions.slice(0, 3),
    nextGoal,
  };
};
