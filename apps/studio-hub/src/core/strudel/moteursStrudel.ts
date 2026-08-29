/**
 * Les vingt moteurs du rack, jouables depuis un motif Strudel.
 *
 * ## Ce que ça débloque
 *
 * `note("c e g").sound("mi_plaits")` — le moteur du rack, piloté par la
 * mini-notation. C'était le ❌ explicite de
 * `docs/specs/DIRECTION_PROJET_ET_INTEGRATIONS.md` : « déclencher les moteurs
 * DSP internes depuis un motif » n'existait pas, et la page orpheline
 * `StrudelLiveStudio.tsx` le promettait pourtant en proposant quatorze appels
 * qui n'auraient rien produit.
 *
 * ## Comment
 *
 * `superdough`, le moteur de son de Strudel, tient un registre de timbres.
 * `registerSound(nom, declencheur)` y ajoute une entrée : le déclencheur
 * reçoit un instant, les contrôles du motif, et rend le nœud à jouer. C'est
 * exactement le contrat de `construireMoteur`, à l'enveloppe près.
 *
 * Rien n'est téléchargé : ce sont les mêmes oscillateurs que dans le rack, et
 * la promesse « aucun échantillon distant » tient toujours.
 *
 * ## Ce qui traverse depuis le motif
 *
 * Un motif Strudel porte ses propres contrôles — `note`, `gain`, `cutoff`,
 * `attack`… `surchargesDepuisMotif` traduit ceux qui ont un équivalent dans
 * les paramètres du rack. Les autres sont ignorés, faute d'équivalent : un
 * `.vowel()` sur `mi_rings` ne veut rien dire.
 *
 * Le reste vient de `PARAMS_DEFAUT`, pour qu'un moteur sonne pareil dans un
 * motif et dans le rack tant qu'on n'a rien réglé.
 */

import {
  PARAMS_DEFAUT,
  construireMoteur,
  type ParamsMoteurs,
} from "../audio/moteurs";
import { MOTEURS_COMPLEMENTAIRES } from "../audio/moteurs";
import type { EnginePluginType } from "../types/audio";

/** Les vingt identifiants, dans l'ordre des deux racks. */
export const MOTEURS_JOUABLES: ReadonlyArray<EnginePluginType> = [
  "mi_plaits", "mi_braids", "mi_rings", "mi_clouds", "mi_elements",
  "dexed_fm", "surge_xt", "zynaddsubfx", "helm", "open303",
  "amsynth", "amy_engine", "pl_synth", "fluidsynth", "faust_dsp",
  ...MOTEURS_COMPLEMENTAIRES,
];

/** Ce qu'un motif Strudel transmet au déclencheur. */
export type ValeurMotif = {
  /** Fréquence déjà résolue par superdough, si le motif en donne une. */
  freq?: number;
  note?: number | string;
  duration?: number;
  gain?: number;
  cutoff?: number;
  resonance?: number;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
};

/**
 * Traduit les contrôles du motif en surcharges de paramètres.
 *
 * Volontairement court. Chaque moteur a ses propres noms — `acidCutoff`,
 * `helmCutoff`, `surgeCutoff`, `amCutoff` — et il n'existe pas de coupure
 * universelle. On ne mappe donc que ce qui a un sens pour TOUS : rien
 * aujourd'hui, hors le volume, que l'enveloppe applique.
 *
 * Faire semblant de router `.cutoff()` vers un seul des quatre donnerait un
 * contrôle qui marche sur un moteur et pas sur les autres — le genre de
 * paramètre inerte que `AudioPluginRack.wiring.test.ts` existe pour empêcher.
 */
export function surchargesDepuisMotif(
  valeur: ValeurMotif,
  moteur: EnginePluginType,
): Partial<ParamsMoteurs> {
  const s: Partial<ParamsMoteurs> = { activeEngine: moteur };
  // `cutoff` a un equivalent nomme dans les quatre moteurs qui en exposent un.
  if (typeof valeur.cutoff === "number") {
    if (moteur === "open303") s.acidCutoff = valeur.cutoff;
    else if (moteur === "helm") s.helmCutoff = valeur.cutoff;
    else if (moteur === "surge_xt") s.surgeCutoff = valeur.cutoff;
    else if (moteur === "amsynth") s.amCutoff = valeur.cutoff;
    else if (moteur === "faust_dsp") s.faustFilter = valeur.cutoff;
  }
  if (typeof valeur.resonance === "number") {
    if (moteur === "open303") s.acidResonance = valeur.resonance;
    else if (moteur === "surge_xt") s.surgeReso = valeur.resonance;
    else if (moteur === "amsynth") s.amReso = valeur.resonance;
    else if (moteur === "zynaddsubfx") s.zynReso = valeur.resonance;
  }
  return s;
}

/** L'enveloppe par défaut de superdough, reprise pour ne pas détonner. */
const ADSR_DEFAUT = { attack: 0.001, decay: 0.05, sustain: 0.6, release: 0.01 };

/** Ce qu'un déclencheur doit rendre à superdough. */
export type VoixStrudel = {
  node: AudioNode;
  stop: (fin: number) => void;
};

/**
 * Construit une voix pour superdough.
 *
 * Exportée séparément de l'enregistrement pour être testable : monter tout
 * Strudel dans un test pour vérifier qu'un moteur se branche n'aurait pas de
 * sens, alors qu'un contexte factice suffit.
 */
export function construireVoixStrudel(
  ctx: BaseAudioContext,
  moteur: EnginePluginType,
  t: number,
  valeur: ValeurMotif,
  reverb: AudioNode | null = null,
): VoixStrudel {
  const sources: AudioScheduledSourceNode[] = [];
  let finNaturelle = t + 0.3;

  const sortie = ctx.createGain();
  const enveloppe = ctx.createGain();

  const p: ParamsMoteurs = {
    ...PARAMS_DEFAUT,
    ...surchargesDepuisMotif(valeur, moteur),
    activeEngine: moteur,
  };

  const aide = {
    trk: <T extends AudioScheduledSourceNode>(n: T): T => {
      sources.push(n);
      return n;
    },
    noteStop: (n: AudioScheduledSourceNode, quand: number) => {
      finNaturelle = Math.max(finNaturelle, quand);
      n.stop(quand);
    },
    holdUntil: (quand: number) => {
      finNaturelle = Math.max(finNaturelle, quand);
    },
    reverb,
  };

  construireMoteur(ctx, p, frequence(valeur), t, aide, sortie);

  /**
   * L'enveloppe est appliquée ICI, pas dans le moteur.
   *
   * Les moteurs ne l'appliquent jamais : dans le rack c'est `construireVoix`
   * qui s'en charge, et pour Strudel c'est nous. Sans elle, chaque note
   * commencerait et finirait par une discontinuité — un clic à chaque
   * événement du motif, c'est-à-dire en permanence.
   *
   * Les rampes ne passent pas par zéro : `exponentialRampToValueAtTime` le
   * refuse, d'où le plancher.
   */
  const a = Math.max(0.001, valeur.attack ?? ADSR_DEFAUT.attack);
  const d = Math.max(0.001, valeur.decay ?? ADSR_DEFAUT.decay);
  const s = Math.min(1, Math.max(0.0001, valeur.sustain ?? ADSR_DEFAUT.sustain));
  const r = Math.max(0.001, valeur.release ?? ADSR_DEFAUT.release);
  const volume = Math.max(0.0001, valeur.gain ?? 0.6);

  enveloppe.gain.setValueAtTime(0.0001, t);
  enveloppe.gain.exponentialRampToValueAtTime(volume, t + a);
  enveloppe.gain.exponentialRampToValueAtTime(volume * s, t + a + d);

  sortie.connect(enveloppe);

  return {
    node: enveloppe,
    stop: (fin: number) => {
      const arret = Math.max(fin, t + a + d);
      try {
        enveloppe.gain.cancelScheduledValues(arret);
        enveloppe.gain.setValueAtTime(Math.max(0.0001, volume * s), arret);
        enveloppe.gain.exponentialRampToValueAtTime(0.0001, arret + r);
      } catch {
        /* une valeur deja passee n'a rien a annuler */
      }
      for (const src of sources) {
        // Une source deja arretee leve : c'est le cas normal quand le moteur
        // a programme sa propre fin plus tot que le motif.
        try {
          src.stop(arret + r);
        } catch {
          /* deja arretee */
        }
      }
    },
  };
}

/** La fréquence de la note, avec un la 440 par défaut. */
function frequence(valeur: ValeurMotif): number {
  if (typeof valeur.freq === "number" && Number.isFinite(valeur.freq)) return valeur.freq;
  if (typeof valeur.note === "number" && Number.isFinite(valeur.note)) {
    return 440 * Math.pow(2, (valeur.note - 69) / 12);
  }
  return 440;
}

/** Ce que le module Strudel doit exposer pour qu'on s'y enregistre. */
export type ApiEnregistrement = {
  registerSound: (
    nom: string,
    declencheur: (t: number, valeur: ValeurMotif, termine: () => void) => VoixStrudel,
    donnees?: Record<string, unknown>,
  ) => void;
};

/**
 * Enregistre les vingt moteurs auprès de superdough.
 *
 * Appelé une fois, après `initStrudel`. Rend la liste des noms enregistrés —
 * l'interface s'en sert pour les annoncer, plutôt que d'en tenir une seconde
 * copie qui divergerait.
 */
export function enregistrerMoteurs(
  api: ApiEnregistrement,
  ctx: () => BaseAudioContext,
  reverb: () => AudioNode | null,
): string[] {
  const enregistres: string[] = [];
  for (const moteur of MOTEURS_JOUABLES) {
    try {
      api.registerSound(
        moteur,
        (t, valeur, termine) => {
          const voix = construireVoixStrudel(ctx(), moteur, t, valeur, reverb());
          // superdough attend d'etre prevenu : sans cet appel, il considere la
          // voix vivante indefiniment et cesse d'en allouer de nouvelles.
          const duree = typeof valeur.duration === "number" ? valeur.duration : 0.25;
          setTimeout(termine, Math.max(50, (duree + 1.5) * 1000));
          return voix;
        },
        { type: "synth" },
      );
      enregistres.push(moteur);
    } catch {
      // Un nom refuse par superdough ne doit pas empecher les dix-neuf autres.
    }
  }
  return enregistres;
}
