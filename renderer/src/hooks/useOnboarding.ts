import { useCallback, useEffect, useState } from 'react';

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await window.electronAPI.getAppSetting('onboardingCompleted');
        setShowOnboarding(!completed);
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
        setShowOnboarding(true);
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await window.electronAPI.setAppSetting('onboardingCompleted', true);
    } catch (err) {
      console.error('Failed to save onboarding status:', err);
    } finally {
      setShowOnboarding(false);
    }
  }, []);

  return {
    loading,
    showOnboarding,
    completeOnboarding,
  };
};
