export type StatusLevel = 'excellent' | 'good' | 'warning' | 'danger';

export const getPostureStatus = (score: number): StatusLevel => {
  if (score >= 0.85) return 'excellent';
  if (score >= 0.7) return 'good';
  if (score >= 0.4) return 'warning';
  return 'danger';
};

export const getEyeStatus = (strain: number): StatusLevel => {
  if (strain <= 0.15) return 'excellent';
  if (strain <= 0.3) return 'good';
  if (strain <= 0.6) return 'warning';
  return 'danger';
};

export const getBlinkStatus = (rate: number): StatusLevel => {
  if (rate >= 15 && rate <= 25) return 'excellent';
  if (rate >= 12 && rate <= 30) return 'good';
  if (rate >= 8 && rate <= 35) return 'warning';
  return 'danger';
};
