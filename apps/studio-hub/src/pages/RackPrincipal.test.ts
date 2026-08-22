import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le rack principal — constats de l'analyse du 2026-08-22.
 *
 * Ces tests ne corrigent rien : ils IMMOBILISENT ce que l'analyse a mesuré,
 * pour que le document de docs/ANALYSE_RACK_PRINCIPAL.md ne devienne pas faux
 * sans qu'on le sache. Un chiffre qui bouge fait tomber le test, et le
 * document se corrige avec.
 *
 * C'est le meme principe que le test des comptes de gammes : le defaut trouve
 * ce soir etait quatre documents annoncant « 29 gammes » pour 30.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RACK = readFileSync(path.join(DIR, "ToolsHub.tsx"), "utf-8");
const TYPES = readFileSync(path.join(DIR, "..", "core", "types", "audio.ts"), "utf-8");
const ANALYSE = readFileSync(path.join(DIR, "..", "..", "..", "..", "docs", "ANALYSE_RACK_PRINCIPAL.md"), "utf-8");

const outils = () => [...RACK.slice(RACK.indexOf("const tools:Tool[]=["), RACK.indexOf("\nconst sections")).matchAll(/\{id:"([^"]+)"/g)].map((m) => m[1]);

describe("la carte du rack audio ne peut plus nommer de moteur inexistant", () => {
  const MOTEURS = [...TYPES.slice(TYPES.indexOf("EnginePluginType ="), TYPES.indexOf(";", TYPES.indexOf("EnginePluginType ="))).matchAll(/"(\w+)"/g)].map((m) => m[1]);

  it("les quinze moteurs sont bien la", () => {
    expect(MOTEURS).toHaveLength(15);
  });

  it("la carte ne promet pas de moteur absent du rack", () => {
    // Le defaut trouve : la carte annoncait « Moog 24dB Ladder » et
    // « Karplus-Strong », mot pour mot le catalogue du SynthEngineDrawer
    // supprime en aout. Le code etait parti, sa promesse etait restee — a la
    // vue de tout le monde, sur la page d'accueil des outils.
    const i = RACK.indexOf('navigateMaquette("audio-plugin-rack")');
    expect(i).toBeGreaterThan(-1);
    const carte = RACK.slice(i, RACK.indexOf("</button>", i));
    for (const disparu of ["Moog", "Ladder", "Karplus"]) {
      expect(carte, `la carte nomme encore « ${disparu} »`).not.toContain(disparu);
    }
  });
});

describe("les constats chiffres de l'analyse restent vrais", () => {
  it("le tableau compte toujours dix-neuf outils", () => {
    expect(outils()).toHaveLength(19);
    expect(ANALYSE).toContain("dix-neuf");
  });

  it("le filtre laisse passer image et library", () => {
    // Constat 1. Le nombre a change ce soir : `library` a recu une route et
    // rejoint le rendu. Le reste du tableau attend la fusion des deux
    // systemes, remise a apres les essais physiques.
    // L'INSTRUCTION entiere, et non une ligne : le filtre tient sur deux
    // lignes, les exclusions etant sur la seconde. Cherchee par contenu et
    // non par index — la suppression des modales mortes a decale le fichier,
    // et un premier jet lisait `[110]` qui ne pointait plus sur rien.
    const depart = RACK.indexOf("const filteredTools");
    expect(depart, "declaration du filtre introuvable").toBeGreaterThan(-1);
    const ligne = RACK.slice(depart, RACK.indexOf(";", depart));
    expect(ligne).toContain("category !==");
    const cats = new Set([...ligne.matchAll(/category !== "([^"]+)"/g)].map((m) => m[1]));
    const ids = new Set([...ligne.matchAll(/id !== "([^"]+)"/g)].map((m) => m[1]));
    const bloc = RACK.slice(RACK.indexOf("const tools:Tool[]=["), RACK.indexOf("\nconst sections"));
    const restants = [...bloc.matchAll(/\{id:"([^"]+)",code:"[^"]*",category:"([^"]+)"/g)]
      .filter(([, id, cat]) => !cats.has(cat) && !ids.has(id))
      .map(([, id]) => id);
    expect(restants.sort()).toEqual(["image", "library"]);
  });

  it("les onglets de section ne sont toujours pas branches", () => {
    // Constat 2. Le jour ou quelqu'un les rebranche, ce test tombe — et
    // c'est le bon moment pour verifier que deux onglets ne sont pas vides.
    expect((RACK.match(/setActiveSection/g) ?? [])).toHaveLength(1);
  });

  it("les quatre modales inatteignables ont disparu", () => {
    // Constat 3, corrige : leur etat etait declare, leur rendu ecrit, et leur
    // declencheur n'existait pas. Supprimees plutot que branchees — rien
    // n'indiquait qu'elles aient jamais ete atteignables.
    // Bornes exigees : `showSoundEditor` contient `showSound`, et
    // `SoundEditorHub` contient... rien de tout ca, mais un premier jet de ce
    // test tombait sur le premier — il declarait mort un etat bien vivant.
    for (const mort of ["showSave", "showSound", "showOP1Studio", "showEP133Studio",
                        "SaveModal", "SoundModal", "StudioModal",
                        "saveTools", "soundTools", "op1StudioTools", "ep133StudioTools"]) {
      expect(RACK, `${mort} subsiste`).not.toMatch(new RegExp(`\\b${mort}\\b`));
    }
    // ...et ce qui reste vivant doit rester la, sinon ce test passerait aussi
    // sur un fichier vide.
    expect(RACK).toMatch(/\bshowSoundEditor\b/);
    expect(RACK).toMatch(/\bSettingsModal\b/);
    // Les deux qui marchent, pour que le test distingue « inatteignable » de
    // « le fichier ne contient plus ces modales du tout ».
    expect(RACK).toContain("setShowTraining(true)");
    expect(RACK).toContain("setShowSettings(true)");
  });

  it("library a maintenant une route vers sa page", () => {
    // Constat 4, corrige. Il retombait sur `setSelected()` — une modale
    // purement descriptive — pendant que SoundLibraryPanel, qui importe,
    // hache et ecrit sur le disque, n'etait monte nulle part.
    const corps = RACK.slice(RACK.indexOf("function openTool(tool:Tool){"), RACK.indexOf("const scrollToDocumentation"));
    expect(outils()).toContain("library");
    expect(corps).toContain('tool.id==="library"');
    expect(corps).toContain('navigateMaquette("sound-library")');
  });

  it("le panneau de bibliotheque est enfin monte quelque part", () => {
    // Le defaut d'origine n'etait pas la route manquante mais le panneau
    // orphelin : 263 lignes fonctionnelles que rien ne rendait.
    const page = readFileSync(path.join(DIR, "SoundLibrary.tsx"), "utf-8");
    expect(page).toContain("<SoundLibraryPanel");
    expect(page).toContain("workspaceHandle={workspaceHandle}");
    // La poignee revient d'IndexedDB, mais pas le droit de lire : l'adopter
    // sans verifier afficherait une bibliotheque vide sous un espace
    // « connecte ».
    //
    // On vise l'APPEL et non le nom : un premier jet cherchait
    // « hasStoredPermission », que la ligne d'import contient encore apres
    // qu'on ait retire la verification. Le test passait sur du code sans garde.
    expect(page).toMatch(/await hasStoredPermission\(handle, "readwrite"\)/);
    expect(page).toMatch(/if \(![\s\S]{0,60}hasStoredPermission[\s\S]{0,40}\) return;/);
  });

  it("le panneau ne nomme plus des pages qui n'existent plus", () => {
    // Il disait « connecte l'espace maitre dans Coffre de l'atelier » — deux
    // noms d'avant le travail sur les libelles. Un utilisateur qui cherche
    // « Coffre de l'atelier » dans le rack principal ne le trouve pas.
    const panneau = readFileSync(path.join(DIR, "..", "SoundLibraryPanel.tsx"), "utf-8");
    expect(panneau).not.toContain("espace maître");
    expect(panneau).not.toContain("Coffre de l’atelier");
  });
});

describe("le document d'analyse reste raccroche au code", () => {
  it("annonce la taille reelle du fichier", () => {
    // Une analyse qui cite `:247` alors que le fichier a change n'aide plus
    // personne. Si la taille bouge, les numeros de ligne aussi.
    // `split("\n")` compte la chaine vide qui suit le dernier saut de ligne :
    // un fichier de 472 lignes en rend 473. Mon premier jet comparait les deux
    // directement et tombait sur son propre decalage.
    const lignes = RACK.split("\n").length - 1;
    expect(ANALYSE).toContain(`${lignes} lignes`);
  });

  it("nomme les quinze moteurs reels, pas cinq inventes", () => {
    for (const m of ["mi_plaits", "faust_dsp", "open303"]) {
      expect(ANALYSE, `${m} absent de l'analyse`).toContain(m);
    }
  });
});
