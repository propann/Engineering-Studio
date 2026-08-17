import { useEffect, useState } from 'react';
import { usePlayerProfileStore } from './store/playerProfileStore';
import { OnboardingFlow } from './pages/Onboarding';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';

export function App() {
  const { profile } = usePlayerProfileStore();
  const [showLanding, setShowLanding] = useState(true);

  // Load profile on startup
  useEffect(() => {
    const saved = localStorage.getItem('studio-hub-profile');
    if (saved) {
      try {
        const loaded = JSON.parse(saved);
        usePlayerProfileStore.setState({ profile: loaded });
        setShowLanding(false); // Skip landing if profile exists
      } catch (e) {
        console.log('No saved profile');
      }
    }
  }, []);

  return (
    <div className="app">
      {showLanding && !profile ? (
        <LandingPage onEnter={() => setShowLanding(false)} />
      ) : profile ? (
        <Dashboard />
      ) : (
        <OnboardingFlow />
      )}

      <style>{`
        .app {
          min-height: 100vh;
          font-family: system-ui, -apple-system, sans-serif;
          background: #fafafa;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
