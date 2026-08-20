import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import path from "node:path";

// HTTPS désactivé par défaut.
//
// http://localhost est un contexte sécurisé par exception du navigateur : les
// API puissantes (showDirectoryPicker, Web MIDI) y fonctionnent sans aucun
// certificat. Le HTTPS auto-signé, lui, produit une origine « certificat en
// erreur » sur laquelle Chrome BLOQUE Web MIDI — les appareils n'apparaissent
// jamais, sans message d'erreur.
//
// N'activer HTTPS que pour accéder depuis un autre appareil du réseau, via
// l'IP LAN, où l'exception localhost ne s'applique pas :
//     VITE_HTTPS=1 npm run dev
// En contrepartie, Web MIDI sera indisponible dans ce mode.
const useHttps = process.env.VITE_HTTPS === "1";

export default defineConfig({
  root: "apps/studio-hub",
  plugins: useHttps ? [react(), basicSsl()] : [react()],
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
