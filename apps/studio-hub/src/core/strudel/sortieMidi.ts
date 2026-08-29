/**
 * Jouer les machines depuis un motif Strudel.
 *
 * ## Ce que ça fait, et ce que ça ne fait pas
 *
 * **Ça fait** : envoyer des notes MIDI à l'OP‑1 ou à l'EP‑133, en direct, au
 * rythme du motif. La machine joue ses propres sons — c'est elle le
 * synthétiseur, Strudel n'est que le séquenceur.
 *
 * **Ça ne fait pas** : écrire quoi que ce soit dans la mémoire d'une machine.
 * Pas de patch, pas d'échantillon, pas de dossier. Une note MIDI est un
 * message qui disparaît une fois joué ; le rack ne peut rien abîmer avec ça.
 * C'est la distinction que le rack tient depuis toujours, et qu'il continue de
 * tenir maintenant qu'il parle aux machines.
 *
 * ## Pourquoi la batterie vient de là
 *
 * Le rack ne charge aucun échantillon distant : `bd`, `sd`, `hh` du Strudel
 * officiel sont sur GitHub, et n'arriveront pas. Hors ligne il ne reste qu'un
 * `sbd` synthétisé et quatre bruits colorés — de quoi esquisser un rythme, pas
 * une boîte à rythmes.
 *
 * L'EP‑133 en est une, posée sur le bureau. Lui envoyer le motif donne de
 * vraies percussions sans qu'un octet sorte du réseau. Le manque et la
 * solution se répondent.
 *
 * ## Deux bibliothèques MIDI dans la même page
 *
 * `@strudel/midi` embarque `webmidi`, qui appelle `navigator.requestMIDIAccess`
 * pour son compte. Le Hub a déjà son répartiteur, `@studio-hub/midi-dispatch`.
 * Les deux coexistent : le navigateur rend le même accès à tout appelant, et
 * les sorties sont des objets distincts mais interchangeables à l'émission.
 *
 * Le partage des rôles est délibéré :
 *
 * - **L'énumération** passe par le répartiteur du Hub. Le rack affiche donc la
 *   même liste de machines que le reste de l'atelier ; deux inventaires
 *   divergents seraient impossibles à diagnostiquer.
 * - **Le flux de notes** passe par `.midi()` de Strudel. Le réécrire au-dessus
 *   du répartiteur signifierait réimplémenter l'ordonnancement à l'échantillon
 *   près, ce que Strudel fait déjà correctement.
 * - **Le PANIC** passe par le répartiteur, avec les mêmes paquets que
 *   `MidiSyncPanel`. Un arrêt d'urgence doit couper ce que les DEUX chemins ont
 *   pu déclencher.
 */

import { buildMidiPanicPackets } from "@studio-hub/midi-bridge";
import { sorties } from "@studio-hub/midi-dispatch";

/** Une destination possible pour un motif. */
export type Machine = {
  /** Le nom exact du port, tel que `.midi("…")` l'attend. */
  nom: string;
  /** Nom raccourci pour l'affichage, quand le port est verbeux. */
  etiquette: string;
  /** Machine reconnue du parc, ou port MIDI quelconque. */
  connue: "op1" | "ep133" | null;
};

/**
 * Reconnaît une machine du parc à son nom de port.
 *
 * Les noms varient selon le système — « OP-1 », « OP-1 MIDI 1 »,
 * « Teenage Engineering OP-1 » — donc on cherche une sous-chaîne plutôt qu'une
 * égalité. L'EP‑133 s'annonce aussi comme « K.O. II », son nom commercial.
 */
export function reconnaitre(nomPort: string): Machine["connue"] {
  const n = nomPort.toLowerCase();
  if (n.includes("op-1") || n.includes("op1")) return "op1";
  if (n.includes("ep-133") || n.includes("ep133") || n.includes("k.o. ii") || n.includes("ko ii")) {
    return "ep133";
  }
  return null;
}

/** Raccourcit un nom de port trop long pour un bouton. */
export function etiqueter(nomPort: string): string {
  const connue = reconnaitre(nomPort);
  if (connue === "op1") return "OP-1";
  if (connue === "ep133") return "EP-133";
  return nomPort.length > 24 ? `${nomPort.slice(0, 23)}…` : nomPort;
}

/**
 * Les machines joignables.
 *
 * Rend une liste vide plutôt que de lever si le MIDI est refusé ou absent :
 * l'atelier doit rester utilisable au casque, sans machine branchée.
 */
export async function machinesDisponibles(): Promise<Machine[]> {
  try {
    const ports = await sorties();
    return ports.map((p) => ({
      nom: p.name ?? "",
      etiquette: etiqueter(p.name ?? ""),
      connue: reconnaitre(p.name ?? ""),
    })).filter((m) => m.nom.length > 0);
  } catch {
    return [];
  }
}

/**
 * L'appel à coller dans le code pour router un motif vers une machine.
 *
 * On produit du texte que l'utilisateur voit et peut modifier, plutôt que de
 * router en douce : le motif reste la seule source de vérité de ce qui joue.
 * Un routage invisible se serait fait oublier, puis aurait surpris.
 *
 * Le nom du port est mis entre guillemets simples, comme dans la
 * documentation de Strudel, et les guillemets qu'il contiendrait sont
 * échappés — certains pilotes Windows nomment leurs ports avec des
 * apostrophes.
 */
export function appelMidi(machine: Machine, canal = 1): string {
  const port = machine.nom.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `.midi('${port}').midichan(${canal})`;
}

/**
 * Insère l'appel MIDI à la fin de la première expression du code.
 *
 * Volontairement simple : on ajoute en fin de code plutôt que de tenter de
 * comprendre l'arbre syntaxique. Une insertion « intelligente » qui se trompe
 * est pire qu'une insertion prévisible que l'utilisateur déplace.
 */
export function ajouterSortie(code: string, machine: Machine, canal = 1): string {
  const appel = appelMidi(machine, canal);
  if (code.includes(appel)) return code;
  const propre = code.replace(/;?\s*$/, "");
  /**
   * Pas de point-virgule final.
   *
   * Il en fallait un tant que l'appel terminait une instruction, mais
   * `retirerSorties` ne l'emportait pas avec lui : un aller-retour laissait
   * `note("c");` là où l'on avait écrit `note("c")`. Chaque branchement puis
   * débranchement ajoutait ainsi une trace dans le code de l'utilisateur.
   *
   * Strudel n'en demande pas, et son absence rend l'opération exactement
   * réversible — ce que le test d'aller-retour verrouille.
   */
  return `${propre}\n  ${appel}\n`;
}

/** Retire tout routage MIDI du code, quel que soit le port visé. */
export function retirerSorties(code: string): string {
  return code
    .replace(/\s*\.midi\((['"`])(?:\\.|(?!\1)[^\\])*\1\)(\s*\.midichan\(\s*\d+\s*\))?/g, "")
    .replace(/\n{3,}/g, "\n\n")
    // Le retrait peut laisser une ligne d'indentation seule là où l'appel
    // était posé : on la reprend, sinon le code gagne une ligne vide à chaque
    // débranchement.
    .replace(/\n[ \t]+$/, "\n");
}

/** Le code route-t-il déjà vers une machine ? */
export function routeVersMachine(code: string): boolean {
  return /\.midi\(\s*['"`]/.test(code);
}

/**
 * Coupe toutes les notes de toutes les machines.
 *
 * Les mêmes paquets que le PANIC de `MidiSyncPanel` : `all notes off` et
 * `all sound off` sur les seize canaux. Sans cela, arrêter Strudel pendant une
 * note tenue laisserait la machine sonner indéfiniment — le `hush()` de
 * Strudel ne coupe que SON audio, il ignore ce qui est parti en MIDI.
 *
 * Ne lève jamais : un PANIC qui échoue à cause d'une machine débranchée doit
 * quand même atteindre les autres.
 */
export async function panicMachines(): Promise<number> {
  let touchees = 0;
  try {
    const ports = await sorties();
    const paquets = buildMidiPanicPackets(performance.now());
    for (const port of ports) {
      try {
        for (const paquet of paquets) port.send(paquet.data, paquet.timestamp);
        touchees += 1;
      } catch {
        // Une machine peut disparaître entre l'énumération et l'envoi.
      }
    }
  } catch {
    // Pas d'accès MIDI du tout : il n'y a rien à couper.
  }
  return touchees;
}
