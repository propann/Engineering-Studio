import { useEffect } from 'react';

export function useHubInitialization() {
  useEffect(() => {
    // Try to get profile from Hub
    const hubProfileJson = sessionStorage.getItem('hub:playerProfile');

    if (hubProfileJson) {
      try {
        const hubProfile = JSON.parse(hubProfileJson);
        console.log('✅ EP-133: Received profile from Hub:', hubProfile.name);

        // Store in localStorage for persistence
        localStorage.setItem('ep133:playerProfile', JSON.stringify(hubProfile));

        // Apply language preference
        if (hubProfile.settings?.preferredLanguage) {
          localStorage.setItem('app_language', hubProfile.settings.preferredLanguage);
        }

        // Dispatch initialization events
        window.dispatchEvent(new CustomEvent('hub:profileLoaded', { detail: hubProfile }));

      } catch (error) {
        console.error('❌ EP-133: Failed to parse Hub profile:', error);
      }
    } else {
      console.warn('⚠️ EP-133: No profile from Hub, checking local storage');
      const localProfile = localStorage.getItem('ep133:playerProfile');
      if (localProfile) {
        console.log('✅ EP-133: Using local profile');
      }
    }
  }, []);
}
