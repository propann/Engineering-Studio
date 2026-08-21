/**
 * Toutes les gammes, et leurs familles.
 *
 * Partagé : ce paquet est atteignable depuis le hub ET depuis les studios, ce
 * qui est la condition pour que le sélecteur soit posable ailleurs que dans le
 * rack MIDI.
 *
 * Les degrés sont des demi-tons depuis la tonique, sur une octave. Trier et
 * commencer par 0 n'est pas une convention d'écriture : `quantifier` en dépend,
 * et des tests le verrouillent.
 */

export const GAMMES = {
  // ── Modes de la gamme majeure ──────────────────────────────────────────
  majeure: [0, 2, 4, 5, 7, 9, 11],          // ionien
  dorien: [0, 2, 3, 5, 7, 9, 10],
  phrygien: [0, 1, 3, 5, 7, 8, 10],
  lydien: [0, 2, 4, 6, 7, 9, 11],
  mixolydien: [0, 2, 4, 5, 7, 9, 10],
  mineure: [0, 2, 3, 5, 7, 8, 10],          // éolien
  locrien: [0, 1, 3, 5, 6, 8, 10],

  // ── Mineures altérées ──────────────────────────────────────────────────
  mineure_harmonique: [0, 2, 3, 5, 7, 8, 11],
  mineure_melodique: [0, 2, 3, 5, 7, 9, 11],

  // ── Pentatoniques et blues ─────────────────────────────────────────────
  pentatonique_majeure: [0, 2, 4, 7, 9],
  pentatonique_mineure: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],               // blues mineur
  blues_majeur: [0, 2, 3, 4, 7, 9],

  // ── Symétriques ────────────────────────────────────────────────────────
  chromatique: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  ton_par_ton: [0, 2, 4, 6, 8, 10],
  diminuee_ton_demi: [0, 2, 3, 5, 6, 8, 9, 11],
  diminuee_demi_ton: [0, 1, 3, 4, 6, 7, 9, 10],
  augmentee: [0, 3, 4, 7, 8, 11],

  // ── Du monde ───────────────────────────────────────────────────────────
  japonaise: [0, 1, 5, 7, 8],               // miyako-bushi (« sakura »)
  in_sen: [0, 1, 5, 7, 10],
  hirajoshi: [0, 2, 3, 7, 8],
  kumoi: [0, 2, 3, 7, 9],
  iwato: [0, 1, 5, 6, 10],
  egyptienne: [0, 2, 5, 7, 10],
  double_harmonique: [0, 1, 4, 5, 7, 8, 11], // arabe, byzantine
  hongroise_mineure: [0, 2, 3, 6, 7, 8, 11],
  phrygien_dominant: [0, 1, 4, 5, 7, 8, 10], // espagnole, freygish

  // ── Jazz ───────────────────────────────────────────────────────────────
  alteree: [0, 1, 3, 4, 6, 8, 10],           // super-locrien
  lydien_b7: [0, 2, 4, 6, 7, 9, 10],         // acoustique
  bebop_dominant: [0, 2, 4, 5, 7, 9, 10, 11],
} as const;

export type Gamme = keyof typeof GAMMES;

export const NOMS_GAMMES: Record<Gamme, string> = {
  majeure: "Majeure (ionien)",
  dorien: "Dorien",
  phrygien: "Phrygien",
  lydien: "Lydien",
  mixolydien: "Mixolydien",
  mineure: "Mineure (éolien)",
  locrien: "Locrien",
  mineure_harmonique: "Mineure harmonique",
  mineure_melodique: "Mineure mélodique",
  pentatonique_majeure: "Pentatonique majeure",
  pentatonique_mineure: "Pentatonique mineure",
  blues: "Blues mineur",
  blues_majeur: "Blues majeur",
  chromatique: "Chromatique (aucune contrainte)",
  ton_par_ton: "Ton par ton",
  diminuee_ton_demi: "Diminuée (ton–demi)",
  diminuee_demi_ton: "Diminuée (demi–ton)",
  augmentee: "Augmentée",
  japonaise: "Japonaise (miyako-bushi)",
  in_sen: "In sen",
  hirajoshi: "Hirajoshi",
  kumoi: "Kumoi",
  iwato: "Iwato",
  egyptienne: "Égyptienne",
  double_harmonique: "Double harmonique (arabe)",
  hongroise_mineure: "Hongroise mineure",
  phrygien_dominant: "Phrygien dominant (espagnole)",
  alteree: "Altérée (super-locrien)",
  lydien_b7: "Lydien ♭7 (acoustique)",
  bebop_dominant: "Bebop dominant",
};

/**
 * Familles, pour le sélecteur.
 *
 * Une liste plate de trente gammes est inutilisable : on ne trouve pas
 * « dorien » dans un menu déroulant sans repère. Les familles sont donc de
 * l'information, pas de la décoration — elles disent de quoi chaque gamme est
 * une variante.
 *
 * La chromatique vient en tête parce que c'est « ne rien contraindre » : le
 * premier choix qu'on cherche quand on veut désactiver la quantification.
 */
export const FAMILLES: { nom: string; gammes: Gamme[] }[] = [
  { nom: "Sans contrainte", gammes: ["chromatique"] },
  {
    nom: "Pentatoniques et blues",
    gammes: ["pentatonique_majeure", "pentatonique_mineure", "blues", "blues_majeur"],
  },
  {
    nom: "Modes majeurs",
    gammes: ["majeure", "dorien", "phrygien", "lydien", "mixolydien", "mineure", "locrien"],
  },
  { nom: "Mineures altérées", gammes: ["mineure_harmonique", "mineure_melodique"] },
  {
    nom: "Symétriques",
    gammes: ["ton_par_ton", "diminuee_ton_demi", "diminuee_demi_ton", "augmentee"],
  },
  {
    nom: "Du monde",
    gammes: [
      "japonaise", "in_sen", "hirajoshi", "kumoi", "iwato", "egyptienne",
      "double_harmonique", "hongroise_mineure", "phrygien_dominant",
    ],
  },
  { nom: "Jazz", gammes: ["alteree", "lydien_b7", "bebop_dominant"] },
];

/**
 * Ordre d'affichage, dérivé des familles.
 *
 * Dérivé et non écrit à côté : deux listes divergeraient à la première gamme
 * ajoutée, et la gamme manquante serait simplement absente du menu — sans
 * erreur nulle part.
 */
export const ORDRE_GAMMES: Gamme[] = FAMILLES.flatMap((f) => f.gammes);

/** Noms des douze classes, index = demi-tons depuis do. */
export const NOMS_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
