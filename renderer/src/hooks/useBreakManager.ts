import { useEffect, useState } from 'react';
import { LiveState } from '../../../models/types';

export const useBreakManager = (liveState: LiveState | null) => {
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeUntilBreak, setTimeUntilBreak] = useState(0);
  const [showBreakCountdown, setShowBreakCountdown] = useState(false);
  const [isQuietMode, setIsQuietMode] = useState(false);

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
      unsubCountdown();
      unsubBreakDue();
      unsubWarning();
    };
  }, []);

  const handleTakeBreak = async () => {
    setShowBreakPrompt(false);
    await window.electronAPI.startBreak();

    setTimeout(async () => {
      const currentStrain = liveState ? (liveState.postureScore + liveState.eyeStrainScore) / 2 : 0;
      await window.electronAPI.endBreak(currentStrain);
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
