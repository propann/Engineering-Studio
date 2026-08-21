import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Serveur de dev en HTTP.
//
// http://localhost est un contexte securise par exception du navigateur : le
// selecteur de dossier (showDirectoryPicker) et Web MIDI y fonctionnent tous
// les deux, sans certificat.
//
// Ne pas reintroduire de HTTPS auto-signe : Chrome accorde bien
// isSecureContext sur une origine dont le certificat est en erreur, mais il
// y BLOQUE les fonctionnalites puissantes. Web MIDI cesse alors de voir le
// moindre appareil, sans message d'erreur. Detaille dans
// docs/FOLDER_PICKER.md.
//
// Consequence assumee : depuis un autre appareil du reseau (via l'IP LAN),
// ces deux API restent indisponibles.

export default defineConfig({
  root: "apps/studio-hub",
  plugins: [react()],
  resolve: {
    alias: {
      "@studio-hub/midi-bridge": path.resolve(__dirname, "packages/midi-bridge/index.ts"),
      "@studio-hub/audio-bridge": path.resolve(__dirname, "packages/audio-bridge/index.ts"),
      "@studio-hub/fs-handles": path.resolve(__dirname, "packages/fs-handles/index.ts"),
      "@studio-hub/audio-formats": path.resolve(__dirname, "packages/audio-formats/index.ts"),
      "@studio-hub/midi-dispatch": path.resolve(__dirname, "packages/midi-dispatch/index.ts"),
      "@studio-hub/musique": path.resolve(__dirname, "packages/musique/index.ts"),
      "@studio-hub/core": path.resolve(__dirname, "apps/studio-hub/src/core"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: ["engineering-studio.duckdns.org"],
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
});
