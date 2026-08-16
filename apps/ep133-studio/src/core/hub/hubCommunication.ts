/**
 * EP-133 ↔ Hub Communication Channel
 */

type HubEventType = 'pattern_created' | 'training_progress' | 'session_update' | 'error';

interface HubEvent {
  type: HubEventType;
  timestamp: string;
  machine: 'ep133';
  data?: unknown;
}

function resolveHubOrigin() {
  const configured = import.meta.env.VITE_HUB_ORIGIN as string | undefined;
  const fromLaunch = new URLSearchParams(window.location.search).get('hubReturn');
  try {
    return new URL(fromLaunch || configured || window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

const HUB_ORIGIN = resolveHubOrigin();

class Ep133HubCommunication {
  private isConnected: boolean = false;

  constructor() {
    this.detectHub();
  }

  private detectHub() {
    if (window.parent !== window || window.opener) {
      this.isConnected = true;
      console.log('✅ EP-133: Connected to Hub');
    } else {
      console.log('ℹ️ EP-133: Running standalone (not from Hub)');
    }
  }

  sendEvent(event: HubEvent) {
    if (this.isConnected) {
      const target = window.opener || window.parent;
      target.postMessage(
        { source: 'ep133-studio', event },
        HUB_ORIGIN
      );
      console.log('📤 EP-133 → Hub:', event.type);
    }
  }

  notifyPatternCreated(count: number) {
    this.sendEvent({
      type: 'pattern_created',
      timestamp: new Date().toISOString(),
      machine: 'ep133',
      data: { count },
    });
  }

  notifyTrainingProgress(progress: number) {
    this.sendEvent({
      type: 'training_progress',
      timestamp: new Date().toISOString(),
      machine: 'ep133',
      data: { progress },
    });
  }

  updateStats(stats: { patternsEdited?: number; trainingProgress?: number }) {
    this.sendEvent({
      type: 'session_update',
      timestamp: new Date().toISOString(),
      machine: 'ep133',
      data: stats,
    });
  }
}

export const hubCommunication = new Ep133HubCommunication();
