import { describe, expect, it, vi } from "vitest";
import { creerPointDeRetour, fichierExistant, prevolRestauration } from "./VaultPanel";

/**
 * Surete de la restauration du coffre.
 *
 * La restauration ecrasait la cible sans prevenir de ce qui allait etre
 * remplace, et sans conserver d'original. Une mauvaise cible, ou simplement
 * une categorie cochee par erreur, faisait perdre des fichiers sans recours —
 * d'autant que la boucle s'arrete au premier defaut d'integrite et laisse
 * donc la cible a moitie ecrasee.
 *
 * Ces tests portent sur le prevol et le point de retour, qui doivent tous
 * deux s'executer avant la premiere ecriture.
 */

// --- systeme de fichiers factice ------------------------------------------

function fauxFichier(nom: string, contenu = "x") {
  // Le contenu est reellement conserve : copyFile relit la destination apres
  // ecriture pour comparer les empreintes. Un faux qui jette ce qu'on lui
  // ecrit ferait echouer cette verification, et le banc de test signalerait
  // une panne inexistante.
  let octets = new TextEncoder().encode(contenu);
  return {
    name: nom,
    getFile: async () => ({
      size: octets.byteLength,
      arrayBuffer: async () => octets.slice().buffer,
    }),
    createWritable: async () => ({
      write: vi.fn(async (data: ArrayBuffer) => {
        octets = new Uint8Array(data.slice(0));
      }),
      close: vi.fn(async () => {}),
    }),
  };
}

/** Dossier factice. `contenu` melange fichiers (chaine) et sous-dossiers. */
function fauxDossier(contenu: Record<string, any> = {}) {
  const enfants = new Map<string, any>();
  for (const [nom, v] of Object.entries(contenu)) {
    enfants.set(nom, typeof v === "string" ? fauxFichier(nom, v) : fauxDossier(v));
  }

  const dossier: any = {
    __enfants: enfants,
    async getFileHandle(nom: string, opts?: { create?: boolean }) {
      const trouve = enfants.get(nom);
      if (trouve && !trouve.__enfants) return trouve;
      if (opts?.create) {
        const f = fauxFichier(nom, "");
        enfants.set(nom, f);
        return f;
      }
      throw new DOMException("NotFoundError");
    },
    async getDirectoryHandle(nom: string, opts?: { create?: boolean }) {
      const trouve = enfants.get(nom);
      if (trouve?.__enfants) return trouve;
      if (opts?.create) {
        const d = fauxDossier();
        enfants.set(nom, d);
        return d;
      }
      throw new DOMException("NotFoundError");
    },
  };
  return dossier;
}

const fichier = (path: string, size = 10) => ({ path, size }) as any;

/**
 * Empreinte SHA-256 d'une chaine, calculee comme le fait le module — sans
 * quoi les tests d'« inchange » compareraient des valeurs inventees.
 */
async function empreinte(contenu: string): Promise<string> {
  const octets = new TextEncoder().encode(contenu);
  const digest = await crypto.subtle.digest("SHA-256", octets);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// --- tests ----------------------------------------------------------------

describe("fichierExistant", () => {
  it("trouve un fichier a la racine", async () => {
    const cible = fauxDossier({ "a.aif": "abc" });
    expect(await fichierExistant(cible, "a.aif")).not.toBeNull();
  });

  it("trouve un fichier en profondeur", async () => {
    const cible = fauxDossier({ synth: { user: { "b.aif": "abc" } } });
    expect(await fichierExistant(cible, "synth/user/b.aif")).not.toBeNull();
  });

  it("rend null quand le dossier n'existe pas", async () => {
    // Ne doit pas lever : un dossier absent signifie simplement « creation ».
    const cible = fauxDossier({});
    expect(await fichierExistant(cible, "synth/user/b.aif")).toBeNull();
  });

  it("rend null quand seul le fichier manque", async () => {
    const cible = fauxDossier({ synth: { user: {} } });
    expect(await fichierExistant(cible, "synth/user/b.aif")).toBeNull();
  });

  it("rend null sur un chemin vide", async () => {
    expect(await fichierExistant(fauxDossier({}), "")).toBeNull();
  });
});

describe("prevolRestauration", () => {
  it("separe creations et remplacements", async () => {
    const cible = fauxDossier({ synth: { "a.aif": "abc" } });
    const p = await prevolRestauration([fichier("synth/a.aif"), fichier("synth/b.aif")], cible);
    expect(p.aRemplacer.map((f) => f.path)).toEqual(["synth/a.aif"]);
    expect(p.aCreer).toEqual(["synth/b.aif"]);
  });

  it("rend la taille reelle du fichier qui sera ecrase", async () => {
    // C'est ce qui permet d'annoncer ce qu'on va perdre, pas ce qu'on ecrit.
    const cible = fauxDossier({ "a.aif": "123456789" });
    const p = await prevolRestauration([fichier("a.aif", 2)], cible);
    expect(p.aRemplacer[0].octets).toBe(9);
  });

  it("annonce tout en creation sur une cible vide", async () => {
    const p = await prevolRestauration([fichier("a.aif"), fichier("b/c.aif")], fauxDossier({}));
    expect(p.aRemplacer).toEqual([]);
    expect(p.aCreer).toHaveLength(2);
  });

  it("n'ecrit rien pendant l'analyse", async () => {
    // Le prevol doit etre strictement en lecture : sinon il n'y a plus de
    // moment ou l'utilisateur peut encore renoncer.
    const cible = fauxDossier({ "a.aif": "abc" });
    const avant = [...cible.__enfants.keys()];
    await prevolRestauration([fichier("a.aif"), fichier("nouveau/x.aif")], cible);
    expect([...cible.__enfants.keys()]).toEqual(avant);
  });

  it("accepte une liste vide", async () => {
    const p = await prevolRestauration([], fauxDossier({ "a.aif": "abc" }));
    expect(p.aCreer).toEqual([]);
    expect(p.aRemplacer).toEqual([]);
  });
});

describe("creerPointDeRetour", () => {
  it("ne cree rien quand aucun fichier n'est remplace", async () => {
    // Pas de dossier vide inutile dans la cible de l'utilisateur.
    const cible = fauxDossier({});
    expect(await creerPointDeRetour([], cible)).toBeNull();
    expect(cible.__enfants.size).toBe(0);
  });

  it("cree un dossier horodate", async () => {
    const cible = fauxDossier({ "a.aif": "abc" });
    const nom = await creerPointDeRetour([{ path: "a.aif" }], cible);
    expect(nom).toMatch(/^_point-de-retour\/\d{4}-\d{2}-\d{2}T/);
    expect(cible.__enfants.has("_point-de-retour")).toBe(true);
  });

  it("conserve l'arborescence d'origine", async () => {
    // Restaurer a la main depuis le point de retour suppose de retrouver les
    // fichiers au meme endroit.
    const cible = fauxDossier({ synth: { user: { "a.aif": "abc" } } });
    await creerPointDeRetour([{ path: "synth/user/a.aif" }], cible);
    const pdr = cible.__enfants.get("_point-de-retour");
    const horodate = [...pdr.__enfants.values()][0];
    expect(horodate.__enfants.get("synth").__enfants.get("user").__enfants.has("a.aif")).toBe(true);
  });

  it("rend compte de sa progression", async () => {
    const cible = fauxDossier({ "a.aif": "abc", "b.aif": "def" });
    const vus: number[] = [];
    await creerPointDeRetour([{ path: "a.aif" }, { path: "b.aif" }], cible, (fait) => vus.push(fait));
    expect(vus).toEqual([1, 2]);
  });

  it("ignore un fichier disparu entre le prevol et la copie", async () => {
    // Le prevol et l'ecriture ne sont pas atomiques : un fichier peut avoir
    // ete supprime entre-temps. Ce n'est pas une raison de tout interrompre.
    const cible = fauxDossier({ "a.aif": "abc" });
    await expect(
      creerPointDeRetour([{ path: "a.aif" }, { path: "disparu.aif" }], cible)
    ).resolves.toMatch(/^_point-de-retour\//);
  });

  it("produit un nom different a chaque appel", async () => {
    // Deux restaurations successives ne doivent pas s'ecraser l'une l'autre.
    const cible = fauxDossier({ "a.aif": "abc" });
    const un = await creerPointDeRetour([{ path: "a.aif" }], cible);
    await new Promise((r) => setTimeout(r, 5));
    const deux = await creerPointDeRetour([{ path: "a.aif" }], cible);
    expect(un).not.toBe(deux);
  });
});

describe("fichiers deja identiques", () => {
  it("classe en inchange un fichier dont l'empreinte correspond", async () => {
    // Le gain concret : restaurer une seule categorie d'un OP-1 ne doit pas
    // recopier les 270 Mo entiers.
    const h = await empreinte("abc");
    const cible = fauxDossier({ "a.aif": "abc" });
    const p = await prevolRestauration([{ path: "a.aif", size: 3, sha256: h } as any], cible);
    expect(p.inchanges).toEqual(["a.aif"]);
    expect(p.aRemplacer).toEqual([]);
    expect(p.aCreer).toEqual([]);
  });

  it("classe a remplacer un fichier dont l'empreinte differe", async () => {
    const h = await empreinte("autre chose");
    const cible = fauxDossier({ "a.aif": "abc" });
    const p = await prevolRestauration([{ path: "a.aif", size: 3, sha256: h } as any], cible);
    expect(p.aRemplacer.map((f) => f.path)).toEqual(["a.aif"]);
    expect(p.inchanges).toEqual([]);
  });

  it("remplace par prudence quand le manifeste n'a pas d'empreinte", async () => {
    // Les manifestes herites ne portent pas toujours de sha256. On ne saute
    // jamais une ecriture sur une supposition.
    const cible = fauxDossier({ "a.aif": "abc" });
    const p = await prevolRestauration([fichier("a.aif")], cible);
    expect(p.aRemplacer.map((f) => f.path)).toEqual(["a.aif"]);
    expect(p.inchanges).toEqual([]);
  });

  it("n'inclut jamais un fichier absent parmi les inchanges", async () => {
    const h = await empreinte("abc");
    const p = await prevolRestauration([{ path: "b.aif", size: 3, sha256: h } as any], fauxDossier({}));
    expect(p.aCreer).toEqual(["b.aif"]);
    expect(p.inchanges).toEqual([]);
  });

  it("separe correctement les trois groupes", async () => {
    const hA = await empreinte("aaa");
    const hB = await empreinte("different");
    const cible = fauxDossier({ "a.aif": "aaa", "b.aif": "bbb" });
    const p = await prevolRestauration(
      [
        { path: "a.aif", size: 3, sha256: hA } as any,
        { path: "b.aif", size: 3, sha256: hB } as any,
        fichier("c.aif"),
      ],
      cible
    );
    expect(p.inchanges).toEqual(["a.aif"]);
    expect(p.aRemplacer.map((f) => f.path)).toEqual(["b.aif"]);
    expect(p.aCreer).toEqual(["c.aif"]);
  });

  it("exclut les inchanges du point de retour", async () => {
    // Copier au point de retour un fichier qu'on ne va pas ecraser
    // gonflerait celui-ci de doublons inutiles.
    const cible = fauxDossier({ "a.aif": "abc", "b.aif": "def" });
    await creerPointDeRetour([{ path: "b.aif" }], cible);
    const pdr = cible.__enfants.get("_point-de-retour");
    const horodate = [...pdr.__enfants.values()][0];
    expect(horodate.__enfants.has("b.aif")).toBe(true);
    expect(horodate.__enfants.has("a.aif")).toBe(false);
  });
});
