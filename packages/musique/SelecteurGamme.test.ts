import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FAMILLES } from "./gammes";

/**
 * Le selecteur de gamme, posable dans le hub comme dans les studios.
 *
 * Le depot n'a aucun test de rendu React — c'est une regle tenue, pas un
 * manque. Ces tests lisent donc le source, et visent ce qui rendrait le
 * composant impossible a poser ailleurs : un etat interne, une feuille de
 * style importee, des classes en dur.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(path.join(DIR, "SelecteurGamme.tsx"), "utf-8");
const INDEX = readFileSync(path.join(DIR, "index.ts"), "utf-8");

describe("le composant reste posable ailleurs", () => {
  it("lit bien le source", () => {
    expect(SRC.length).toBeGreaterThan(1000);
  });

  it("n'a aucun etat interne", () => {
    // Un `useState` ici et le composant garderait sa propre idee de la gamme,
    // divergeant de celle de l'hote — deux verites pour un seul reglage.
    expect(SRC).not.toContain("useState");
    expect(SRC).not.toContain("useEffect");
    expect(SRC).not.toContain("useRef");
  });

  it("n'importe aucune feuille de style", () => {
    // Les studios et le hub n'ont rien en commun cote styles. Un import CSS
    // ici imposerait le sien aux deux.
    expect(SRC).not.toMatch(/import\s+["'].*\.css["']/);
  });

  it("ne touche ni au MIDI ni au son", () => {
    // Il choisit une gamme. C'est l'hote qui decide quoi en faire.
    expect(SRC).not.toContain("requestMIDIAccess");
    expect(SRC).not.toContain("AudioContext");
    expect(SRC).not.toContain("window.");
  });

  it("accepte un prefixe de classes plutot que d'en imposer", () => {
    expect(SRC).toContain("prefixe = \"selecteur-gamme\"");
    expect(SRC).toMatch(/\$\{prefixe\}__gamme/);
  });

  it("est exporte nommement depuis l'index du paquet", () => {
    // Convention OP-1 : exports nommes. Un export par defaut obligerait
    // chaque hote a inventer son propre nom.
    expect(SRC).toContain("export function SelecteurGamme");
    expect(INDEX).toContain('export { SelecteurGamme }');
  });
});

describe("rendu des gammes", () => {
  it("groupe par famille", () => {
    // Une liste plate de trente entrees est inutilisable : on ne trouve pas
    // « dorien » dans un menu deroulant sans repere.
    expect(SRC).toContain("FAMILLES.map((famille)");
    expect(SRC).toContain("<optgroup");
    expect(FAMILLES.length).toBeGreaterThan(3);
  });

  it("n'ecrit aucune gamme en dur", () => {
    // Une seconde liste divergerait de GAMMES a la premiere gamme ajoutee, et
    // la manquante serait juste absente du menu — sans erreur nulle part.
    expect(SRC).toContain("famille.gammes.map((g)");
    expect(SRC).toContain("NOMS_GAMMES[g]");
  });

  it("passe par un select natif", () => {
    // Avec trente gammes, la recherche au clavier du navigateur — taper
    // « dor » pour atteindre dorien — vaut mieux qu'un menu maison.
    expect(SRC).toContain("<select");
  });

  it("rend le choix de tonique optionnel, mais seulement s'il est pilotable", () => {
    // `tonique` sans rappel donnerait un menu fige : l'utilisateur croirait a
    // une panne.
    expect(SRC).toContain("tonique !== undefined && onTonique !== undefined");
  });

  it("nomme ses champs pour les lecteurs d'ecran", () => {
    // Le mode compact retire les etiquettes visibles : sans aria-label, les
    // deux menus deviennent indistinguables.
    expect(SRC).toContain('aria-label="Gamme"');
    expect(SRC).toContain('aria-label="Tonique"');
  });
});
