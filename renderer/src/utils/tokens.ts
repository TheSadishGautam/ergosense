/**
 * Canonical color tokens for JS (charts, inline styles) and documentation.
 * Keep `renderer/src/styles.css` :root chart/status variables aligned with these values.
 */
export const TOKENS = {
  status: {
    /** Tier “excellent” (charts / distribution) — indigo, distinct from brand orange */
    excellent: '#6366f1',
    good: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },
  brand: {
    primary: '#ea580b',
    primaryLight: '#fb923c',
    primaryDark: '#c2410c',
  },
  chart: {
    posture: '#a855f7',
    postureMid: '#c084fc',
    eyeStrain: '#ea580c',
    barBlink: '#ea580c',
  },
  background: {
    slate900: '#0f172a',
    slate800: '#1e293b',
    slate700: '#334155',
  },
} as const;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = hex.replace('#', '');
  const v = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const num = parseInt(v, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Status-tier card backgrounds used by MetricCard / distribution */
export function statusTierGradient(hex: string): string {
  return `linear-gradient(135deg, ${rgba(hex, 0.2)} 0%, ${rgba(hex, 0.1)} 100%)`;
}
