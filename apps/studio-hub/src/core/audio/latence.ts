/**
 * Decomposition de la latence d'une note MIDI, du message recu jusqu'au son.
 *
 * Extrait du rack pour etre testable : ce sont des fonctions pures, alors que
 * le gestionnaire MIDI qui les appelle ne l'est pas.
 *
 * Le transport en amont — de la machine au navigateur — a ete mesure hors
 * navigateur : 16,7 µs par message en salve de 19 notes, 7 µs de mediane entre
 * messages consecutifs (voir docs/MESURE_LATENCE_MIDI.md). Il est negligeable
 * devant les 20 ms visees, ce qui fait des trois segments ci-dessous le budget
 * reel.
 */

export type SegmentsLatence = {
  /** Du message recu par le navigateur a l'entree du gestionnaire. */
  file: number;
  /** Temps passe a construire le graphe audio et programmer les evenements. */
  traitement: number;
  /** Memoire tampon audio : baseLatency + outputLatency. Irreductible ici. */
  sortie: number;
  /** Somme des trois. */
  total: number;
};

/**
 * `MIDIMessageEvent.timeStamp` partage l'horloge de `performance.now()`.
 *
 * Mais tous les navigateurs ne le renseignent pas : certains rendent 0. Le
 * traiter comme un instant valide donnerait une attente egale a la duree
 * ecoulee depuis le chargement de la page — des dizaines de secondes affichees
 * comme de la latence.
 *
 * Un horodatage posterieur a l'entree est tout aussi suspect : on ne peut pas
 * etre entre dans le gestionnaire avant d'avoir recu le message.
 */
export function attenteFile(tEntree: number, tMessage: number | undefined | null): number {
  if (typeof tMessage !== "number" || !Number.isFinite(tMessage) || tMessage <= 0) return 0;
  const attente = tEntree - tMessage;
  return attente > 0 ? attente : 0;
}

/** Assemble les trois segments. Les valeurs negatives ou aberrantes sont ramenees a 0. */
export function composerLatence(file: number, traitement: number, sortieSecondes: number): SegmentsLatence {
  const sain = (x: number) => (Number.isFinite(x) && x > 0 ? x : 0);
  const f = sain(file);
  const t = sain(traitement);
  const s = sain(sortieSecondes) * 1000;
  return { file: f, traitement: t, sortie: s, total: f + t + s };
}

/**
 * Mediane d'un historique borne, apres ajout d'une valeur.
 *
 * Mediane et non moyenne : le fil principal fait aussi tourner React et le
 * ramasse-miettes. Un pic ponctuel a 30 ms tirerait une moyenne vers le haut
 * et ferait conclure a tort que le rack est lent. C'est le meme piege que sur
 * la mesure hors navigateur, ou la moyenne valait 94 µs pour une mediane de 7.
 *
 * MUTE `historique` — l'appelant garde un tableau vivant dans une ref, et on
 * evite une allocation par note sur le fil qui programme l'audio.
 */
export function ajouterEtMedianer(historique: number[], valeur: number, maximum = 40): number {
  historique.push(valeur);
  while (historique.length > maximum) historique.shift();
  const trie = [...historique].sort((a, b) => a - b);
  const n = trie.length;
  // Longueur paire : moyenne des deux valeurs centrales, sinon la mediane
  // sauterait d'un echantillon a l'autre a chaque note.
  return n % 2 === 1 ? trie[(n - 1) / 2] : (trie[n / 2 - 1] + trie[n / 2]) / 2;
}

/** Libelle affiche dans le bandeau de diagnostic. */
export function libelleLatence(s: SegmentsLatence, mediane: number, echantillons: number): string {
  return (
    `${mediane.toFixed(1)} ms méd. · file ${s.file.toFixed(1)} · ` +
    `trait. ${s.traitement.toFixed(1)} · sortie ${s.sortie.toFixed(1)} (n=${echantillons})`
  );
}
