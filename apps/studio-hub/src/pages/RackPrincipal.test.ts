import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le rack principal, apres la fusion des deux systemes.
 *
 * Il rendait un tableau de 19 outils ET neuf cartes ecrites a la main dans le
 * JSX. Les deux produisaient exactement le meme balisage — l'un lisait des
 * donnees, l'autre avait les valeurs recopiees. Presque tous les defauts
 * releves par docs/ANALYSE_RACK_PRINCIPAL.md en decoulaient :
 *
 * - un filtre de QUATORZE exclusions, tenu a la main, pour eviter les doublons
 *   entre les deux systemes ;
 * - des onglets de section declares mais impossibles a rebrancher, parce que
 *   les vrais outils vivaient dans les cartes, qui ignoraient les sections ;
 * - une carte capable de contredire les metadonnees de son propre outil. C'est
 *   arrive : celle du rack audio annoncait deux moteurs inexistants ;
 * - un `openTool` en cascade de quinze `if`, ou deux branches n'etaient jamais
 *   atteintes parce qu'un cas plus haut captait deja l'outil.
 *
 * Ces tests verrouillent la source unique. Sans eux, une carte ecrite a la
 * main revient au premier « juste celle-la, elle est speciale ».
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RACK = readFileSync(path.join(DIR, "ToolsHub.tsx"), "utf-8");
const TYPES = readFileSync(path.join(DIR, "..", "core", "types", "audio.ts"), "utf-8");
const CSS = readFileSync(path.join(DIR, "outils.css"), "utf-8");
const ANALYSE = readFileSync(path.join(DIR, "..", "..", "..", "..", "docs", "ANALYSE_RACK_PRINCIPAL.md"), "utf-8");

const outils = () =>
  [...RACK.slice(RACK.indexOf("const tools: Tool[] = ["), RACK.indexOf("\n/** Les cartes du rack"))
    .matchAll(/^\s{4}id: "([^"]+)"/gm)].map((m) => m[1]);

describe("une seule source", () => {
  it("aucune carte n'est plus ecrite a la main", () => {
    // L'invariant central. Une carte en dur peut contredire son propre outil,
    // echappe aux sections, et oblige a l'exclure du filtre a la main.
    const enDur = RACK.split("\n").filter((l) =>
      /className="utility-card [a-z0-9-]+"/.test(l) && !l.includes("${tool.accent}")
    );
    expect(enDur, `cartes ecrites a la main : ${enDur.length}`).toEqual([]);
  });

  it("le filtre d'exclusions a disparu", () => {
    // Quatorze exclusions tenues a la main, dont la seule raison d'etre etait
    // d'eviter le doublon entre les deux systemes.
    expect(RACK).not.toContain('category !== "DOCUMENTATION"');
    expect(RACK).not.toContain('t.id !== "vault"');
  });

  it("un seul composant rend toutes les cartes", () => {
    expect(RACK).toContain("function CarteOutil(");
    expect(RACK).toContain("<CarteOutil key={tool.id}");
  });

  it("la photo de machine est un champ, plus un cas particulier", () => {
    // C'etait la SEULE chose que les cartes en dur savaient faire en plus.
    expect(RACK).toMatch(/image\?: \{ src: string/);
    expect(RACK).toContain("if (tool.image) {");
  });
});

describe("l'ouverture est portee par la donnee", () => {
  it("plus de cascade d'identifiants", () => {
    // `openTool` testait quinze identifiants dans l'ordre. Deux branches
    // n'etaient jamais atteintes — un lecteur cherchant « ou va Tape »
    // trouvait la mauvaise reponse.
    expect(RACK).not.toContain("function openTool(");
    const i = RACK.indexOf("function ouvrir(tool: Tool)");
    expect(i).toBeGreaterThan(-1);
    const corps = RACK.slice(i, RACK.indexOf("\n }", i));
    expect(corps).not.toContain('tool.id === "');
    expect(corps).not.toContain('tool.id==="');
  });

  it("chaque type d'action est traite", () => {
    const corps = RACK.slice(RACK.indexOf("function ouvrir(tool: Tool)"));
    for (const type of ["page", "groupe", "ancre", "fiche"]) {
      expect(corps, `action « ${type} » non traitee`).toContain(`case "${type}":`);
    }
  });

  it("chaque outil declare son action", () => {
    // Sans action, un outil ouvrirait la fiche descriptive par defaut — le
    // defaut qui avait laisse `library` inatteignable.
    const bloc = RACK.slice(RACK.indexOf("const tools: Tool[] = ["), RACK.indexOf("\n/** Les cartes du rack"));
    const entrees = bloc.match(/^\s{4}id: "/gm) ?? [];
    const actions = bloc.match(/^\s{4}action: \{/gm) ?? [];
    expect(actions.length, "des outils sans action").toBe(entrees.length);
  });

  it("aucun outil ne depend de la fiche descriptive", () => {
    // Elle reste comme dernier recours, mais un outil qui en depend n'est pas
    // branche. C'etait le cas de `library`.
    const bloc = RACK.slice(RACK.indexOf("const tools: Tool[] = ["), RACK.indexOf("\n/** Les cartes du rack"));
    expect(bloc).not.toContain('action: { type: "fiche" }');
  });
});

describe("navigation principale", () => {
  it("conserve uniquement la TopBar", () => {
    expect(RACK).not.toContain("hub-sections");
    expect(RACK).not.toContain("setActiveSection");
  });

  it("garde des cartes pour les deux studios", () => {
    const bloc = RACK.slice(RACK.indexOf("const tools: Tool[] = ["), RACK.indexOf("\n/** Les cartes du rack"));
    const entrees = [...bloc.matchAll(/id: "([^"]+)"[\\s\\S]*?section: "(hub|op1|ep133)"/g)];
    const cartes = entrees.filter((m) => {
      const suite = bloc.slice(m.index!, m.index! + 900);
      const fin = suite.indexOf("\n  },");
      return !suite.slice(0, fin).includes("groupe:");
    });
    for (const section of ["hub", "op1", "ep133"]) {
      const n = cartes.filter((m) => m[2] === section).length;
      expect(n, `la section « ${section} » n'a aucune carte`).toBeGreaterThan(0);
    }
  });
});

describe("le regroupement est une donnee", () => {
  it("les groupes sont derives du tableau, pas filtres a la main", () => {
    expect(RACK).toContain("const membres = (groupe: Groupe) => tools.filter((t) => t.groupe === groupe);");
    expect(RACK).not.toContain('tools.filter(t => t.category === "DOCUMENTATION")');
  });

  it("chaque groupe a exactement les membres attendus", () => {
    /**
     * Les identifiants, pas un seuil.
     *
     * Un premier jet exigeait « au moins deux membres » : retirer l'un des
     * trois reglages en laissait deux, et le test restait vert sur un groupe
     * ampute. Un seuil ne dit pas QUI manque.
     *
     * Un membre s'ecrit `groupe: "x",` (virgule finale) ; l'ouverture du
     * groupe s'ecrit `groupe: "x" }` (accolade). C'est ce qui les distingue.
     */
    const ATTENDUS: Record<string, string[]> = {
      reglages: ["midi", "op-settings", "machine-test"],
      formation: ["op1-exercise", "rhythm"],
      documentation: ["op1-docs", "ep-docs", "documentation", "app-guide"],
      son: ["sample", "sounds"],
    };
    const bloc = RACK.slice(RACK.indexOf("const tools: Tool[] = ["), RACK.indexOf("\n/** Les cartes du rack"));
    for (const [groupe, attendus] of Object.entries(ATTENDUS)) {
      const trouves = [...bloc.matchAll(/id: "([^"]+)"/g)]
        .filter((m) => {
          const entree = bloc.slice(m.index!, bloc.indexOf("\n  },", m.index!));
          return entree.includes(`groupe: "${groupe}",`);
        })
        .map((m) => m[1]);
      expect(trouves.sort(), `membres du groupe « ${groupe} »`).toEqual([...attendus].sort());
    }
  });

  it("chaque groupe a une carte qui l'ouvre, ou un rendu propre", () => {
    // « son » et « documentation » n'ouvrent pas un panneau de groupe : l'un
    // ouvre l'editeur sonore, l'autre fait defiler vers l'etagere. Les deux
    // autres passent par le panneau.
    expect(RACK).toContain('action: { type: "groupe", groupe: "reglages" }');
    expect(RACK).toContain('action: { type: "groupe", groupe: "formation" }');
    expect(RACK).toContain('action: { type: "page", page: "sound-library" }');
    expect(RACK).toContain('action: { type: "ancre", ancre: "hub-documentation" }');
    expect(RACK).toContain('<DocumentationShelf docs={membres("documentation")}');
  });

  it("les compteurs comptent les membres reels", () => {
    // La carte « Son » annoncait « 4 OUTILS » et en ouvrait un autre. Le
    // compteur est desormais derive du groupe qu'il annonce.
    expect(RACK).toContain("tool.compteurDe ? `${membres(tool.compteurDe).length}");
  });
});

describe("ce que la fusion ne devait pas casser", () => {
  it("les destinations connues sont toujours atteignables", () => {
    const bloc = RACK.slice(RACK.indexOf("const tools: Tool[] = ["));
    for (const page of [
      "studio-op1", "studio-ep133", "firmware-gallery", "firmware-lab", "backup-lab",
      "audio-plugin-rack", "sound-library", "sound-editor", "image-editor-op1",
      "midi-settings", "op1-settings", "exercises", "rhythm-hero",
      "doc-op1", "doc-ep133", "documentation",
    ]) {
      expect(bloc, `plus rien n'ouvre « ${page} »`).toContain(`page: "${page}"`);
    }
  });

  it("le test machine EP-133 passe toujours son hubTool", () => {
    // Le studio lit `?hubTool=machine-test` pour ouvrir le bon panneau.
    expect(RACK).toContain("passeHubTool: true");
    expect(RACK).toMatch(/window\.history\.replaceState\(null, "", `\?hubTool=\$\{tool\.id\}`\)/);
  });

  it("la carte du Labo ne promet pas de moteur absent du rack", () => {
    // Elle annoncait « Moog 24dB Ladder » et « Karplus-Strong » — mot pour mot
    // le catalogue d'un composant supprime en aout.
    const moteurs = [...TYPES.slice(TYPES.indexOf("EnginePluginType ="), TYPES.indexOf(";", TYPES.indexOf("EnginePluginType ="))).matchAll(/"(\w+)"/g)].map((m) => m[1]);
    expect(moteurs).toHaveLength(15);
    const i = RACK.indexOf('id: "labo"');
    const carte = RACK.slice(i, RACK.indexOf("\n  },", i));
    for (const disparu of ["Moog", "Ladder", "Karplus"]) {
      expect(carte, `la carte du Labo nomme encore « ${disparu} »`).not.toContain(disparu);
    }
  });

  it("aucun identifiant n'est declare deux fois", () => {
    const ids = outils();
    expect(ids.length).toBeGreaterThan(20);
    expect(new Set(ids).size, "un identifiant est declare deux fois").toBe(ids.length);
  });
});

describe("l'analyse reste raccrochee au code", () => {
  it("presente sa taille comme un fait DATE, pas comme l'etat courant", () => {
    // Un premier jet exigeait que l'analyse annonce la taille exacte du
    // fichier : le test tombait a chaque modification, sans qu'aucun constat
    // ne soit devenu faux. C'etait du bruit.
    //
    // L'analyse est un document date. Sa taille est un fait d'alors, et les
    // numeros de ligne qu'elle cite ne valent que pour cet etat — c'est ce
    // qu'elle doit dire.
    expect(ANALYSE).toContain("au\nmoment de l'analyse");
    expect(ANALYSE).toContain("Ce qui a été appliqué");
  });

  it("nomme les moteurs reels, pas cinq inventes", () => {
    for (const m of ["mi_plaits", "faust_dsp", "open303"]) {
      expect(ANALYSE, `${m} absent de l'analyse`).toContain(m);
    }
  });
});
