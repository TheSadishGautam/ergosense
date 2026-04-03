import { TOKENS, rgba, statusTierGradient } from './tokens';

export const COLORS = {
  excellent: TOKENS.status.excellent,
  good: TOKENS.status.good,
  warning: TOKENS.status.warning,
  danger: TOKENS.status.danger,
  info: TOKENS.status.info,
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
  },
  background: {
    primary: TOKENS.background.slate900,
    secondary: TOKENS.background.slate800,
    tertiary: TOKENS.background.slate700,
  },
} as const;

export const GRADIENTS = {
  excellent: statusTierGradient(TOKENS.status.excellent),
  good: statusTierGradient(TOKENS.status.good),
  warning: statusTierGradient(TOKENS.status.warning),
  danger: statusTierGradient(TOKENS.status.danger),
  card: `linear-gradient(135deg, ${rgba(TOKENS.background.slate800, 0.7)} 0%, ${rgba(TOKENS.background.slate900, 0.7)} 100%)`,
  orange: `linear-gradient(135deg, ${TOKENS.brand.primary} 0%, ${TOKENS.brand.primaryDark} 100%)`,
} as const;

/** Recharts / dashboard series — import from here instead of hard-coded hex in components */
export const CHART = {
  posture: TOKENS.chart.posture,
  postureMid: TOKENS.chart.postureMid,
  eyeStrain: TOKENS.chart.eyeStrain,
  barBlink: TOKENS.chart.barBlink,
  infoStroke: TOKENS.status.info,
  infoStrokeEnd: '#2563eb',
} as const;
