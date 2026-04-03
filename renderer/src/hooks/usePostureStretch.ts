import { useEffect, useState } from 'react';
import { LiveState } from '../../../models/types';

const POOR_POSTURE_THRESHOLD_MS = 10 * 60 * 1000;
const SNOOZE_OFFSET_MS = 5 * 60 * 1000;

export const usePostureStretch = (liveState: LiveState | null, isCalibrationOpen: boolean) => {
  const [showStretchGuide, setShowStretchGuide] = useState(false);
  const [poorPostureStartTime, setPoorPostureStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (!liveState) return;

    if (liveState.postureState === 'BAD') {
      if (poorPostureStartTime === null) {
        setPoorPostureStartTime(Date.now());
      } else {
        const duration = Date.now() - poorPostureStartTime;
        if (duration >= POOR_POSTURE_THRESHOLD_MS && !showStretchGuide && !isCalibrationOpen) {
          setShowStretchGuide(true);
          setPoorPostureStartTime(null);
        }
      }
    } else if (poorPostureStartTime !== null) {
      setPoorPostureStartTime(null);
    }
  }, [isCalibrationOpen, liveState, poorPostureStartTime, showStretchGuide]);

  return {
    showStretchGuide,
    openStretchGuide: () => setShowStretchGuide(true),
    completeStretchGuide: () => setShowStretchGuide(false),
    snoozeStretchGuide: () => {
      setShowStretchGuide(false);
      setPoorPostureStartTime(Date.now() - SNOOZE_OFFSET_MS);
    },
    dismissStretchGuide: () => {
      setShowStretchGuide(false);
      setPoorPostureStartTime(null);
    },
  };
};
