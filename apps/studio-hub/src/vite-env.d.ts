interface ImportMetaEnv {
  readonly VITE_OP1_URL?: string;
  readonly VITE_EP133_URL?: string;
  readonly VITE_HUB_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css";
