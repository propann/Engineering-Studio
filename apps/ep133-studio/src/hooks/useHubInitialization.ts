import { useEffect } from 'react';

const IMPORTED_PROFILE_KEY = 'studio-hub:imported-profile';
const IMPORTED_MACHINE_KEY = 'studio-hub:imported-machine';

function resolveHubOrigin() {
  const params = new URLSearchParams(window.location.search);
  const configured = import.meta.env.VITE_HUB_ORIGIN as string | undefined;
  try {
    return new URL(params.get('hubReturn') || configured || window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

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

function readImportedMachine() {
  const params = new URLSearchParams(window.location.search);
  const capacity = params.get('hubMachineCapacityMb') === '128' ? 128 : 64;
  const name = params.get('hubMachineName');
  try {
    const cached = localStorage.getItem(IMPORTED_MACHINE_KEY);
    return name ? { name, capacityMb: capacity as 64 | 128 } : cached ? JSON.parse(cached) as { name?: string; capacityMb?: 64 | 128 } : { name: 'EP-133 K.O. II', capacityMb: 64 as const };
  } catch {
    return { name: name || 'EP-133 K.O. II', capacityMb: capacity as 64 | 128 };
  }
}

function cacheImportedMachine(machine: { name?: string; capacityMb?: 64 | 128 }) {
  const normalized = { name: machine.name || 'EP-133 K.O. II', capacityMb: machine.capacityMb === 128 ? 128 : 64 } as const;
  try { localStorage.setItem(IMPORTED_MACHINE_KEY, JSON.stringify(normalized)); } catch { /* cache de confort */ }
  window.dispatchEvent(new CustomEvent('hub:machineLoaded', { detail: normalized }));
}

export function useHubInitialization() {
  useEffect(() => {
    // Le Hub et le studio ont des origines différentes en développement.
    // Le profil est transmis par le Hub dans l'URL du lancement. Il est mis en
    // cache en lecture seule pour survivre à un rafraîchissement de l'outil.
    const params = new URLSearchParams(window.location.search);
    const hubOrigin = resolveHubOrigin();
    const queryProfile = params.get('hubProfile');
    const hubProfileJson = readImportedProfile(queryProfile);
    cacheImportedMachine(readImportedMachine());

    if (hubProfileJson) {
      try {
        const hubProfile = JSON.parse(hubProfileJson);
        cacheImportedProfile(hubProfile);
        console.log('✅ EP-133: Received profile from Hub:', hubProfile.name);

        if (queryProfile) {
          params.delete('hubProfile');
          const cleanQuery = params.toString();
          window.history.replaceState({}, '', `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash}`);
        }

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
      console.warn('⚠️ EP-133: No profile from Hub');
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
    window.addEventListener('message', onWorkspace);
    const hubWindow = window.opener || (window.parent !== window ? window.parent : null);
    hubWindow?.postMessage({ type: 'studio:ready', studio: 'ep133' }, hubOrigin);
    return () => window.removeEventListener('message', onWorkspace);
  }, []);
}
