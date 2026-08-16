/**
 * OP-1 ↔ Hub Communication Channel
 */

type HubEventType = 'backup_created' | 'keyboard_saved' | 'session_update' | 'error';

interface HubEvent {
  type: HubEventType;
  timestamp: string;
  machine: 'op1';
  data?: any;
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
    if (this.isConnected) {
      window.parent.postMessage(
        { source: 'op1-studio', event },
        '*'
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
