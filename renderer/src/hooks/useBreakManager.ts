import { useEffect, useRef, useState } from 'react';
import { LiveState } from '../../../models/types';

export const useBreakManager = (liveState: LiveState | null) => {
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeUntilBreak, setTimeUntilBreak] = useState(0);
  const [showBreakCountdown, setShowBreakCountdown] = useState(false);
  const [isQuietMode, setIsQuietMode] = useState(false);
  const liveStateRef = useRef<LiveState | null>(liveState);
  const breakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    liveStateRef.current = liveState;
  }, [liveState]);

  useEffect(() => {
    const unsubCountdown = window.electronAPI.onBreakCountdownUpdate((data) => {
      setTimeUntilBreak(data.timeRemaining);
      setIsQuietMode(!!data.isQuietMode);
      setShowBreakCountdown(true);
    });

    const unsubBreakDue = window.electronAPI.onBreakDue((data) => {
      setBreakDuration(data.duration);
      setShowBreakPrompt(true);
    });

    const unsubWarning = window.electronAPI.onBreakWarning((data) => {
      console.log(`Break in ${data.minutesRemaining} minutes`);
    });

    return () => {
      if (breakTimeoutRef.current) {
        clearTimeout(breakTimeoutRef.current);
      }
      unsubCountdown();
      unsubBreakDue();
      unsubWarning();
    };
  }, []);

  const handleTakeBreak = async () => {
    setShowBreakPrompt(false);
    await window.electronAPI.startBreak();

    if (breakTimeoutRef.current) {
      clearTimeout(breakTimeoutRef.current);
    }

    breakTimeoutRef.current = setTimeout(async () => {
      const current = liveStateRef.current;
      const currentStrain = current ? (current.postureScore + current.eyeStrainScore) / 2 : 0;
      await window.electronAPI.endBreak(currentStrain);
      breakTimeoutRef.current = null;
    }, breakDuration * 60 * 1000);
  };

  return {
    showBreakPrompt,
    breakDuration,
    timeUntilBreak,
    showBreakCountdown,
    isQuietMode,
    handleTakeBreak,
    handleSnoozeBreak: async () => {
      setShowBreakPrompt(false);
      await window.electronAPI.snoozeBreak();
    },
    handleSkipBreak: async () => {
      setShowBreakPrompt(false);
      await window.electronAPI.skipBreak();
    },
  };
};
