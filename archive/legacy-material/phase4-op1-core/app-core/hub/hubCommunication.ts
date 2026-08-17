/**
 * OP-1 ↔ Hub Communication Channel
 */

type HubEventType = 'backup_created' | 'keyboard_saved' | 'session_update' | 'error';

interface HubEvent {
  type: HubEventType;
  timestamp: string;
  machine: 'op1';
  data?: unknown;
}

type HubImportMeta = ImportMeta & {
  env?: { DEV?: boolean; VITE_HUB_ORIGIN?: string };
};

function resolveHubOrigin() {
  const env = (import.meta as HubImportMeta).env;
  if (env?.VITE_HUB_ORIGIN) return env.VITE_HUB_ORIGIN;
  if (typeof window === 'undefined') return '';
  return env?.DEV
    ? `${window.location.protocol}//${window.location.hostname}:5179`
    : window.location.origin;
}

const HUB_ORIGIN = resolveHubOrigin();

function hubWindow(): Window | null {
  if (typeof window === 'undefined') return null;
  if (window.opener) return window.opener;
  return window.parent !== window ? window.parent : null;
}

class Op1HubCommunication {
  private isConnected: boolean = false;

  constructor() {
    this.detectHub();
  }

  private detectHub() {
    if (window.parent !== window || window.opener) {
      this.isConnected = true;
      console.log('✅ OP-1: Connected to Hub');
    } else {
      console.log('ℹ️ OP-1: Running standalone (not from Hub)');
    }
  }

  sendEvent(event: HubEvent) {
    const target = hubWindow();
    if (this.isConnected && target && HUB_ORIGIN) {
      target.postMessage(
        { source: 'op1-studio', event },
        HUB_ORIGIN
      );
      console.log('📤 OP-1 → Hub:', event.type);
    }
  }

  notifyBackupCreated(backupInfo: { timestamp: string; size: number }) {
    this.sendEvent({
      type: 'backup_created',
      timestamp: new Date().toISOString(),
      machine: 'op1',
      data: backupInfo,
    });
  }

  notifyKeyboardSaved() {
    this.sendEvent({
      type: 'keyboard_saved',
      timestamp: new Date().toISOString(),
      machine: 'op1',
    });
  }

  updateStats(stats: { backups?: number; keyboards?: number }) {
    this.sendEvent({
      type: 'session_update',
      timestamp: new Date().toISOString(),
      machine: 'op1',
      data: stats,
    });
  }
}

export const hubCommunication = new Op1HubCommunication();
