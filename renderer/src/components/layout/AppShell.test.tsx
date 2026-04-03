import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { AppShell, AppView } from './AppShell';

const AppShellHarness = () => {
  const [view, setView] = useState<AppView>('LIVE');
  return (
    <AppShell view={view} onViewChange={setView}>
      <div>content</div>
    </AppShell>
  );
};

describe('AppShell tabs', () => {
  it('moves selection with arrow keys', () => {
    render(<AppShellHarness />);

    const liveTab = screen.getByRole('tab', { name: /live/i });
    fireEvent.keyDown(liveTab, { key: 'ArrowRight' });

    const dashboardTab = screen.getByRole('tab', { name: /dashboard/i });
    expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
  });
});
