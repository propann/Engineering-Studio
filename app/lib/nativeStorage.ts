type TauriInternals = {
  invoke: <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
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
