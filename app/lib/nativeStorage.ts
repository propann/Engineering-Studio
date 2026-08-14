import type { LocalBridgeAction } from "./localBridge";

type TauriInternals = {
  invoke: <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
};

export type NativeLocalPlan = {
  schema: "op1-studio-local-bridge";
  version: 1;
  action: LocalBridgeAction;
  machineWrite: false;
  requiresConfirmation: true;
  payload: Record<string, unknown>;
};

export type NativeDisplayFile = {
  file: string;
  contents: string;
};

function getTauriInternals(): TauriInternals | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as Window & { __TAURI_INTERNALS__?: TauriInternals }).__TAURI_INTERNALS__;
  return candidate?.invoke ? candidate : null;
}

export function hasNativeStorage() {
  return getTauriInternals() !== null;
}

export function readNativeKeyboard() {
  const tauri = getTauriInternals();
  return tauri ? tauri.invoke<string | null>("keyboard_read") : null;
}

export function writeNativeKeyboard(contents: string) {
  const tauri = getTauriInternals();
  return tauri ? tauri.invoke<void>("keyboard_write", { contents }) : null;
}

export function prepareNativeLocalPlan(action: LocalBridgeAction, payload: Record<string, string | number | boolean> = {}) {
  const tauri = getTauriInternals();
  return tauri ? tauri.invoke<NativeLocalPlan>("prepare_local_plan", { action, payload }) : null;
}

export function readNativeProfile(root: string) {
  const tauri = getTauriInternals();
  return tauri ? tauri.invoke<string>("profile_read", { root }) : null;
}

export function writeNativeProfile(root: string, contents: string) {
  const tauri = getTauriInternals();
  return tauri ? tauri.invoke<void>("profile_write", { root, contents, confirm: true }) : null;
}

export function initialiseNativeLibrary(root: string) {
  const tauri = getTauriInternals();
  return tauri ? tauri.invoke<void>("library_initialise", { root }) : null;
}

export function readNativeDisplayLibrary(root: string) {
  const tauri = getTauriInternals();
  return tauri ? tauri.invoke<NativeDisplayFile[]>("display_library_read", { root }) : null;
}

export async function readDisplayLibrary(root: string) {
  const native = readNativeDisplayLibrary(root);
  if (native) return native;
  try {
    const response = await fetch(`/api/display-library?root=${encodeURIComponent(root)}`);
    if (!response.ok) return [];
    return await response.json() as NativeDisplayFile[];
  } catch {
    return [];
  }
}
