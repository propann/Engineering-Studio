export {};

declare global {
  interface ImportMetaEnv {
    readonly DEV: boolean;
    readonly VITE_HUB_ORIGIN?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
