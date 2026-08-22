import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MODULES } from "./ModulesLabo";

/**
 * Le Labo — la fusion des deux outils de creation de son.
 *
 * Le hub proposait « Rack Plugins & Moteurs Audio » et « Edition & Creation de
 * Son » comme deux outils distincts. Ils ne faisaient pourtant pas la meme
 * chose : le rack est un instrument LOGICIEL (15 moteurs, effets, echantillons),
 * le createur de patch vise les moteurs NATIFS de l'OP-1 et les pads EP-133.
 *
 * Fusionner en supprimant l'un aurait perdu la creation de patches pour la
 * machine. Le Labo garde les deux : les moteurs en haut, un emplacement de
 * module en bas.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(DIR, "..");
const lire = (p: string) => readFileSync(path.join(SRC, p), "utf-8");

const LABO = lire("pages/AudioPluginRack.tsx");
const MODULES_SRC = lire("racks/ModulesLabo.tsx");
const HUB = lire("pages/ToolsHub.tsx");

describe("le hub ne propose plus qu'un outil de creation de son", () => {
  it("la carte s'appelle le Labo", () => {
    expect(HUB).toContain("🧪 Labo — création de son");
    expect(HUB).toContain('code: "LABO-SON"');
  });

  it("la carte « Edition & Creation de Son » a disparu", () => {
    // Elle ouvrait `sound-patch-creator`, qui est maintenant un module du Labo.
    // La laisser aurait garde deux portes vers le meme travail.
    expect(HUB).not.toContain("sound-creator-card");
    expect(HUB).not.toContain("Édition & Création de Son");
  });

  it("la carte ne promet que ce que le Labo fait", () => {
    // Depuis la fusion des deux systemes du rack principal, la carte n'est
    // plus du JSX ecrit a la main : c'est une entree du tableau. On lit donc
    // l'entree, pas le balisage.
    const i = HUB.indexOf('id: "labo"');
    expect(i, "l'outil « labo » a disparu du tableau").toBeGreaterThan(-1);
    const entree = HUB.slice(i, HUB.indexOf("\n  },", i));
    expect(entree).toContain('page: "audio-plugin-rack"');
    for (const promesse of ["moteurs", "effets", "OP-1", "EP-133"]) {
      expect(entree, `la carte ne mentionne pas « ${promesse} »`).toContain(promesse);
    }
  });
});

describe("l'emplacement de module", () => {
  it("le Labo rend le selecteur et l'emplacement", () => {
    expect(LABO).toContain("<SelecteurModule module={moduleLabo}");
    expect(LABO).toContain("<EmplacementModule module={moduleLabo} />");
  });

  it("propose les trois modules, sans liste ecrite en dur", () => {
    // Une seconde liste divergerait de MODULES a la premiere retouche, et le
    // module manquant serait simplement absent du menu.
    expect(MODULES_SRC).toContain("MODULES.map((m) => (");
    expect(MODULES.map((m) => m.id)).toEqual(["aucun", "patch-machine", "sample", "bibliotheque"]);
  });

  it("chaque module dit ce qu'il apporte", () => {
    for (const m of MODULES) {
      expect(m.nom.trim(), `${m.id} sans nom`).toBeTruthy();
      expect(m.aide.trim(), `${m.id} sans aide`).toBeTruthy();
    }
  });

  it("« aucun » vient en premier et ne rend rien", () => {
    // Un cadre vide prendrait la place des moteurs sans rien apporter.
    expect(MODULES[0].id).toBe("aucun");
    expect(MODULES_SRC).toContain('if (module === "aucun") return null;');
  });

  it("charge les modules a la demande", () => {
    // Le Labo est deja le plus gros morceau de l'application. Importer
    // d'office trois pages entieres alourdirait son chargement pour des
    // panneaux qu'on n'ouvre pas a chaque fois.
    for (const m of ["SoundPatchCreator", "ModuleBibliotheque", "SoundEditorHub"]) {
      expect(MODULES_SRC, `${m} n'est pas charge a la demande`).toMatch(
        new RegExp(`lazy\\(\\(\\) => import\\("[^"]*${m}"\\)\\)`)
      );
    }
    expect(MODULES_SRC).toContain("<Suspense");
  });
});

describe("les modules ne demontent pas le Labo", () => {
  /**
   * Chaque module est une PAGE entiere reutilisee. Sa TopBar appelle
   * `navigateMaquette` : un clic dedans ramenerait au hub en detruisant le
   * Labo — et le travail en cours avec.
   *
   * C'est le meme defaut que `enTiroir` du rack corrige pour les studios.
   */
  const enModule = (fichier: string, drapeau: string) => {
    const source = lire(fichier);
    expect(source, `${fichier} n'accepte pas ${drapeau}`).toContain(`${drapeau} = false`);
    const ligne = source.split("\n").find((l) => l.includes("<TopBar"));
    expect(ligne, `${fichier} : TopBar introuvable`).toBeTruthy();
    expect(ligne, `${fichier} rend sa TopBar en module`).toContain(`!${drapeau} &&`);
  };

  it("le createur de patch masque sa TopBar en module", () => {
    enModule("pages/SoundPatchCreator.tsx", "enModule");
  });

  it("l'editeur de sample masque sa TopBar en module", () => {
    enModule("pages/SoundEditorHub.tsx", "enModule");
  });

  it("le module bibliotheque monte le panneau, pas la page", () => {
    // La page `SoundLibrary` a sa propre TopBar ; le module monte le panneau
    // directement, donc la question ne se pose pas.
    const source = lire("racks/ModuleBibliotheque.tsx");
    expect(source).toContain("<SoundLibraryPanel");
    expect(source).not.toContain("TopBar");
    // ...et il verifie la permission avant d'adopter la poignee.
    expect(source).toMatch(/if \(!\(await hasStoredPermission\(handle, "readwrite"\)\)\) return;/);
  });
});

describe("ce que la fusion ne devait pas perdre", () => {
  it("les moteurs natifs de l'OP-1 sont toujours la", () => {
    // fm, dna, cluster, string, phase, digital, pulse : ce que la MACHINE sait
    // jouer elle-meme. Le rack, lui, est un instrument logiciel — les deux
    // listes n'ont rien en commun.
    const patch = lire("pages/SoundPatchCreator.tsx");
    expect(patch).toContain('"fm" | "dna" | "cluster" | "string" | "phase" | "digital" | "pulse"');
  });

  it("les reglages de pads EP-133 sont toujours la", () => {
    const patch = lire("pages/SoundPatchCreator.tsx");
    for (const reglage of ["epSlot", "epGroup", "epPad", "epPadMode", "epPitch"]) {
      // Bornes exigees : `epPadModeZZ` contient `epPadMode`. Un premier jet
      // de ce test declarait le reglage present alors qu'il venait d'etre
      // renomme — cinquieme variante du meme piege ce soir.
      expect(patch, `${reglage} perdu`).toMatch(new RegExp(`\\b${reglage}\\b`));
    }
  });

  it("les exports au format machine sont toujours la", () => {
    const patch = lire("pages/SoundPatchCreator.tsx");
    expect(patch).toContain("exportOp1Patch");
    expect(patch).toContain("exportEp133Sound");
  });
});
