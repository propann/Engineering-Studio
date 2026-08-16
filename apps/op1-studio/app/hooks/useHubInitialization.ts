import { useEffect } from 'react';

const IMPORTED_PROFILE_KEY = 'studio-hub:imported-profile';

function readImportedProfile(queryProfile: string | null) {
  if (queryProfile) return queryProfile;
  try {
    return sessionStorage.getItem('hub:playerProfile') || localStorage.getItem(IMPORTED_PROFILE_KEY);
  } catch {
    return null;
  }
}

function cacheImportedProfile(profile: unknown) {
  try {
    const serialized = JSON.stringify(profile);
    sessionStorage.setItem('hub:playerProfile', serialized);
    localStorage.setItem(IMPORTED_PROFILE_KEY, serialized);
  } catch {
    // Le cache est un confort : la session continue avec le profil reçu.
  }
}

export function useHubInitialization() {
  useEffect(() => {
    // Le Hub et le studio ont des origines différentes en développement.
    // Le profil est transmis par le Hub dans l'URL du lancement. Il est mis en
    // cache en lecture seule pour survivre à un rafraîchissement de l'outil.
    const params = new URLSearchParams(window.location.search);
    const hubOrigin = (() => {
      try {
        return new URL(params.get('hubReturn') || 'http://127.0.0.1:5179/').origin;
      } catch {
        return 'http://127.0.0.1:5179';
      }
    })();
    const queryProfile = params.get('hubProfile');
    const hubProfileJson = readImportedProfile(queryProfile);

    if (hubProfileJson) {
      try {
        const hubProfile = JSON.parse(hubProfileJson);
        cacheImportedProfile(hubProfile);
        console.log('✅ OP-1: Received profile from Hub:', hubProfile.name);

        if (queryProfile) {
          params.delete('hubProfile');
          const cleanQuery = params.toString();
          window.history.replaceState({}, '', `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash}`);
        }

        // Dispatch initialization events
        window.dispatchEvent(new CustomEvent('hub:profileLoaded', { detail: hubProfile }));

      } catch (error) {
        console.error('❌ OP-1: Failed to parse Hub profile:', error);
      }
    } else {
      console.warn('⚠️ OP-1: No profile from Hub');
    }

    const onWorkspace = (event: MessageEvent<{ type?: string; workspaceHandle?: FileSystemDirectoryHandle | null; profile?: unknown }>) => {
      if (event.data?.type !== 'hub:workspace') return;
      if (event.origin !== hubOrigin || (window.opener && event.source !== window.opener)) return;
      if (event.data.profile) {
        cacheImportedProfile(event.data.profile);
        window.dispatchEvent(new CustomEvent('hub:profileLoaded', { detail: event.data.profile }));
      }
      window.dispatchEvent(new CustomEvent('hub:workspaceLoaded', { detail: event.data.workspaceHandle ?? null }));
    };
    window.addEventListener('message', onWorkspace);
    window.opener?.postMessage({ type: 'studio:ready', studio: 'op1' }, hubOrigin);
    return () => window.removeEventListener('message', onWorkspace);
  }, []);
}
