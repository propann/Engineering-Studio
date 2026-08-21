/**
 * Arpèges et quantification — la logique du rack MIDI.
 *
 * Séparation des métiers : le rack MIDI **produit les notes**, le rack de
 * moteurs en fait du son, le rack d'effets le traite. Un arpégiateur posé dans
 * le rack de moteurs n'arpégerait que lui ; ici, il arpège tout ce qui écoute
 * — le rack, l'OP-1, l'EP-133, et n'importe quelle machine branchée.
 *
 * Tout est pur : aucun accès au MIDI, aucune horloge, aucun état. C'est le
 * panneau qui possède le tempo et l'envoi.
 */
import { GAMMES, type Gamme } from "./gammes";

export const NOTE_MIN = 0;
export const NOTE_MAX = 127;

/**
 * Ramène une note au degré le plus proche de la gamme.
 *
 * Le repli à l'octave compte : un si dans une pentatonique majeure de do est
 * à 2 demi-tons du la, mais à 1 seul du do au-dessus. Ignorer ce cas ferait
 * descendre toutes les sensibles, ce qui s'entend.
 *
 * **En cas d'égalité, on descend.** Choix arbitraire mais fixe : sans règle,
 * le résultat dépendrait de l'ordre de déclaration des degrés.
 */
export function quantifier(note: number, tonique: number, gamme: Gamme): number {
  const degres = GAMMES[gamme];
  const ecart = note - tonique;
  const classe = ((ecart % 12) + 12) % 12;
  const octave = Math.floor(ecart / 12);

  // Annoté : `as const` sur GAMMES infère le type littéral `0` pour le premier
  // degré, ce qui interdirait toute réaffectation.
  let meilleur: number = degres[0];
  let distance = Math.abs(degres[0] - classe);
  for (const d of degres) {
    const dd = Math.abs(d - classe);
    if (dd < distance) {
      distance = dd;
      meilleur = d;
    }
  }

  // Le premier degré de l'octave suivante peut être plus proche.
  let resultat = tonique + octave * 12 + meilleur;
  if (Math.abs(12 + degres[0] - classe) < distance) {
    resultat = tonique + octave * 12 + 12 + degres[0];
  }
  return Math.max(NOTE_MIN, Math.min(NOTE_MAX, resultat));
}

export type Motif = "haut" | "bas" | "haut-bas" | "bas-haut" | "aleatoire" | "accord";

export const ORDRE_MOTIFS: Motif[] = ["haut", "bas", "haut-bas", "bas-haut", "aleatoire", "accord"];

export const NOMS_MOTIFS: Record<Motif, string> = {
  haut: "↑ Montant",
  bas: "↓ Descendant",
  "haut-bas": "↕ Montant-descendant",
  "bas-haut": "↕ Descendant-montant",
  aleatoire: "⚄ Aléatoire",
  accord: "▦ Accord",
};

/**
 * Le réservoir de notes : les notes tenues, triées, répétées sur `octaves`.
 *
 * Trié parce que « montant » doit monter, quel que soit l'ordre dans lequel
 * les doigts se sont posés.
 */
export function reservoir(notesTenues: number[], octaves: number): number[] {
  const oct = Math.max(1, Math.min(4, Math.floor(octaves)));
  const base = [...new Set(notesTenues)].sort((a, b) => a - b);
  const sortie: number[] = [];
  for (let o = 0; o < oct; o++) {
    for (const n of base) {
      const t = n + 12 * o;
      if (t <= NOTE_MAX) sortie.push(t);
    }
  }
  return sortie;
}

/**
 * Les notes du pas `index`.
 *
 * Rend un tableau : « accord » en joue plusieurs, les autres une seule. Un
 * tableau vide quand rien n'est tenu — l'appelant n'a alors rien à envoyer.
 */
export function pasArpege(
  notesTenues: number[],
  motif: Motif,
  index: number,
  octaves = 1,
  tirage: () => number = Math.random
): number[] {
  const pool = reservoir(notesTenues, octaves);
  if (pool.length === 0) return [];
  if (motif === "accord") return pool;
  if (pool.length === 1) return [pool[0]];

  const n = pool.length;
  const i = Math.floor(index);

  // Modulo qui rend toujours un résultat positif, pour accepter un index
  // négatif. Un premier jet normalisait l'index en lui ajoutant
  // Number.MAX_SAFE_INTEGER avant le modulo : l'addition sortait de la plage
  // représentable et l'index 2 devenait 1. Le garde-fou cassait le cas
  // ordinaire — c'est exactement ce que les tests ont attrapé.
  const mod = (a: number, m: number) => ((a % m) + m) % m;

  switch (motif) {
    case "haut":
      return [pool[mod(i, n)]];
    case "bas":
      return [pool[n - 1 - mod(i, n)]];
    case "haut-bas": {
      // 2n-2 et non 2n : sans cela les extrémités sonnent deux fois de suite.
      // Sur do-mi-sol on veut do mi sol mi, pas do mi sol sol mi do.
      const cycle = 2 * n - 2;
      const j = mod(i, cycle);
      return [j < n ? pool[j] : pool[cycle - j]];
    }
    case "bas-haut": {
      const cycle = 2 * n - 2;
      const j = mod(i, cycle);
      return [j < n ? pool[n - 1 - j] : pool[j - n + 1]];
    }
    case "aleatoire":
      return [pool[Math.min(n - 1, Math.max(0, Math.floor(tirage() * n)))]];
  }
}
