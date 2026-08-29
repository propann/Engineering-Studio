import { describe, expect, it } from "vitest";
import {
  ajouterSortie,
  appelMidi,
  etiqueter,
  reconnaitre,
  retirerSorties,
  routeVersMachine,
  type Machine,
} from "./sortieMidi";

/**
 * Le routage d'un motif vers une machine.
 *
 * Ce que ces tests protègent : le code affiché est la seule source de vérité
 * de ce qui joue. Un routage qu'on ajoute doit pouvoir se retirer entièrement,
 * sinon un motif continuerait de piloter une machine sans que rien ne le
 * montre à l'écran.
 */

const machine = (nom: string): Machine => ({
  nom,
  etiquette: etiqueter(nom),
  connue: reconnaitre(nom),
});

describe("reconnaître les machines du parc", () => {
  it("repère l'OP-1 sous ses différents noms de port", () => {
    // Les noms varient selon le systeme et le pilote.
    expect(reconnaitre("OP-1")).toBe("op1");
    expect(reconnaitre("OP-1 MIDI 1")).toBe("op1");
    expect(reconnaitre("Teenage Engineering OP-1")).toBe("op1");
    expect(reconnaitre("op1 midi")).toBe("op1");
  });

  it("repère l'EP-133, y compris sous son nom commercial", () => {
    expect(reconnaitre("EP-133")).toBe("ep133");
    expect(reconnaitre("EP133 MIDI")).toBe("ep133");
    expect(reconnaitre("K.O. II")).toBe("ep133");
  });

  it("ne se prononce pas sur un port inconnu", () => {
    expect(reconnaitre("IAC Driver Bus 1")).toBeNull();
    expect(reconnaitre("")).toBeNull();
  });

  it("étiquette lisiblement", () => {
    expect(etiqueter("Teenage Engineering OP-1")).toBe("OP-1");
    expect(etiqueter("K.O. II")).toBe("EP-133");
    // Un port quelconque et long est tronque, pas renomme.
    expect(etiqueter("Un port au nom vraiment interminable ici")).toMatch(/…$/);
    expect(etiqueter("Bus 1")).toBe("Bus 1");
  });
});

describe("écrire l'appel MIDI", () => {
  it("produit un appel conforme à la documentation de Strudel", () => {
    expect(appelMidi(machine("OP-1"), 3)).toBe(".midi('OP-1').midichan(3)");
  });

  it("échappe une apostrophe dans le nom du port", () => {
    /**
     * Certains pilotes Windows nomment leurs ports avec une apostrophe. Sans
     * échappement, le code produit serait une erreur de syntaxe — et
     * l'utilisateur chercherait la faute dans SON motif.
     */
    expect(appelMidi(machine("Bob's MIDI"), 1)).toBe(".midi('Bob\\'s MIDI').midichan(1)");
  });
});

describe("ajouter et retirer le routage", () => {
  const op1 = machine("OP-1");

  it("ajoute l'appel à la fin du code", () => {
    const sortie = ajouterSortie('note("c e g")', op1, 1);
    expect(sortie).toContain(".midi('OP-1').midichan(1)");
    expect(sortie).toContain('note("c e g")');
  });

  it("n'ajoute pas deux fois le même routage", () => {
    const une = ajouterSortie('note("c")', op1, 1);
    expect(ajouterSortie(une, op1, 1)).toBe(une);
  });

  it("retire le point-virgule final avant d'ajouter", () => {
    // Sans cela on produirait `note("c");.midi(...)`, une erreur de syntaxe.
    expect(ajouterSortie('note("c");', op1, 1)).not.toContain(";.midi");
  });

  it("un aller-retour rend un code équivalent", () => {
    /**
     * L'invariant qui compte : ce qu'on ajoute doit pouvoir se retirer. Sinon
     * un motif garderait un routage invisible dans l'interface.
     */
    const depart = 'note("c e g")';
    expect(retirerSorties(ajouterSortie(depart, op1, 1)).trim()).toBe(depart);
  });

  it("retire le routage quel que soit le port visé", () => {
    const code = 'note("c").midi("EP-133").midichan(10)';
    expect(retirerSorties(code).trim()).toBe('note("c")');
    expect(routeVersMachine(retirerSorties(code))).toBe(false);
  });

  it("retire plusieurs routages d'un coup", () => {
    const code = 'stack(\n  note("c").midi(\'OP-1\'),\n  s("sbd").midi(\'EP-133\').midichan(10)\n)';
    const propre = retirerSorties(code);
    expect(routeVersMachine(propre)).toBe(false);
    expect(propre).toContain('note("c")');
    expect(propre).toContain('s("sbd")');
  });

  it("laisse intact un code sans routage", () => {
    const code = 'note("c e g").sound("sawtooth")';
    expect(retirerSorties(code)).toBe(code);
  });

  it("détecte un routage existant", () => {
    expect(routeVersMachine('note("c").midi("OP-1")')).toBe(true);
    expect(routeVersMachine('note("c")')).toBe(false);
    // `.midiport` et `midin` ne sont pas des sorties : ne pas les confondre.
    expect(routeVersMachine('note("c").midichan(1)')).toBe(false);
  });
});
