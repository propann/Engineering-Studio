import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MOTEURS_CONNUS, lirePatchImporte } from "./importPatch";

/**
 * Cles d'essai.
 *
 * `activeEngine` en fait partie, et ce n'est pas un detail : le rack passe
 * `Object.keys(paramsRef.current)`, qui l'inclut. Une premiere version de ce
 * fichier l'omettait — le garde `if (cle === "activeEngine") continue` n'etait
 * alors jamais exerce, puisque la cle etait rejetee comme inconnue. Un
 * sabotage l'a montre : le retirer ne faisait tomber aucun test, alors qu'en
 * conditions reelles il laisse contourner la liste des moteurs.
 */
const CLES = [
  "activeEngine", "plaitsHarmonics", "plaitsTimbre", "fxDelayMix", "envAttack", "fxDriveMode",
] as const;
const lire = (o: unknown) => lirePatchImporte(JSON.stringify(o), CLES);

describe("refus des fichiers qui n'en sont pas", () => {
  it("refuse ce qui n'est pas du JSON", () => {
    const r = lirePatchImporte("{pas du json", CLES);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.raison).toMatch(/JSON/);
  });

  it("refuse un tableau ou une valeur nue", () => {
    // `typeof null === "object"` : sans le test explicite, un fichier
    // contenant `null` passerait la premiere garde et leverait plus loin.
    for (const brut of ["[]", "null", '"texte"', "42"]) {
      expect(lirePatchImporte(brut, CLES).ok, brut).toBe(false);
    }
  });

  it("refuse un fichier sans moteur", () => {
    const r = lire({ parameters: { plaitsTimbre: 40 } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.raison).toMatch(/moteur/i);
  });

  it("refuse un moteur inconnu, et le nomme", () => {
    // Un identifiant hors liste ne rend aucun son : la page afficherait un
    // rack vide sans dire pourquoi.
    const r = lire({ engine: "mi_inexistant", parameters: {} });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.raison).toContain("mi_inexistant");
  });

  it("refuse un moteur qui n'est pas une chaine", () => {
    expect(lire({ engine: 42, parameters: {} }).ok).toBe(false);
    expect(lire({ engine: null, parameters: {} }).ok).toBe(false);
  });

  it("accepte les quinze moteurs, et eux seuls", () => {
    expect(MOTEURS_CONNUS).toHaveLength(15);
    for (const m of MOTEURS_CONNUS) {
      expect(lire({ engine: m, parameters: {} }).ok, m).toBe(true);
    }
  });
});

describe("les trois formats d'export se relisent", () => {
  it("format standard : moteur a la racine, params sous « parameters »", () => {
    const r = lire({ engine: "mi_plaits", author: "moi", parameters: { plaitsTimbre: 42 } });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch.engine).toBe("mi_plaits");
      expect(r.patch.params.plaitsTimbre).toBe(42);
    }
  });

  it("format op1 : moteur a la racine", () => {
    const r = lire({ name: "OP1_MI_PLAITS", type: "synth", engine: "mi_plaits", knob1: 50 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.patch.name).toBe("OP1_MI_PLAITS");
  });

  it("format ep133 : moteur et params sous sample_map", () => {
    // Le piege : chercher `engine` seulement a la racine rejetterait un
    // fichier que le rack lui-meme a produit.
    const r = lire({
      device: "EP-133 KO II",
      sample_map: { engine: "open303", root_note: 60, params: { fxDelayMix: 30 } },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch.engine).toBe("open303");
      expect(r.patch.params.fxDelayMix).toBe(30);
    }
  });
});

describe("filtrage des reglages", () => {
  it("ignore les cles inconnues plutot que de les verser", () => {
    // `applyPatch` ecrit TOUTES les cles recues dans paramsRef. Sans filtre,
    // un fichier venu d'ailleurs y accumule ce qu'il veut.
    const r = lire({ engine: "mi_plaits", parameters: { plaitsTimbre: 10, nimporteQuoi: 1 } });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch.params).not.toHaveProperty("nimporteQuoi");
      expect(r.ignores).toContain("nimporteQuoi");
    }
  });

  it("rejette NaN et Infinity", () => {
    // Ils traversent `setValueAtTime` sans lever et rendent la voix muette.
    // JSON n'a pas de NaN littéral : il arrive comme null, ou comme chaine.
    const r = lirePatchImporte(
      '{"engine":"mi_plaits","parameters":{"plaitsTimbre":null,"plaitsHarmonics":1e999}}',
      CLES
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch.params).not.toHaveProperty("plaitsTimbre");
      expect(r.patch.params).not.toHaveProperty("plaitsHarmonics");
      expect(r.ignores).toEqual(expect.arrayContaining(["plaitsTimbre", "plaitsHarmonics"]));
    }
  });

  it("rejette objets et tableaux dans les reglages", () => {
    const r = lire({ engine: "mi_plaits", parameters: { plaitsTimbre: { a: 1 }, envAttack: [1, 2] } });
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.keys(r.patch.params)).toHaveLength(0);
  });

  it("garde les chaines et les booleens legitimes", () => {
    // `fxDriveMode` vaut « soft » ou « fold » : tout filtrer aux nombres
    // perdrait les reglages a choix.
    const r = lire({ engine: "mi_plaits", parameters: { fxDriveMode: "fold" } });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.patch.params.fxDriveMode).toBe("fold");
  });

  it("ne laisse pas passer __proto__", () => {
    // Une cle `__proto__` dans un litteral JSON arrive comme cle ordinaire.
    // Le filtre la rejette comme n'importe quelle inconnue — et le test le
    // verifie plutot que de le supposer.
    const r = lirePatchImporte(
      '{"engine":"mi_plaits","parameters":{"__proto__":{"pollue":true},"plaitsTimbre":5}}',
      CLES
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch.params.plaitsTimbre).toBe(5);
      expect(({} as Record<string, unknown>).pollue).toBeUndefined();
      expect(Object.getPrototypeOf(r.patch.params)).toBe(Object.prototype);
    }
  });

  it("le moteur ne passe pas par les reglages", () => {
    // `activeEngine` est valide a part. Le laisser entrer par `params`
    // permettrait de contourner la liste des moteurs connus.
    const r = lire({ engine: "mi_plaits", parameters: { activeEngine: "mi_inexistant" } });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch.params).not.toHaveProperty("activeEngine");
      expect(r.patch.engine).toBe("mi_plaits");
    }
  });

  it("accepte un fichier sans aucun reglage", () => {
    const r = lire({ engine: "helm" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.patch.params).toEqual({});
  });
});

describe("identite du patch importe", () => {
  it("forge un identifiant propre", () => {
    // Reutiliser celui du fichier ecraserait un patch d'usine du meme nom, ou
    // ferait croire a une selection existante.
    const a = lire({ engine: "helm", id: "pl1" });
    const b = lire({ engine: "helm", id: "pl1" });
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.patch.id).not.toBe("pl1");
      expect(a.patch.id).not.toBe(b.patch.id);
    }
  });

  it("se marque comme patch utilisateur", () => {
    // Sinon il se melangerait aux 91 patches d'usine, qui sont des constantes
    // du source et ne doivent jamais etre modifies.
    const r = lire({ engine: "helm" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch.isUserPatch).toBe(true);
      expect(r.patch.category).toBe("Importé");
    }
  });

  it("se rabat sur un nom lisible", () => {
    const r = lire({ engine: "helm", name: "   " });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.patch.name.trim().length).toBeGreaterThan(0);
  });
});

describe("cablage au rack", () => {
  const DIR = path.dirname(fileURLToPath(import.meta.url));
  const RACK = readFileSync(path.join(DIR, "..", "..", "pages", "AudioPluginRack.tsx"), "utf-8");

  it("les cles autorisees viennent de paramsRef, pas d'une copie", () => {
    // Une seconde liste divergerait de celle du rack au premier reglage
    // ajoute, et l'import perdrait le nouveau sans rien dire. Ce defaut ne se
    // voit qu'en important un fichier qui contient justement ce reglage.
    expect(RACK).toContain("Object.keys(paramsRef.current)");
  });

  it("passe par applyPatch plutot que d'ecrire les reglages a la main", () => {
    // applyPatch met a jour paramsRef ET les etats React. Ecrire seulement
    // paramsRef donnerait un son juste avec des curseurs faux.
    const i = RACK.indexOf("const importerPatch");
    const bloc = RACK.slice(i, RACK.indexOf("const exportPreset", i));
    expect(bloc).toContain("applyPatch(resultat.patch)");
  });

  it("s'arrete quand la lecture echoue", () => {
    // Sans ce retour, `resultat.patch` serait lu sur un echec : undefined
    // traverse applyPatch et vide les reglages.
    const i = RACK.indexOf("const importerPatch");
    const bloc = RACK.slice(i, RACK.indexOf("const exportPreset", i));
    expect(bloc).toMatch(/if \(!resultat\.ok\) \{[\s\S]*?return;/);
  });

  it("remet le champ a zero pour permettre de reimporter le meme fichier", () => {
    // Sans cela, choisir deux fois le meme fichier ne declenche `change`
    // qu'une fois : l'utilisateur croit que l'import a echoue.
    const i = RACK.indexOf("const importerPatch");
    const bloc = RACK.slice(i, RACK.indexOf("const exportPreset", i));
    expect(bloc).toContain('evt.target.value = ""');
  });

  it("le bouton d'import existe et declenche le champ", () => {
    expect(RACK).toContain("fichierImportRef.current?.click()");
    expect(RACK).toContain('accept="application/json,.json"');
  });
});
