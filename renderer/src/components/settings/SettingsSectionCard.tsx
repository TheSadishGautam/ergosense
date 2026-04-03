import React from 'react';

interface SettingsSectionCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const SettingsSectionCard: React.FC<SettingsSectionCardProps> = ({ children, style }) => {
  return (
    <div className="card" style={style}>
      {children}
    </div>
  );
};
