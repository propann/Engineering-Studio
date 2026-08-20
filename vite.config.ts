import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import path from "node:path";

export default defineConfig({
  root: "apps/studio-hub",
  // basicSsl : certificat auto-signé pour servir en HTTPS.
  // Nécessaire car l'API File System Access (showDirectoryPicker) exige un
  // contexte sécurisé — sinon elle n'existe pas sur une IP LAN en http://.
  plugins: [react(), basicSsl()],
  resolve: {
    alias: {
      "@studio-hub/midi-bridge": path.resolve(__dirname, "packages/midi-bridge/index.ts"),
      "@studio-hub/audio-bridge": path.resolve(__dirname, "packages/audio-bridge/index.ts"),
      "@studio-hub/core": path.resolve(__dirname, "apps/studio-hub/src/core"),
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
