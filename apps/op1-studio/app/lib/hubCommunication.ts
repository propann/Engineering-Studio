/** Canal OP-1 Studio → Studio Hub. Les compteurs restent locaux au navigateur. */

export type HubStats = { projectsSaved?: number; samplesPrepared?: number };

type HubEvent = {
  schema: "studio-hub.event.v1";
  type: "session_update";
  timestamp: string;
  machine: "op1";
  data: HubStats;
};

function resolveHubOrigin() {
  if (typeof window === "undefined") return "";
  const fromLaunch = new URLSearchParams(window.location.search).get("hubReturn");
  try { return new URL(fromLaunch || window.location.origin).origin; }
  catch { return window.location.origin; }
}

const HUB_ORIGIN = resolveHubOrigin();

function counter(key: string, increment = false) {
  try {
    const current = Number(localStorage.getItem(key) || 0);
    const next = increment ? current + 1 : current;
    if (increment) localStorage.setItem(key, String(next));
    return Number.isFinite(next) && next >= 0 ? Math.floor(next) : 0;
  } catch { return 0; }
}

class Op1HubCommunication {
  private readonly connected = typeof window !== "undefined" && (window.parent !== window || Boolean(window.opener));

  updateStats(stats: HubStats) {
    if (!this.connected) return;
    const target = window.opener || window.parent;
    const event: HubEvent = { schema: "studio-hub.event.v1", type: "session_update", timestamp: new Date().toISOString(), machine: "op1", data: stats };
    target.postMessage({ source: "op1-studio", event }, HUB_ORIGIN);
  }
}

export const hubCommunication = new Op1HubCommunication();
export const OP1_PROJECTS_SAVED_KEY = "studio-hub:op1-projects-saved";
export const OP1_SAMPLES_PREPARED_KEY = "studio-hub:op1-samples-prepared";
export const incrementHubCounter = (key: string) => counter(key, true);
