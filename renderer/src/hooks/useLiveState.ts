import { useEffect, useState } from 'react';
import { LiveState } from '../../../models/types';

export const useLiveState = () => {
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  useEffect(() => {
    const cleanupLive = window.electronAPI.onLiveStateUpdate((state) => {
      setLiveState(state);
    });

    const cleanupUpdate = window.electronAPI.onUpdateAvailable(() => {
      setShowUpdateBanner(true);
    });

    return () => {
      cleanupLive();
      cleanupUpdate();
    };
  }, []);

  return {
    liveState,
    showUpdateBanner,
    dismissUpdateBanner: () => setShowUpdateBanner(false),
  };
};
