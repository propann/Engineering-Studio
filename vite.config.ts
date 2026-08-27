import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

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
  // 1. Les variables d'environnement. Coolify et Nixpacks en posent une ;
  //    laquelle depend de la version, d'ou la liste.
  for (const cle of [
    "SOURCE_COMMIT",
    "COOLIFY_GIT_COMMIT_SHA",
    "COOLIFY_GIT_COMMIT",
    "GIT_COMMIT_SHA",
    "GIT_COMMIT",
    "COMMIT_SHA",
    "GITHUB_SHA",
    "VITE_BUILD_COMMIT",
  ]) {
    const v = process.env[cle];
    if (v && v.trim()) return v.trim().slice(0, 40);
  }

  // 2. La commande git, quand le binaire est la.
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    // Rien : on tente encore de lire le depot a la main.
  }

  // 3. Le depot lu directement. Une image de construction contient souvent le
  //    dossier `.git` sans le binaire `git` — c'est le cas le plus frequent en
  //    construction distante, et il ne coute qu'une lecture de fichier.
  try {
    const tete = readFileSync(path.join(import.meta.dirname, ".git", "HEAD"), "utf-8").trim();
    const ref = /^ref:\s*(.+)$/.exec(tete);
    if (!ref) return tete.slice(0, 40);
    const chemin = path.join(import.meta.dirname, ".git", ref[1]);
    if (existsSync(chemin)) return readFileSync(chemin, "utf-8").trim().slice(0, 40);
    // Reference empaquetee : `.git/refs/` est vide apres un `git gc`.
    const empaquete = readFileSync(path.join(import.meta.dirname, ".git", "packed-refs"), "utf-8");
    const trouve = new RegExp("^([0-9a-f]{40}) " + ref[1] + "$", "m").exec(empaquete);
    if (trouve) return trouve[1];
  } catch {
    // Ni depot ni variable : la construction n'est pas identifiable.
  }

  // Mentir avec un faux SHA serait pire que l'admettre : un marqueur credible
  // mais faux enverrait chercher un probleme de deploiement la ou il n'y en a
  // pas, ou pire, ferait croire a jour une production qui ne l'est pas.
  return "inconnu";
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
      "@studio-hub/rack-bus": path.resolve(import.meta.dirname, "packages/rack-bus/index.ts"),
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
