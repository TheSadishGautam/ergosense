import React from 'react';
import { Zap, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';
import { DashboardPanel } from './DashboardPanel';
import { DashboardInsight, InsightActionKind } from '../../utils/dashboardInsights';

export interface DashboardInsightsSectionProps {
  findings: string[];
  recommendations: DashboardInsight[];
  onInsightAction?: (kind: InsightActionKind) => void;
}

const severityIcon = (severity: DashboardInsight['severity']) => {
  const common = { flexShrink: 0 as const };
  switch (severity) {
    case 'critical':
      return <AlertTriangle size={16} style={{ ...common, color: 'var(--danger)' }} aria-hidden />;
    case 'warning':
      return <AlertTriangle size={16} style={{ ...common, color: 'var(--warning)' }} aria-hidden />;
    case 'positive':
      return <CheckCircle size={16} style={{ ...common, color: 'var(--success)' }} aria-hidden />;
    default:
      return <Lightbulb size={16} style={{ ...common, color: 'var(--info)' }} aria-hidden />;
  }
};

export const DashboardInsightsSection: React.FC<DashboardInsightsSectionProps> = ({
  findings,
  recommendations,
  onInsightAction,
}) => (
  <DashboardPanel
    accent="brand"
    className="dashboard-insights-shell"
    style={{
      marginBottom: 'var(--space-8)',
      background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
      border: '1px solid rgba(234, 88, 12, 0.3)',
      color: 'white',
      boxShadow: '0 4px 20px rgba(234, 88, 12, 0.2)',
    }}
  >
    <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-4)', paddingTop: 'var(--space-2)' }}>
      <div
        style={{
          padding: 'var(--space-3)',
          background: 'var(--gradient-orange)',
          borderRadius: 'var(--radius-lg)',
          fontSize: '1.5rem',
          boxShadow: '0 4px 12px rgba(234, 88, 12, 0.4)',
          color: 'white',
        }}
      >
        <Zap size={24} aria-hidden />
      </div>
      <h3 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>Insights & recommendations</h3>
    </div>
    <div className="grid grid-cols-2 gap-4 dashboard-insights-grid">
      <div>
        <h4 style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: 'var(--space-2)' }}>Key findings</h4>
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem', lineHeight: 1.8 }}>
          {findings.map((text, i) => (
            <li key={i}>• {text}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: 'var(--space-2)' }}>Top actions</h4>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            fontSize: '0.875rem',
            lineHeight: 1.6,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          {recommendations.map((rec) => (
            <li key={rec.id} className="dashboard-insight-item">
              <div className="flex items-start gap-2">
                {severityIcon(rec.severity)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{rec.title}</div>
                  <div style={{ opacity: 0.85, marginTop: 4 }}>{rec.detail}</div>
                  {rec.action && onInsightAction && (
                    <button
                      type="button"
                      className="dashboard-insight-cta"
                      onClick={() => onInsightAction(rec.action!.kind)}
                    >
                      {rec.action.label}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </DashboardPanel>
);
