/**
 * Calculs du rendu d'un échantillon hors ligne.
 *
 * Extraits du rack pour être testables : `OfflineAudioContext` n'existe pas
 * hors navigateur, mais l'arithmétique qui l'entoure, si — et c'est elle qui
 * décide si le fichier produit se termine proprement ou se coupe net.
 */

/** Ce que l'appelant doit programmer sur l'enveloppe, et la longueur à rendre. */
export interface PlanRendu {
  /** Nombre de trames à allouer au contexte hors ligne. */
  trames: number;
  /** Instant où commence la rampe de relâchement, en secondes. */
  debutRelachement: number;
  /** Instant où le son est éteint, en secondes. */
  fin: number;
  /** La durée demandée a-t-elle été raccourcie par la cible ou le moteur ? */
  tronque: boolean;
}

/**
 * Décide de la longueur du rendu et du moment du relâchement.
 *
 * Trois durées entrent en jeu, et les confondre casse le fichier :
 *
 *  - `secondes` : ce que l'utilisateur demande.
 *  - `audibleEnd` : jusqu'où le moteur sonne réellement. Rings s'excite sur une
 *    impulsion de 20 ms mais résonne bien plus longtemps ; clouds, faust et amy
 *    continuent par leurs boucles de retour.
 *  - `RELEASE` : la rampe finale, qui doit tenir DANS le tampon.
 *
 * Sans relâchement programmé, l'enveloppe reste au niveau de sustain jusqu'au
 * dernier échantillon et le fichier se coupe net — un claquement à chaque
 * lecture. C'est le défaut que cette fonction existe pour empêcher.
 */
export function planifierRendu(
  secondes: number,
  audibleEnd: number,
  frequence: number,
  enveloppe: { ATTACK: number; DECAY: number; RELEASE: number }
): PlanRendu {
  const { ATTACK, DECAY, RELEASE } = enveloppe;

  // Une durée absurde ne doit pas produire un tampon absurde.
  const demande = Number.isFinite(secondes) && secondes > 0 ? secondes : 0;
  const naturel = Number.isFinite(audibleEnd) && audibleEnd > 0 ? audibleEnd : demande;

  // On s'arrête au plus court des deux : inutile de rendre du silence après
  // l'extinction du moteur, et inutile de dépasser ce que l'utilisateur veut.
  const fin = Math.min(demande, naturel);

  // Le relâchement ne peut pas commencer avant que l'attaque et la décroissance
  // soient passées, sinon on couperait la note pendant sa montée.
  const debutRelachement = Math.max(ATTACK + DECAY + 0.01, fin - RELEASE);

  // Le tampon doit contenir la rampe entière, d'où le +RELEASE : la calculer
  // sur `fin` seul tronquerait précisément ce qu'on cherche à préserver.
  const longueur = Math.max(debutRelachement + RELEASE, fin);
  const trames = Math.max(1, Math.ceil(longueur * frequence));

  return { trames, debutRelachement, fin, tronque: naturel < demande };
}

/**
 * Nom de fichier pour un échantillon rendu.
 *
 * Sans extension : la cible décide du format, et l'appelant l'ajoute.
 * Les caractères que les systèmes de fichiers refusent sont écartés — un patch
 * peut s'appeler « Bass/Lead » ou porter des accents.
 */
export function nomEchantillon(patch: string, note: string): string {
  const propre = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toUpperCase();
  const base = [propre(patch), propre(note)].filter(Boolean).join("_");
  // Un nom vide produirait un fichier caché, voire un chemin invalide.
  return base || "ECHANTILLON";
}

/** Fréquence d'une note MIDI. 69 = La 440. */
export function frequenceDeNote(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/** Nom lisible d'une note MIDI — « C3 », « F#4 ». */
export function nomDeNote(note: number): string {
  const NOMS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  // L'octave -1 est la convention MIDI : la note 60 est C4 chez Yamaha, C3
  // chez Roland. On suit ici la convention scientifique, où 60 = C4.
  const octave = Math.floor(note / 12) - 1;
  return `${NOMS[((note % 12) + 12) % 12]}${octave}`;
}
