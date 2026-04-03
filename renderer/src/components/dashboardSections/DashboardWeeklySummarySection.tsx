import React from 'react';
import { Trophy, TrendingDown, Target } from 'lucide-react';
import { DashboardPanel } from './DashboardPanel';
import { WeeklySummaryBlock } from '../../utils/dashboardWeeklySummary';

export interface DashboardWeeklySummarySectionProps {
  summary: WeeklySummaryBlock;
}

export const DashboardWeeklySummarySection: React.FC<DashboardWeeklySummarySectionProps> = ({ summary }) => {
  const hasWins = summary.wins.length > 0;
  const hasReg = summary.regressions.length > 0;

  return (
    <DashboardPanel
      accent="brand"
      className="dashboard-weekly-summary"
      style={{
        marginBottom: 'var(--space-8)',
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
        <Trophy size={20} style={{ color: 'var(--warning)' }} aria-hidden />
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Window summary</h3>
      </div>
      <div className="dashboard-grid dashboard-grid--3" style={{ gap: 'var(--space-4)' }}>
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)', opacity: 0.9 }}>
            <Trophy size={16} aria-hidden />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Wins</span>
          </div>
          {hasWins ? (
            <ul className="dashboard-summary-list">
              {summary.wins.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-empty-hint">No strong positive trends yet for this range.</p>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)', opacity: 0.9 }}>
            <TrendingDown size={16} aria-hidden />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Watch points</span>
          </div>
          {hasReg ? (
            <ul className="dashboard-summary-list">
              {summary.regressions.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-empty-hint">No major regressions detected in this window.</p>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)', opacity: 0.9 }}>
            <Target size={16} aria-hidden />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Next goal</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            {summary.nextGoal}
          </p>
        </div>
      </div>
    </DashboardPanel>
  );
};
