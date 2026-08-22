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

  it("le filtre n'en laisse toujours passer qu'un", () => {
    // Si ce nombre change, l'analyse doit etre relue : c'est le constat 1.
    const ligne = RACK.split("\n")[110];
    const cats = new Set([...ligne.matchAll(/category !== "([^"]+)"/g)].map((m) => m[1]));
    const ids = new Set([...ligne.matchAll(/id !== "([^"]+)"/g)].map((m) => m[1]));
    const bloc = RACK.slice(RACK.indexOf("const tools:Tool[]=["), RACK.indexOf("\nconst sections"));
    const restants = [...bloc.matchAll(/\{id:"([^"]+)",code:"[^"]*",category:"([^"]+)"/g)]
      .filter(([, id, cat]) => !cats.has(cat) && !ids.has(id))
      .map(([, id]) => id);
    expect(restants).toEqual(["image"]);
  });

  it("les onglets de section ne sont toujours pas branches", () => {
    // Constat 2. Le jour ou quelqu'un les rebranche, ce test tombe — et
    // c'est le bon moment pour verifier que deux onglets ne sont pas vides.
    expect((RACK.match(/setActiveSection/g) ?? [])).toHaveLength(1);
  });

  it("les quatre modales sans declencheur le sont toujours", () => {
    // Constat 3. Chaque etat est declare, rendu, et jamais mis a vrai.
    for (const etat of ["setShowSave", "setShowSound", "setShowOP1Studio", "setShowEP133Studio"]) {
      expect(RACK, `${etat} a maintenant un declencheur`).not.toContain(`${etat}(true)`);
    }
    // Les deux qui marchent, pour que le test distingue « inatteignable » de
    // « le fichier ne contient plus ces modales du tout ».
    expect(RACK).toContain("setShowTraining(true)");
    expect(RACK).toContain("setShowSettings(true)");
  });

  it("library n'a toujours aucune route", () => {
    // Constat 4 — le meme defaut que celui documente comme corrige au cas
    // `midi`, reste sur cet outil.
    const corps = RACK.slice(RACK.indexOf("function openTool(tool:Tool){"), RACK.indexOf("const scrollToDocumentation"));
    expect(outils()).toContain("library");
    expect(corps).not.toContain('tool.id==="library"');
  });
});

describe("le document d'analyse reste raccroche au code", () => {
  it("cite des lignes qui existent encore", () => {
    // Une analyse qui cite `:247` alors que le fichier a change n'aide plus
    // personne. On verifie la taille : si elle bouge, les numeros aussi.
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
