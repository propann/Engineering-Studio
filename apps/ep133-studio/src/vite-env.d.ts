/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL?: string;
  readonly VITE_HUB_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

