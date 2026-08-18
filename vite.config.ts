import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: "apps/studio-hub",
  plugins: [react()],
  resolve: {
    alias: {
      "@studio-hub/midi-bridge": path.resolve(__dirname, "packages/midi-bridge/index.ts"),
      "@studio-hub/audio-bridge": path.resolve(__dirname, "packages/audio-bridge/index.ts"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
});
