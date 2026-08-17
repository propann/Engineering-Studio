import { CreateProfile } from './CreateProfile';
import { Dashboard } from './Dashboard';
import { useState } from 'react';
import { usePlayerProfileStore } from '../store/playerProfileStore';

export function OnboardingFlow() {
  const { profile } = usePlayerProfileStore();
  const [showOnboarding, setShowOnboarding] = useState(!profile);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // If profile exists, show dashboard instead
  if (!showOnboarding && profile) {
    return <Dashboard />;
  }

  // Show the consolidated profile creation page
  return <CreateProfile onComplete={handleOnboardingComplete} />;
}
