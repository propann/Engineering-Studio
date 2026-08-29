import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Un seul contexte audio pour tout le Hub.
 *
 * ## Le defaut que ce test empeche
 *
 * `packages/rack-bus` a ete ecrit pour supprimer les `AudioContext` prives.
 * Son en-tete nomme les trois coupables de l'epoque — `AudioPluginRack:650`,
 * `SoundEditorHub:374`, `SoundPatchCreator:55` — chacun fabriquant son propre
 * contexte dans un `useRef`.
 *
 * Le paquet a ete ecrit, et personne n'a migre. Six mois plus tard, cinq
 * composants du Hub ouvraient encore leur contexte prive :
 *
 * - Les vingt moteurs et le rack Strudel vivaient sur DEUX graphes separes.
 *   Ils ne pouvaient pas etre melanges, et l'oscilloscope du fond de panier
 *   ne voyait aucun moteur.
 * - `ServerTelemetryRack` en fabriquait un jetable a seule fin de lire son
 *   `sampleRate`, puis le fermait — deux fois, le mode strict de React
 *   rejouant l'effet.
 * - Trois outils n'en fermaient AUCUN. Chaque visite en fuyait un, et Chrome
 *   en plafonne six par document. Au septieme, plus aucun son nulle part, et
 *   aucune erreur pour le dire.
 *
 * ## Pourquoi un test de source
 *
 * Le symptome est un silence, apres un nombre de visites qui depend du
 * parcours. Il ne se reproduit pas a la demande, ne leve rien, et le
 * typecheck comme le build passent. Seule la lecture du source l'attrape
 * avant qu'il n'existe.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(DIR, "..", "..");

/** Tous les .ts/.tsx du Hub, hors tests. */
function sources(dossier = SRC, vus: string[] = []): string[] {
  for (const entree of readdirSync(dossier)) {
    const complet = path.join(dossier, entree);
    if (statSync(complet).isDirectory()) {
      if (entree === "node_modules") continue;
      sources(complet, vus);
    } else if (/\.tsx?$/.test(entree) && !/\.(test|spec)\.tsx?$/.test(entree)) {
      vus.push(complet);
    }
  }
  return vus;
}

const FICHIERS = sources().map((f) => ({
  chemin: path.relative(SRC, f),
  // Les commentaires racontent l'ancien defaut : les lire ferait echouer le
  // test sur sa propre documentation. Meme parade que dans StrudelRack.test.
  code: readFileSync(f, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, ""),
}));

describe("aucun composant ne fabrique son propre contexte audio", () => {
  it("personne n'appelle `new AudioContext`", () => {
    /**
     * `contexte()` de `@studio-hub/rack-bus` est le seul point d'ouverture.
     * Il en garde un par document et ne le ferme jamais — c'est son contrat.
     *
     * Deux ecritures a couvrir. `SoundLibraryPanel` utilisait la seconde —
     * `new (window.AudioContext || …)()` — et passait donc au travers d'une
     * premiere version de cette garde qui ne cherchait que la premiere.
     */
    const fautifs = FICHIERS.filter(
      (f) =>
        /new\s+(?:AudioContext|AudioCtx|AudioContextClass|Ctor)\s*\(/.test(f.code) ||
        /new\s*\([^)]*AudioContext[^)]*\)\s*\(/.test(f.code),
    ).map((f) => f.chemin);
    expect(
      fautifs,
      `contexte audio prive dans : ${fautifs.join(", ")} — utiliser contexte() de @studio-hub/rack-bus`,
    ).toEqual([]);
  });

  it("personne ne ferme le contexte partage", () => {
    // Le fermer rendrait muet tout ce qui joue ailleurs dans le Hub.
    const fautifs = FICHIERS.filter((f) => /\bctx\.close\(\)/.test(f.code)).map((f) => f.chemin);
    expect(fautifs, `ferme le contexte partage : ${fautifs.join(", ")}`).toEqual([]);
  });

  it("personne ne sort en direct sur la destination du contexte vivant", () => {
    /**
     * Sortir sur `ctx.destination` court-circuite la console : le volume ne
     * repond plus, le signal n'atteint ni la reverberation partagee ni
     * l'analyseur du bus maitre.
     *
     * `offline.destination` reste permis : c'est celle d'un contexte jetable,
     * cree pour un rendu, qui n'a pas de console.
     */
    const fautifs: string[] = [];
    for (const f of FICHIERS) {
      const cibles = [...f.code.matchAll(/\.connect\(\s*(\w+)\.destination\s*\)/g)].map((m) => m[1]);
      if (cibles.some((c) => !/^offline$|^sonde$/.test(c))) fautifs.push(f.chemin);
    }
    expect(
      fautifs,
      `sortie directe vers la destination : ${fautifs.join(", ")} — passer par brancher()`,
    ).toEqual([]);
  });

  it("tout ce qui produit du son ouvre une voie de console", () => {
    /**
     * Un composant qui cree des oscillateurs et appelle `contexte()` doit
     * aussi appeler `brancher()` : sans voie, son signal n'a nulle part ou
     * aller, et il finirait par se rebrancher sur la destination.
     *
     * Le rack Strudel est l'exception assumee : il ne cree pas d'oscillateur
     * lui-meme, c'est `@strudel/web` qui le fait, et le rack detourne la
     * sortie de superdough vers sa prise.
     */
    const fautifs = FICHIERS.filter(
      (f) =>
        /\bcontexte\(\)/.test(f.code) &&
        /createOscillator\(/.test(f.code) &&
        !/\bbrancher\(/.test(f.code),
    ).map((f) => f.chemin);
    expect(
      fautifs,
      `produit du son sans voie de console : ${fautifs.join(", ")}`,
    ).toEqual([]);
  });

  it("qui ouvre une voie la rend au demontage", () => {
    // Une voie laissee derriere ajoute une tranche fantome a la console a
    // chaque visite, et garde le graphe audio vivant.
    const fautifs = FICHIERS.filter(
      (f) => /\bbrancher\(/.test(f.code) && !/detacher\(\)/.test(f.code),
    ).map((f) => f.chemin);
    expect(fautifs, `voie jamais rendue : ${fautifs.join(", ")}`).toEqual([]);
  });
});
