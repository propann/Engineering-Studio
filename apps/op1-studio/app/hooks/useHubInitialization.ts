import { useEffect } from 'react';
import { createHubCacheEnvelope, HUB_CACHE_KEYS, isHubNoteMessage, isHubPanicMessage, isHubTransportMessage, readHubCache } from '@studio-hub/midi-bridge';
import { createLogger } from '@studio-hub/audio-bridge';

const log = createLogger('OP-1.HubInit');

function readImportedProfile(queryProfile: string | null) {
  if (queryProfile) return queryProfile;
  if (typeof window === 'undefined') return null;

  try {
    // 1. Essai session storage hub:playerProfile
    const fromSession = sessionStorage.getItem('hub:playerProfile');
    if (fromSession) {
      const parsed = readHubCache<unknown>(fromSession);
      if (parsed) return JSON.stringify(parsed);
    }

    // 2. Essai stockage standard Studio Hub
    const fromStudioHub = localStorage.getItem('studio-hub-profile');
    if (fromStudioHub) {
      const parsed = readHubCache<unknown>(fromStudioHub);
      if (parsed) return JSON.stringify(parsed);
    }

    // 3. Essai clé cache Hub
    const fromHubCache = localStorage.getItem(HUB_CACHE_KEYS.profile);
    if (fromHubCache) {
      const parsed = readHubCache<unknown>(fromHubCache);
      if (parsed) return JSON.stringify(parsed);
    }

    // 4. Essai profil opérateur OP-1 unifié
    const fromOp1 = localStorage.getItem('op1_character_profile_unified_v3') || localStorage.getItem('op1_character_profile_v2');
    if (fromOp1) {
      const parsed = JSON.parse(fromOp1);
      if (parsed && (parsed.operatorName || parsed.name)) {
        const synthesized = {
          version: 2,
          name: parsed.operatorName || parsed.name || 'Opérateur OP-1',
          avatar: parsed.operatorAvatar || parsed.avatar || 'robot',
          bio: 'Opérateur Studio & Machine OP-1',
        };
        return JSON.stringify(synthesized);
      }
    }

    // 5. Initialisation automatique d'un profil Studio par défaut
    const defaultProfile = {
      version: 2,
      name: 'Opérateur Studio',
      avatar: 'robot',
      bio: 'Opérateur Studio & Machine',
    };
    return JSON.stringify(defaultProfile);
  } catch {
    return JSON.stringify({
      version: 2,
      name: 'Opérateur Studio',
      avatar: 'robot',
      bio: 'Opérateur Studio & Machine',
    });
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

export function useHubInitialization() {
  useEffect(() => {
    // Le Hub et le studio ont des origines différentes en développement.
    // Le profil est transmis par le Hub dans l'URL du lancement. Il est mis en
    // cache en lecture seule pour survivre à un rafraîchissement de l'outil.
    const params = new URLSearchParams(window.location.search);
    const hubOrigin = (() => {
      try {
        return new URL(params.get('hubReturn') || window.location.origin).origin;
      } catch {
        return window.location.origin;
      }
    })();
    const queryProfile = params.get('hubProfile');
    const hubProfileJson = readImportedProfile(queryProfile);

    if (hubProfileJson) {
      try {
        const hubProfile = JSON.parse(hubProfileJson);
        cacheImportedProfile(hubProfile);
        log.info('Received profile from Hub', { name: hubProfile.name });

        if (queryProfile) {
          params.delete('hubProfile');
          const cleanQuery = params.toString();
          window.history.replaceState({}, '', `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash}`);
        }

        // Dispatch initialization events
        window.dispatchEvent(new CustomEvent('hub:profileLoaded', { detail: hubProfile }));

      } catch (error) {
        log.error('Failed to parse Hub profile', error);
      }
    } else {
      log.warn('No profile from Hub');
    }

    const onWorkspace = (event: MessageEvent<{ type?: string; workspaceHandle?: FileSystemDirectoryHandle | null; profile?: unknown }>) => {
      if (event.data?.type !== 'hub:workspace') return;
      const expectedSource = window.opener || (window.parent !== window ? window.parent : null);
      if (event.origin !== hubOrigin || (expectedSource && event.source !== expectedSource)) return;
      if (event.data.profile) {
        cacheImportedProfile(event.data.profile);
        window.dispatchEvent(new CustomEvent('hub:profileLoaded', { detail: event.data.profile }));
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
