/**
 * Les extraits de code Strudel, gardés localement.
 *
 * Le rack Strudel est un éditeur : ce qu'on y écrit doit survivre à un
 * rechargement, sinon il n'est qu'un bac à sable. La feuille de route le
 * demande explicitement — « une fenêtre d'édition du code avec sauvegarde
 * locale des extraits et des préréglages ».
 *
 * Tout est **local au navigateur**, comme le reste de l'atelier : rien ne part
 * sur un serveur, et aucun extrait ne touche une machine.
 *
 * La logique vit ici, hors du composant, pour être exécutée par des tests.
 * Un stockage écrit dans le JSX ne serait vérifiable que par la présence d'une
 * chaîne dans un fichier — ce qui ne prouve rien de son comportement.
 */

export const CLE_EXTRAITS = "engineering-studio:strudel:extraits:v1";

export type Extrait = {
  id: string;
  nom: string;
  code: string;
  /** Date ISO de la dernière écriture. */
  modifieLe: string;
};

/** Le format sur disque. La version permet de migrer sans perdre. */
type Enveloppe = { version: 1; extraits: Extrait[] };

/**
 * Le stockage utilisé. Injectable pour les tests, et parce que `localStorage`
 * lève dans une fenêtre privée verrouillée : l'atelier doit continuer de
 * fonctionner sans mémoire plutôt que de refuser de démarrer.
 */
export type Stockage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function stockageParDefaut(): Stockage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

function identifiant(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // Contexte non sécurisé : on retombe sur une clé suffisante ici, les
    // extraits ne quittant jamais ce navigateur.
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Un nom vide rendrait la liste illisible ; on en fabrique un plutôt que de refuser. */
export function nomSain(nom: string): string {
  const propre = nom.trim().replace(/\s+/g, " ").slice(0, 60);
  return propre || "Sans titre";
}

/**
 * Relit les extraits.
 *
 * Ne lève jamais : un stockage corrompu rend une liste vide, pas une page
 * blanche. C'est le même choix que `readHubCache` — perdre des extraits est
 * regrettable, empêcher l'atelier de démarrer l'est davantage.
 */
export function lireExtraits(stockage: Stockage | null = stockageParDefaut()): Extrait[] {
  if (!stockage) return [];
  try {
    const brut = stockage.getItem(CLE_EXTRAITS);
    if (!brut) return [];
    const lu = JSON.parse(brut) as Partial<Enveloppe>;
    if (!lu || !Array.isArray(lu.extraits)) return [];
    // Chaque entrée est revalidée : une seule ligne abîmée ne doit pas
    // emporter les autres.
    return lu.extraits.filter(
      (e): e is Extrait =>
        !!e && typeof e.id === "string" && typeof e.nom === "string" &&
        typeof e.code === "string" && typeof e.modifieLe === "string",
    );
  } catch {
    return [];
  }
}

/** Écrit la liste. Rend `false` si le stockage a refusé — quota, mode privé. */
export function ecrireExtraits(
  extraits: Extrait[],
  stockage: Stockage | null = stockageParDefaut(),
): boolean {
  if (!stockage) return false;
  try {
    const enveloppe: Enveloppe = { version: 1, extraits };
    stockage.setItem(CLE_EXTRAITS, JSON.stringify(enveloppe));
    return true;
  } catch {
    return false;
  }
}

/**
 * Enregistre un extrait, ou remplace celui du même nom.
 *
 * Remplacer par le NOM et non par l'identifiant est délibéré : on réenregistre
 * en tapant le même titre, et deux entrées homonymes rendraient la liste
 * inutilisable. L'identifiant, lui, ne change pas — ce qui préserve l'ordre.
 */
export function enregistrerExtrait(
  nom: string,
  code: string,
  extraits: Extrait[],
  maintenant: () => string = () => new Date().toISOString(),
): Extrait[] {
  const titre = nomSain(nom);
  const existant = extraits.find((e) => e.nom === titre);
  if (existant) {
    return extraits.map((e) =>
      e.id === existant.id ? { ...e, code, modifieLe: maintenant() } : e,
    );
  }
  return [...extraits, { id: identifiant(), nom: titre, code, modifieLe: maintenant() }];
}

/** Retire un extrait. Une liste inchangée signifie que l'identifiant est inconnu. */
export function supprimerExtrait(id: string, extraits: Extrait[]): Extrait[] {
  return extraits.filter((e) => e.id !== id);
}

/** Le plus récemment modifié d'abord — c'est celui qu'on rouvre le plus souvent. */
export function trierExtraits(extraits: Extrait[]): Extrait[] {
  return [...extraits].sort((a, b) => b.modifieLe.localeCompare(a.modifieLe));
}

/**
 * Les exemples fournis.
 *
 * Aucun n'utilise `samples()` : Strudel ne charge par défaut aucun échantillon
 * distant, et l'atelier ne doit pas être le premier à en faire venir. Ce sont
 * donc uniquement les synthés intégrés, qui fonctionnent hors ligne.
 */
export const EXEMPLES: ReadonlyArray<{ nom: string; code: string; aide: string }> = [
  {
    nom: "Première note",
    code: 'note("c e g")',
    aide: "Trois notes, en boucle. Le plus court programme qui sonne.",
  },
  {
    nom: "Motif rythmé",
    code: 'note("<c a f e>(3,8)").sound("sawtooth")',
    aide: "Trois frappes réparties sur huit temps, sur une dent de scie.",
  },
  {
    nom: "Deux voix",
    code: 'stack(\n  note("c2 [e2 g2]").sound("square"),\n  note("c4 e4 g4 b4").sound("triangle").slow(2)\n)',
    aide: "Une basse et une ligne aiguë superposées, à des vitesses différentes.",
  },
  {
    nom: "Moteur du rack",
    code: 'note("<c2 eb2 g2 bb2>").sound("open303").cutoff(900)',
    aide: "Les vingt moteurs DSP sont dans la palette. Ici la TB-303 du rack.",
  },
  {
    nom: "Rack et synthé mêlés",
    code: 'stack(\n  note("c2 [eb2 g2]").sound("mi_plaits"),\n  note("c5 eb5 g5").sound("triangle").slow(2)\n)',
    aide: "Un moteur Eurorack et un synthé intégré, sur la même console.",
  },
  {
    nom: "Filtre balayé",
    code: 'note("c e g b").sound("sawtooth").cutoff(sine.range(200, 3000).slow(4))',
    aide: "Une coupure qui respire — le balayage vient d'une sinusoïde lente.",
  },
];
