import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBreakManager } from './useBreakManager';

describe('useBreakManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    (window as any).electronAPI = {
      onBreakCountdownUpdate: () => () => undefined,
      onBreakDue: () => () => undefined,
      onBreakWarning: () => () => undefined,
      startBreak: vi.fn().mockResolvedValue(true),
      endBreak: vi.fn().mockResolvedValue(true),
      snoozeBreak: vi.fn().mockResolvedValue(true),
      skipBreak: vi.fn().mockResolvedValue(true),
    };
  });

  it('clears scheduled break timeout on unmount', async () => {
    const { result, unmount } = renderHook(() =>
      useBreakManager({
        postureState: 'GOOD',
        eyeState: 'OK',
        postureScore: 0.8,
        eyeStrainScore: 0.2,
        brightnessLevel: 0.5,
      })
    );

    await act(async () => {
      await result.current.handleTakeBreak();
    });

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(6 * 60 * 1000);
    });

    expect((window as any).electronAPI.endBreak).not.toHaveBeenCalled();
  });
});
