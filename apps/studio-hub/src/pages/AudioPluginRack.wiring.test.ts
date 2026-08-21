import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Test structurel du cablage du rack.
 *
 * Il lit le source plutot que d'executer du code, ce qui est inhabituel mais
 * justifie ici par ce qui s'est deja produit : le fichier a ete pousse une
 * fois tronque, ampute de 478 lignes, avec les six briques DSP disparues et
 * les 33 parametres redevenus inertes. Rien ne l'avait signale — le typecheck
 * passait, le build aussi, et l'application se lancait sans erreur.
 *
 * L'invariant verifie ici est simple : tout parametre qui a un curseur dans
 * l'interface doit etre lu par le moteur audio. Sinon le curseur bouge, le
 * toast s'affiche, la note joue — et le son ne change pas. C'est exactement
 * l'etat dans lequel 39 % des controles se trouvaient.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = readFileSync(path.join(DIR, "AudioPluginRack.tsx"), "utf-8");

/** Corps de playPluginNote : la fonction qui fabrique reellement le son. */
function moteurAudio(): string {
  const debut = SOURCE.indexOf("const playPluginNote");
  const fin = SOURCE.indexOf("// WEB MIDI & PC KEYBOARD");
  expect(debut, "playPluginNote introuvable").toBeGreaterThan(-1);
  expect(fin, "fin du moteur introuvable").toBeGreaterThan(debut);
  return SOURCE.slice(debut, fin);
}

/**
 * Meme corps, prive des appels a showToast.
 *
 * Necessaire : les toasts affichent la valeur des parametres, si bien qu'un
 * parametre devenu inerte pour le son continue d'y apparaitre. La premiere
 * version de ce test s'y laissait prendre — remplacer p.plBitcrush par une
 * constante dans le traitement ne la faisait pas broncher, puisque le toast
 * la mentionnait encore.
 */
function moteurSansAffichage(): string {
  return moteurAudio().replace(/showToast\([\s\S]*?\);/g, "");
}

/** Parametres declares en useState, hors etat purement visuel. */
function parametres(): string[] {
  const HORS_SUJET = new Set([
    "activeEngine",
    "selectedPatchId",
    "midiConnected",
    "midiDeviceName",
    "midiStatus",
    "lastMidi",
    "lastNote",
    "audioState",
    "activeKeyNote",
    "userPatches",
    "newPatchName",
    "showSaveModal",
    "toastMessage",
    // Filtre de la liste de patches : etat d'interface, sans effet sur le son
    // par construction. Son propre cablage est verrouille ailleurs, par
    // modules/audio-rack-01-patch-search/PatchSearchWiring.test.ts.
    "patchQuery",
  ]);
  return [...SOURCE.matchAll(/const \[(\w+), set\w+\] = useState/g)]
    .map((m) => m[1])
    .filter((n) => !HORS_SUJET.has(n));
}

describe("integrite du fichier", () => {
  it("ne contient pas de sortie d'outil collee dans le source", () => {
    // Le fichier a deja ete pousse avec « Warning: truncated output » en
    // premiere ligne. Ce n'est pas du TypeScript : le build cassait.
    expect(SOURCE).not.toMatch(/truncated output|Total output lines/);
  });

  it("commence par un import", () => {
    const premiere = SOURCE.split("\n").find((l) => l.trim().length > 0) ?? "";
    expect(premiere.trimStart()).toMatch(/^(import|\/\/|\/\*|"use client")/);
  });

  it("declare toujours les quinze moteurs", () => {
    const moteurs = [
      "mi_plaits", "mi_braids", "mi_rings", "mi_clouds", "mi_elements",
      "dexed_fm", "surge_xt", "zynaddsubfx", "helm", "fluidsynth",
      "amsynth", "amy_engine", "pl_synth", "open303", "faust_dsp",
    ];
    const corps = moteurAudio();
    for (const m of moteurs) {
      expect(corps, `moteur ${m} absent du moteur audio`).toContain(`"${m}"`);
    }
  });
});

describe("cablage des parametres", () => {
  it("lit chaque parametre declare dans le moteur audio", () => {
    // L'invariant central. Un parametre absent d'ici est un curseur qui ne
    // produit aucun son.
    const corps = moteurSansAffichage();
    const inertes = parametres().filter((p) => !corps.includes(`p.${p}`));
    expect(inertes, `parametres sans effet sur le son : ${inertes.join(", ")}`).toEqual([]);
  });

  it("en declare autant qu'attendu", () => {
    // Filet contre une troncature silencieuse : le fichier ampute n'en avait
    // plus que 50 sur 83.
    expect(parametres().length).toBeGreaterThanOrEqual(83);
  });
});

describe("briques DSP", () => {
  it("importe les six briques partagees", () => {
    // Elles ont disparu une fois avec la troncature. Leur absence rend
    // muets bitcrush, repliement, reverberation, LFO et boucles de retour.
    for (const b of [
      "buildBitcrushCurve",
      "buildSaturationCurve",
      "buildPulseWave",
      "buildImpulseResponse",
      "attachLfo",
      "buildFeedbackLoop",
    ]) {
      expect(SOURCE, `brique ${b} non importee`).toContain(b);
    }
  });

  it("branche la reverberation partagee sur plusieurs moteurs", () => {
    // Un seul convolveur sert fluidReverb, zynReverbSend, helmReverb et
    // cloudsReverb : moins de trois envois signale une regression.
    const envois = [...moteurAudio().matchAll(/sendToReverb\(/g)].length;
    expect(envois).toBeGreaterThanOrEqual(3);
  });
});

describe("garde-fous du moteur", () => {
  it("distingue la fin des sources de la fin du son percu", () => {
    // Caler l'enveloppe sur le dernier arret de source etranglait Rings a
    // 20 ms : sa source est une impulsion, tout le son vient de la boucle.
    const corps = moteurAudio();
    expect(corps).toContain("audibleEnd");
    expect(corps).toContain("holdUntil");
  });

  it("passe par une enveloppe plutot qu'un gain constant", () => {
    // Un gain pose en constante puis coupe net produit un clic a chaque note.
    expect(moteurAudio()).toMatch(/exponentialRampToValueAtTime/);
  });

  it("n'utilise aucun cast qui desarme le typage", () => {
    // « as unknown as AudioNode » avait masque une interop impossible : le
    // moteur levait a chaque note, l'erreur partait dans un log, silence
    // total sans que rien ne le signale.
    expect(SOURCE).not.toContain("as unknown as");
  });
});
