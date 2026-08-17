import { useEffect } from 'react';
import { hydrateStudioStore, normalizeHubProfile } from '@studio-hub/shared-stores';
import { createHubCacheEnvelope, HUB_CACHE_KEYS, isHubNoteMessage, isHubPanicMessage, isHubTransportMessage, readHubCache } from '@studio-hub/midi-bridge';

function readImportedProfile(queryProfile: string | null) {
  if (queryProfile) return queryProfile;
  try {
    const cached = readHubCache<unknown>(sessionStorage.getItem('hub:playerProfile')) ?? readHubCache<unknown>(localStorage.getItem(HUB_CACHE_KEYS.profile));
    return cached === null ? null : JSON.stringify(cached);
  } catch {
    return null;
  }
}

function cacheImportedProfile(profile: unknown) {
  try {
    sessionStorage.setItem('hub:playerProfile', JSON.stringify(createHubCacheEnvelope(profile)));
    localStorage.setItem(HUB_CACHE_KEYS.profile, JSON.stringify(createHubCacheEnvelope(profile)));
  } catch {
    // Le cache est un confort : la session continue avec le profil reçu.
  }
}

function hydrateCanonicalProfile(profile: unknown) {
  const snapshot = normalizeHubProfile(profile);
  if (snapshot) hydrateStudioStore(snapshot);
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
        hydrateCanonicalProfile(hubProfile);
        console.log('✅ OP-1: Received profile from Hub:', hubProfile.name);

        if (queryProfile) {
          params.delete('hubProfile');
          const cleanQuery = params.toString();
          window.history.replaceState({}, '', `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash}`);
        }

      } catch (error) {
        console.error('❌ OP-1: Failed to parse Hub profile:', error);
      }
    } else {
      console.warn('⚠️ OP-1: No profile from Hub');
    }

    const onWorkspace = (event: MessageEvent<{ type?: string; workspaceHandle?: FileSystemDirectoryHandle | null; profile?: unknown }>) => {
      if (event.data?.type !== 'hub:workspace') return;
      const expectedSource = window.opener || (window.parent !== window ? window.parent : null);
      if (event.origin !== hubOrigin || (expectedSource && event.source !== expectedSource)) return;
      if (event.data.profile) {
        cacheImportedProfile(event.data.profile);
        hydrateCanonicalProfile(event.data.profile);
      }
      window.dispatchEvent(new CustomEvent('hub:workspaceLoaded', { detail: event.data.workspaceHandle ?? null }));
    };
    const onTransport = (event: MessageEvent<unknown>) => {
      const expectedSource = window.opener || (window.parent !== window ? window.parent : null);
      if (event.origin !== hubOrigin || (expectedSource && event.source !== expectedSource) || !isHubTransportMessage(event.data)) return;
      window.dispatchEvent(new CustomEvent('hub:transport', { detail: event.data }));
    };
    const onMidiControl = (event: MessageEvent<unknown>) => {
      const expectedSource = window.opener || (window.parent !== window ? window.parent : null);
      if (event.origin !== hubOrigin || (expectedSource && event.source !== expectedSource)) return;
      if (isHubNoteMessage(event.data)) window.dispatchEvent(new CustomEvent('hub:midi-note', { detail: event.data }));
      if (isHubPanicMessage(event.data)) window.dispatchEvent(new CustomEvent('hub:midi-panic', { detail: event.data }));
    };
    window.addEventListener('message', onWorkspace);
    window.addEventListener('message', onTransport);
    window.addEventListener('message', onMidiControl);
    const hubWindow = window.opener || (window.parent !== window ? window.parent : null);
    hubWindow?.postMessage({ type: 'studio:ready', studio: 'op1' }, hubOrigin);
    return () => {
      window.removeEventListener('message', onWorkspace);
      window.removeEventListener('message', onTransport);
      window.removeEventListener('message', onMidiControl);
    };
  }, []);
}
