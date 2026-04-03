/**
 * Plain-language hero line for the dashboard (Phase 0: quick scan).
 */
export const buildHeroSummaryLine = (input: {
  avgPosture: number;
  avgEyeStrain: number;
  avgBlinks: number;
  /** Same 0–1 composite as dashboard ergonomic score */
  ergoScore01: number;
}): string => {
  const { ergoScore01: s, avgEyeStrain, avgBlinks } = input;
  if (s >= 0.85) {
    return 'You are in a strong ergonomic rhythm for this window.';
  }
  if (s >= 0.7) {
    return 'Overall habits look solid — small tweaks to breaks and distance can lift your score further.';
  }
  if (s >= 0.5) {
    if (avgEyeStrain > 0.35) {
      return 'Eye strain is the main drag — shorten focus stretches and check screen distance.';
    }
    if (avgBlinks < 12) {
      return 'Blink rate is limiting your comfort — add conscious blinks and hydration.';
    }
    return 'There is clear room to improve: prioritize breaks, posture, and screen setup.';
  }
  return 'Focus on fundamentals: alignment, breaks, and blinking before adding intensity.';
};
