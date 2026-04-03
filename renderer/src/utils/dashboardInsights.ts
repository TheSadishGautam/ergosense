export type InsightSeverity = 'critical' | 'warning' | 'positive' | 'info';

export type InsightActionKind =
  | 'navigate-settings'
  | 'navigate-live'
  | 'open-stretch'
  | 'open-calibration';

export interface DashboardInsight {
  id: string;
  title: string;
  detail: string;
  severity: InsightSeverity;
  priority: number;
  action?: { label: string; kind: InsightActionKind };
}

export interface DashboardInsightsInput {
  avgPosture: number;
  avgEyeStrain: number;
  avgBlinks: number;
  postureTrend: number;
  eyeTrend: number;
  blinkTrend: number;
  totalDataPoints: number;
}

export interface DashboardInsightsResult {
  findings: string[];
  recommendations: DashboardInsight[];
}

const GENERIC_TIPS: DashboardInsight[] = [
  {
    id: 'generic-20-20-20',
    title: 'Use the 20-20-20 rule',
    detail: 'Every 20 minutes, look at something ~20 feet away for 20 seconds to relax eye focus.',
    severity: 'info',
    priority: 90,
    action: { label: 'Break settings', kind: 'navigate-settings' },
  },
  {
    id: 'generic-monitor-height',
    title: 'Align monitor to eye level',
    detail: 'Top of the screen at or slightly below eye level reduces neck strain.',
    severity: 'info',
    priority: 91,
    action: { label: 'Open settings', kind: 'navigate-settings' },
  },
  {
    id: 'generic-microbreaks',
    title: 'Take micro-breaks',
    detail: 'Stand, stretch, or walk for 1–2 minutes each hour to reset posture and circulation.',
    severity: 'info',
    priority: 92,
    action: { label: 'Stretch guide', kind: 'open-stretch' },
  },
];

export const buildDashboardInsights = (input: DashboardInsightsInput): DashboardInsightsResult => {
  const {
    avgPosture,
    avgEyeStrain,
    avgBlinks,
    postureTrend,
    eyeTrend,
    blinkTrend,
    totalDataPoints,
  } = input;

  const findings: string[] = [];

  if (totalDataPoints < 8) {
    findings.push('Collecting more samples — trends will sharpen as data accumulates.');
  }

  if (avgPosture >= 0.85) {
    findings.push('Posture quality is strong for this period.');
  } else if (avgPosture >= 0.7) {
    findings.push('Posture is mostly steady with room to improve.');
  } else {
    findings.push('Posture quality is below target — sustained slouch or drift detected.');
  }

  if (avgEyeStrain <= 0.15) {
    findings.push('Eye strain is low — good screen habits.');
  } else if (avgEyeStrain <= 0.3) {
    findings.push('Moderate eye strain — consider more breaks or distance checks.');
  } else {
    findings.push('Eye strain is elevated — prioritize breaks and screen distance.');
  }

  if (avgBlinks >= 15) {
    findings.push('Blink rate looks healthy.');
  } else if (avgBlinks >= 12) {
    findings.push('Blink rate is acceptable but could be higher.');
  } else {
    findings.push('Blink rate is low — dry eyes and fatigue risk increase.');
  }

  const rules: DashboardInsight[] = [];

  if (avgPosture < 0.4) {
    rules.push({
      id: 'posture-critical',
      title: 'Posture needs attention',
      detail: 'Average posture score is low. Reset your chair, screen height, and sit with shoulders relaxed.',
      severity: 'critical',
      priority: 1,
      action: { label: 'Run calibration', kind: 'open-calibration' },
    });
  } else if (postureTrend < -8) {
    rules.push({
      id: 'posture-worsening',
      title: 'Posture is trending down',
      detail: `Recent posture is ~${Math.abs(postureTrend).toFixed(0)}% worse than earlier in this window. Check ergonomics before fatigue sets in.`,
      severity: 'warning',
      priority: 10,
      action: { label: 'View live feedback', kind: 'navigate-live' },
    });
  }

  if (avgEyeStrain > 0.45) {
    rules.push({
      id: 'eye-critical',
      title: 'High eye strain',
      detail: 'Reduce continuous focus time: use timed breaks, lower brightness, and increase viewing distance.',
      severity: 'critical',
      priority: 2,
      action: { label: 'Break & display settings', kind: 'navigate-settings' },
    });
  } else if (eyeTrend > 8) {
    rules.push({
      id: 'eye-worsening',
      title: 'Eye strain is increasing',
      detail: `Strain is ~${eyeTrend.toFixed(0)}% higher in recent samples — add short eye breaks now.`,
      severity: 'warning',
      priority: 11,
      action: { label: 'Go to Live', kind: 'navigate-live' },
    });
  }

  if (avgBlinks < 10) {
    rules.push({
      id: 'blink-low',
      title: 'Blink rate is low',
      detail: 'Aim for 12–20 blinks/min. Consciously blink during reading or deep focus tasks.',
      severity: 'warning',
      priority: 3,
      action: { label: 'Notification settings', kind: 'navigate-settings' },
    });
  } else if (blinkTrend < -8) {
    rules.push({
      id: 'blink-dropping',
      title: 'Blinking has slowed recently',
      detail: `Blink rate is ~${Math.abs(blinkTrend).toFixed(0)}% lower in recent samples — hydrate and take a short screen break.`,
      severity: 'warning',
      priority: 12,
      action: { label: 'View Live', kind: 'navigate-live' },
    });
  }

  const hasCritical = rules.some((r) => r.severity === 'critical');
  if (!hasCritical && avgPosture >= 0.85 && avgEyeStrain <= 0.2 && avgBlinks >= 14) {
    rules.push({
      id: 'all-good',
      title: 'Strong ergonomics baseline',
      detail: 'Keep this rhythm: micro-breaks and calibration will help maintain gains.',
      severity: 'positive',
      priority: 50,
      action: { label: 'Stretch guide', kind: 'open-stretch' },
    });
  }

  const sorted = [...rules].sort((a, b) => a.priority - b.priority);
  const unique: DashboardInsight[] = [];
  const seen = new Set<string>();
  for (const r of sorted) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    unique.push(r);
  }

  let recommendations = unique.slice(0, 3);

  if (recommendations.length < 3) {
    for (const tip of GENERIC_TIPS) {
      if (recommendations.length >= 3) break;
      if (!recommendations.some((x) => x.id === tip.id)) {
        recommendations.push(tip);
      }
    }
  }

  return {
    findings: findings.slice(0, 4),
    recommendations,
  };
};
