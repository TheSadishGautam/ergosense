import React from 'react';

import { TimeRange } from '../hooks/useMetrics';

interface TimeRangeSelectorProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

const ranges: { value: TimeRange; label: string }[] = [
  { value: '30M', label: '30 Min' },
  { value: '1H', label: '1 Hour' },
  { value: '6H', label: '6 Hours' },
  { value: '24H', label: '24 Hours' },
  { value: '7D', label: '7 Days' },
  { value: '30D', label: '30 Days' },
];

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selected,
  onChange,
}) => {
  return (
    <div className="flex gap-2" style={{ 
      background: 'rgba(255, 255, 255, 0.1)',
      padding: 'var(--space-1)',
      borderRadius: 'var(--radius-lg)',
      backdropFilter: 'blur(10px)',
    }}>
      {ranges.map(range => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className="btn btn-sm"
          style={{
            background: selected === range.value 
              ? 'var(--gradient-orange)' 
              : 'transparent',
            color: 'white',
            border: selected === range.value 
              ? '1px solid rgba(255, 255, 255, 0.3)'
              : '1px solid transparent',
            fontWeight: selected === range.value ? 700 : 500,
            transition: 'all var(--transition-base)',
            boxShadow: selected === range.value 
              ? '0 4px 12px rgba(234, 88, 12, 0.4)'
              : 'none',
          }}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};
