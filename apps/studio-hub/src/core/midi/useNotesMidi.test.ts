import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseMidiNotePacket } from "@studio-hub/midi-bridge";
import { frequenceDeNote } from "@studio-hub/core/audio/rendu";

/**
 * « Il faut que le MIDI marche de partout proprement. »
 *
 * L'invariant : **toute surface du hub qui produit du son doit etre jouable
 * depuis la machine branchee**. Une page qui monte un AudioContext sans
 * ecouter le repartiteur est une page ou l'OP-1 en mode controleur ne fait
 * rien — et rien ne le signale, puisque la page fonctionne parfaitement a la
 * souris.
 *
 * Ce test parcourt le source plutot que d'enumerer une liste : une page ajoutee
 * demain est couverte sans qu'on y pense.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(DIR, "..", "..");

function fichiersTsx(racine: string): string[] {
  const sortie: string[] = [];
  for (const entree of readdirSync(racine)) {
    const complet = path.join(racine, entree);
    if (statSync(complet).isDirectory()) {
      if (entree === "node_modules") continue;
      sortie.push(...fichiersTsx(complet));
    } else if (entree.endsWith(".tsx") && !entree.includes(".test.")) {
      sortie.push(complet);
    }
  }
  return sortie;
}

/**
 * Surfaces exemptees, avec leur raison.
 *
 * Une exemption sans raison ecrite est une porte ouverte : la liste ci-dessous
 * est vide, et le jour ou elle ne l'est plus, la raison est a cote.
 */
const EXEMPTEES: Record<string, string> = {};

describe("toute surface sonore du hub est jouable depuis la machine", () => {
  const surfaces = fichiersTsx(SRC)
    .map((p) => ({ chemin: path.relative(SRC, p), source: readFileSync(p, "utf-8") }))
    .filter(({ source }) => /new AudioContext|webkitAudioContext|getAudioContext\(\)/.test(source));

  it("trouve bien des surfaces sonores — sinon le test ne prouve rien", () => {
    // Un parcours qui ne trouve rien passerait tous les tests suivants sans
    // rien verifier. C'est le defaut classique du test structurel.
    expect(surfaces.length).toBeGreaterThanOrEqual(3);
  });

  it("chacune ecoute le repartiteur MIDI", () => {
    /**
     * On cherche un APPEL, pas le nom.
     *
     * Un premier jet testait `source.includes("useNotesMidi")` : la ligne
     * d'import satisfaisait la condition, donc retirer l'appel laissait le
     * test vert sur une page devenue sourde. C'est exactement le defaut que
     * ce test existe pour attraper.
     */
    const ecoute = (source: string) =>
      source
        .split("\n")
        .filter((l) => !l.trimStart().startsWith("import "))
        .some((l) => /\buseNotesMidi\s*\(/.test(l) || /\bsAbonner\s*\(/.test(l));

    const sourdes = surfaces
      .filter(({ chemin }) => !(chemin in EXEMPTEES))
      .filter(({ source }) => !ecoute(source))
      .map(({ chemin }) => chemin);
    expect(
      sourdes,
      `ces surfaces produisent du son sans ecouter la machine : ${sourdes.join(", ")}`
    ).toEqual([]);
  });

  it("aucune n'ecrit onmidimessage en direct", () => {
    // C'est une propriete UNIQUE : l'ecrire couperait le MIDI de toutes les
    // autres surfaces, sans le moindre message d'erreur. Seul le repartiteur
    // y touche.
    for (const { chemin, source } of surfaces) {
      const ecritures = source
        .split("\n")
        .filter((l) => /\.onmidimessage\s*=/.test(l) && !l.trim().startsWith("//") && !l.trim().startsWith("*"));
      expect(ecritures, `${chemin} ecrit onmidimessage en direct`).toEqual([]);
    }
  });
});

describe("ce que le crochet decode", () => {
  it("reutilise parseMidiNotePacket au lieu d'un cinquieme decodage", () => {
    // La classification `status & 0xf0` trainait deja en quatre exemplaires
    // dans le depot. Le paquet la fait, et il est teste.
    const source = readFileSync(path.join(DIR, "useNotesMidi.ts"), "utf-8");
    expect(source).toContain("parseMidiNotePacket");
    // Le CODE, pas la prose : le commentaire du crochet nomme `0x90` pour
    // expliquer le note-off deguise. Un premier jet de ce test tombait sur
    // son propre commentaire — la troisieme fois ce soir.
    const code = source
      .split("\n")
      .filter((l) => {
        const t = l.trim();
        return t && !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
      })
      .join("\n");
    expect(code).not.toContain("0x90");
    expect(code).not.toContain("0xf0");
    expect(code).not.toContain("& 0x");
  });

  it("comprend le note-off deguise", () => {
    // Un 0x90 de velocite 0, que beaucoup de claviers envoient a la place
    // d'un vrai 0x80. Le rater laisse chaque note tenue indefiniment.
    expect(parseMidiNotePacket([0x90, 60, 0])?.action).toBe("note-off");
    expect(parseMidiNotePacket([0x80, 60, 64])?.action).toBe("note-off");
    expect(parseMidiNotePacket([0x90, 60, 100])?.action).toBe("note-on");
  });

  it("ignore ce qui n'est pas une note", () => {
    // Horloge, SysEx, controleur continu : l'OP-1 en envoie en permanence.
    // Les traiter comme des notes ferait jouer la page a chaque tic d'horloge.
    expect(parseMidiNotePacket([0xf8])).toBeNull();
    expect(parseMidiNotePacket([0xb0, 7, 100])).toBeNull();
    expect(parseMidiNotePacket([])).toBeNull();
  });

  it("rend la frequence temperee de la note", () => {
    // Le la du diapason, et l'octave au-dessus.
    expect(frequenceDeNote(69)).toBeCloseTo(440, 6);
    expect(frequenceDeNote(81)).toBeCloseTo(880, 6);
    expect(frequenceDeNote(60)).toBeCloseTo(261.6255653, 5);
  });

  it("lit ses rappels dans un releve, pas dans la portee capturee", () => {
    // Une fonction flechee ecrite dans le JSX change d'identite a chaque
    // rendu. En dependance d'effet, elle ferait se desabonner puis se
    // reabonner a chaque frappe.
    const source = readFileSync(path.join(DIR, "useNotesMidi.ts"), "utf-8");
    expect(source).toContain("rappels.current");
    expect(source).toMatch(/\}, \[actif\]\);/);
  });

  it("rend le desabonnement du repartiteur", () => {
    // Il ne retire QUE cet auditeur. Le nettoyage destructeur d'autrefois
    // coupait le MIDI de la page qui prenait la place.
    const source = readFileSync(path.join(DIR, "useNotesMidi.ts"), "utf-8");
    expect(source).toContain("return seDesabonner;");
  });
});
