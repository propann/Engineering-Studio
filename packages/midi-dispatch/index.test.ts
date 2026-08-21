import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reinitialiserPourTests, sAbonner, sAbonnerEtat, sorties } from "./index";

/**
 * Répartiteur Web MIDI.
 *
 * Le défaut que ce paquet ferme est celui-ci : `input.onmidimessage` est une
 * PROPRIÉTÉ, pas un `addEventListener`. Trois composants l'écrivaient, et le
 * dernier gagnait sans erreur.
 *
 * Pire, leurs nettoyages faisaient
 *
 *     access.inputs.forEach((i) => { i.onmidimessage = null; });
 *
 * effaçant aussi les gestionnaires des autres : fermer un panneau coupait le
 * MIDI de la page qui restait. C'est ce que les tests d'isolation ci-dessous
 * verrouillent.
 */

/** Fausse entrée MIDI : on garde de quoi déclencher un message à la main. */
/**
 * Pose un faux `navigator`.
 *
 * Node 20 expose `globalThis.navigator` en LECTURE SEULE — un getter sans
 * setter — donc une simple affectation lève. `defineProperty` passe outre, et
 * `configurable: true` permet de le remplacer d'un test à l'autre.
 */
function poserGlobal(valeur: unknown): void {
  Object.defineProperty(globalThis, "navigator", {
    value: valeur,
    configurable: true,
    writable: true,
  });
}

function fausseEntree(name: string) {
  return { name, onmidimessage: null as ((e: any) => void) | null };
}

function poserNavigateur(entrees: ReturnType<typeof fausseEntree>[], options?: { refuse?: boolean }) {
  const access: any = {
    inputs: { forEach: (f: (i: any) => void) => entrees.forEach(f) },
    outputs: { forEach: (f: (o: any) => void) => [{ name: "sortie" }].forEach(f) },
    onstatechange: null,
  };
  const requestMIDIAccess = vi.fn(() =>
    options?.refuse ? Promise.reject(new Error("refusé")) : Promise.resolve(access)
  );
  poserGlobal({ requestMIDIAccess });
  return { access, requestMIDIAccess };
}

const emettre = (entree: ReturnType<typeof fausseEntree>, donnees: number[]) =>
  entree.onmidimessage?.({ data: new Uint8Array(donnees), timeStamp: 123 });

beforeEach(() => reinitialiserPourTests());
afterEach(() => poserGlobal(undefined));

describe("plusieurs auditeurs sur une seule entrée", () => {
  it("livre le message à TOUS les abonnés", async () => {
    // C'est ce qui était impossible avant : le dernier écrasait le premier.
    const e = fausseEntree("EP-133");
    poserNavigateur([e]);
    const a = vi.fn(), b = vi.fn();
    sAbonner(a); sAbonner(b);
    await vi.waitFor(() => expect(e.onmidimessage).not.toBeNull());

    emettre(e, [0x90, 60, 100]);
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it("transmet les octets, le port et l'horodatage", async () => {
    const e = fausseEntree("EP-133");
    poserNavigateur([e]);
    const a = vi.fn();
    sAbonner(a);
    await vi.waitFor(() => expect(e.onmidimessage).not.toBeNull());

    emettre(e, [0x90, 60, 100]);
    expect(a).toHaveBeenCalledWith({
      donnees: new Uint8Array([0x90, 60, 100]),
      port: "EP-133",
      horodatage: 123,
    });
  });

  it("n'ouvre l'accès QU'UNE fois pour plusieurs abonnés", async () => {
    // Deux requestMIDIAccess aux exigences differentes peuvent redeclencher une
    // invite de permission.
    const { requestMIDIAccess } = poserNavigateur([fausseEntree("A")]);
    sAbonner(vi.fn()); sAbonner(vi.fn()); sAbonner(vi.fn());
    await vi.waitFor(() => expect(requestMIDIAccess).toHaveBeenCalled());
    expect(requestMIDIAccess).toHaveBeenCalledOnce();
  });

  it("demande l'accès AVEC sysex", async () => {
    // L'EP-133 en a besoin pour lister ses sons, et le navigateur mémorise la
    // première réponse : demander le plus large une seule fois sert tout le monde.
    const { requestMIDIAccess } = poserNavigateur([fausseEntree("A")]);
    sAbonner(vi.fn());
    await vi.waitFor(() => expect(requestMIDIAccess).toHaveBeenCalled());
    expect(requestMIDIAccess).toHaveBeenCalledWith({ sysex: true });
  });
});

describe("désabonnement isolé — la raison d'être du paquet", () => {
  it("ne retire QUE son propre auditeur", async () => {
    const e = fausseEntree("EP-133");
    poserNavigateur([e]);
    const rack = vi.fn(), studio = vi.fn();
    const fermerRack = sAbonner(rack);
    sAbonner(studio);
    await vi.waitFor(() => expect(e.onmidimessage).not.toBeNull());

    fermerRack();
    emettre(e, [0x90, 60, 100]);

    expect(rack, "le rack fermé ne doit plus rien recevoir").not.toHaveBeenCalled();
    expect(studio, "le studio doit continuer de recevoir").toHaveBeenCalledOnce();
  });

  it("laisse le gestionnaire du navigateur en place", async () => {
    // Le défaut d'origine : chacun mettait `onmidimessage = null` sur TOUTES
    // les entrées en se démontant. Fermer un panneau coupait le MIDI de la
    // page restante.
    const e = fausseEntree("EP-133");
    poserNavigateur([e]);
    const fermer = sAbonner(vi.fn());
    await vi.waitFor(() => expect(e.onmidimessage).not.toBeNull());

    fermer();
    expect(e.onmidimessage, "le port ne doit jamais être débranché").not.toBeNull();
  });

  it("survit au désabonnement du DERNIER auditeur", async () => {
    // Un abonné qui revient doit retrouver un port fonctionnel.
    const e = fausseEntree("EP-133");
    poserNavigateur([e]);
    sAbonner(vi.fn())();
    await vi.waitFor(() => expect(e.onmidimessage).not.toBeNull());

    const retour = vi.fn();
    sAbonner(retour);
    emettre(e, [0x90, 62, 90]);
    expect(retour).toHaveBeenCalledOnce();
  });

  it("un auditeur qui lève ne prive pas les autres", async () => {
    const e = fausseEntree("EP-133");
    poserNavigateur([e]);
    sAbonner(() => { throw new Error("boum"); });
    const sain = vi.fn();
    sAbonner(sain);
    await vi.waitFor(() => expect(e.onmidimessage).not.toBeNull());

    expect(() => emettre(e, [0x90, 60, 100])).not.toThrow();
    expect(sain).toHaveBeenCalledOnce();
  });
});

describe("branchement à chaud", () => {
  it("câble une entrée apparue après l'ouverture", async () => {
    const e1 = fausseEntree("A");
    const entrees = [e1];
    const { access } = poserNavigateur(entrees);
    const a = vi.fn();
    sAbonner(a);
    await vi.waitFor(() => expect(e1.onmidimessage).not.toBeNull());

    const e2 = fausseEntree("OP-1");
    entrees.push(e2);
    access.onstatechange?.({});
    expect(e2.onmidimessage, "la nouvelle entrée doit être câblée").not.toBeNull();

    emettre(e2, [0x90, 64, 100]);
    expect(a).toHaveBeenCalledOnce();
  });

  it("ne recâble pas une entrée déjà câblée", async () => {
    // Réécrire le gestionnaire à chaque rafraîchissement, c'est exactement ce
    // qui écrasait celui des autres.
    const e = fausseEntree("A");
    const { access } = poserNavigateur([e]);
    sAbonner(vi.fn());
    await vi.waitFor(() => expect(e.onmidimessage).not.toBeNull());

    const premier = e.onmidimessage;
    access.onstatechange?.({});
    expect(e.onmidimessage).toBe(premier);
  });
});

describe("état et refus", () => {
  it("prévient des entrées disponibles", async () => {
    poserNavigateur([fausseEntree("EP-133"), fausseEntree("OP-1")]);
    const vu: any[] = [];
    sAbonnerEtat((i) => vu.push(i));
    await vi.waitFor(() => expect(vu.length).toBeGreaterThan(0));
    expect(vu[vu.length - 1].entrees).toEqual(["EP-133", "OP-1"]);
    expect(vu[vu.length - 1].accorde).toBe(true);
  });

  it("prévient d'un refus sans lever", async () => {
    poserNavigateur([], { refuse: true });
    const vu: any[] = [];
    sAbonnerEtat((i) => vu.push(i));
    await vi.waitFor(() => expect(vu.length).toBeGreaterThan(0));
    expect(vu[0].accorde).toBe(false);
    expect(vu[0].raison).toContain("refusé");
  });

  it("prévient quand Web MIDI n'existe pas", async () => {
    // Contexte non sécurisé : l'API est absente, pas seulement bloquée.
    poserGlobal({});
    const vu: any[] = [];
    sAbonnerEtat((i) => vu.push(i));
    await vi.waitFor(() => expect(vu.length).toBeGreaterThan(0));
    expect(vu[0].accorde).toBe(false);
    expect(vu[0].raison).toContain("indisponible");
  });

  it("rend les sorties disponibles", async () => {
    poserNavigateur([fausseEntree("A")]);
    expect(await sorties()).toHaveLength(1);
  });

  it("rend une liste de sorties vide sans accès", async () => {
    poserGlobal({});
    expect(await sorties()).toEqual([]);
  });
});
