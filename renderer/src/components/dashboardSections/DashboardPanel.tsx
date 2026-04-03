import React from 'react';

export interface DashboardPanelProps {
  children: React.ReactNode;
  className?: string;
  /** Optional top accent bar (brand gradient) */
  accent?: 'brand' | 'none';
  padding?: 'default' | 'none';
  style?: React.CSSProperties;
}

/**
 * Base surface for dashboard sections. Phase 1: structural wrapper; Phase 2+ will refine visuals.
 */
export const DashboardPanel: React.FC<DashboardPanelProps> = ({
  children,
  className = '',
  accent = 'none',
  padding = 'default',
  style,
}) => (
  <div
    className={`dashboard-panel ${padding === 'default' ? 'dashboard-panel--padded' : ''} ${className}`.trim()}
    style={{ position: 'relative', overflow: 'hidden', ...style }}
  >
    {accent === 'brand' && <div className="dashboard-panel__accent" aria-hidden />}
    {children}
  </div>
);

export interface DashboardPanelHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const DashboardPanelHeader: React.FC<DashboardPanelHeaderProps> = ({
  icon,
  title,
  description,
  actions,
}) => (
  <div className="dashboard-panel-header">
    <div className="dashboard-panel-header__lead">
      <div className="dashboard-panel-header__icon">{icon}</div>
      <div>
        <h2 className="dashboard-panel-header__title">{title}</h2>
        {description && <p className="dashboard-panel-header__desc">{description}</p>}
      </div>
    </div>
    {actions && <div className="dashboard-panel-header__actions">{actions}</div>}
  </div>
);
