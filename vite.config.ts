import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { execSync } from "node:child_process";

/**
 * Le commit reellement construit, pose dans le HTML.
 *
 * Sans lui, verifier ce que sert la production demandait de comparer des
 * empreintes de feuilles CSS a la main. Le 2026-08-26, le Hub public a servi
 * pendant des heures un build anterieur a cinq commits, CI verte, sans que
 * rien ne le signale : Coolify surveille le depot lui-meme et le workflow ne
 * declenche aucun deploiement. Personne ne pouvait le voir.
 *
 * L'ordre des sources compte. En construction distante il n'y a pas toujours
 * de `.git` : Coolify et Nixpacks exposent le commit par variable
 * d'environnement, et c'est elle qui fait foi quand elle existe.
 */
function commitConstruit(): string {
  const env =
    process.env.SOURCE_COMMIT ??
    process.env.COOLIFY_GIT_COMMIT_SHA ??
    process.env.GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA;
  if (env && env.trim()) return env.trim().slice(0, 40);
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    // Une construction hors depot n'est pas une erreur : elle est seulement
    // non identifiable. Mentir avec un faux SHA serait pire que l'admettre.
    return "inconnu";
  }
}

/** Ecrit le commit et la date dans <head>, lisibles sans executer de script. */
function marqueurDeBuild(): Plugin {
  return {
    name: "marqueur-de-build",
    transformIndexHtml() {
      return [
        { tag: "meta", attrs: { name: "build-commit", content: commitConstruit() }, injectTo: "head" },
        { tag: "meta", attrs: { name: "build-date", content: new Date().toISOString() }, injectTo: "head" },
      ];
    },
  };
}

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
  plugins: [react(), marqueurDeBuild()],
  resolve: {
    alias: {
      "@studio-hub/midi-bridge": path.resolve(import.meta.dirname, "packages/midi-bridge/index.ts"),
      "@studio-hub/audio-bridge": path.resolve(import.meta.dirname, "packages/audio-bridge/index.ts"),
      "@studio-hub/fs-handles": path.resolve(import.meta.dirname, "packages/fs-handles/index.ts"),
      "@studio-hub/audio-formats": path.resolve(import.meta.dirname, "packages/audio-formats/index.ts"),
      "@studio-hub/midi-dispatch": path.resolve(import.meta.dirname, "packages/midi-dispatch/index.ts"),
      "@studio-hub/musique": path.resolve(import.meta.dirname, "packages/musique/index.ts"),
      "@studio-hub/core": path.resolve(import.meta.dirname, "apps/studio-hub/src/core"),
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
