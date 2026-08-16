import { useEffect } from 'react';

export function useHubInitialization() {
  useEffect(() => {
    // Try to get profile from Hub
    const hubProfileJson = sessionStorage.getItem('hub:playerProfile');

    if (hubProfileJson) {
      try {
        const hubProfile = JSON.parse(hubProfileJson);
        console.log('✅ OP-1: Received profile from Hub:', hubProfile.name);

        // Store in localStorage for persistence
        localStorage.setItem('op1:playerProfile', JSON.stringify(hubProfile));

        // Dispatch initialization events
        window.dispatchEvent(new CustomEvent('hub:profileLoaded', { detail: hubProfile }));

      } catch (error) {
        console.error('❌ OP-1: Failed to parse Hub profile:', error);
      }
    } else {
      console.warn('⚠️ OP-1: No profile from Hub, checking local storage');
      const localProfile = localStorage.getItem('op1:playerProfile');
      if (localProfile) {
        console.log('✅ OP-1: Using local profile');
      }
    }
  }, []);
}
