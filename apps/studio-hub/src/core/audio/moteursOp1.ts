/**
 * Les moteurs que l'OP-1 a dans le ventre.
 *
 * ## Pourquoi ils arrivent ici
 *
 * `op1SynthEngine.ts` declare onze moteurs natifs. Cinq avaient une voix
 * propre — FM, Cluster, Pulse, String, Drum. Les SIX autres — Digital, Iter,
 * Sampler, Phase, DNA, Voltage — tombaient dans un repli generique : deux
 * oscillateurs et un filtre. Ils sonnaient donc tous pareil, seul le nom
 * changeait a l'ecran.
 *
 * C'est le meme defaut que celui des treize moteurs du rack, corrige plus tot.
 * Ceux-la manquaient d'une synthese ; ceux-ci en partageaient une seule.
 *
 * ## Pourquoi dans le Hub et pas dans op1-studio
 *
 * Parce qu'ils doivent etre jouables PARTOUT, comme les vingt du rack : depuis
 * le clavier de l'OP-1, depuis un motif Strudel, depuis les outils
 * d'echantillon. Les laisser dans l'application OP-1 les y enfermerait — c'est
 * exactement ce qui vient d'etre defait pour les autres.
 *
 * Meme contrat que `moteurs.ts` : la fonction recoit son contexte et rend son
 * noeud de sortie. Elle ne connecte rien a une destination.
 *
 * ## Ce que ces moteurs sont
 *
 * Les vrais moteurs de l'OP-1 sont proprietaires : personne n'en a le code.
 * Ce sont donc des syntheses DE LA MEME FAMILLE, bâties sur ce que la
 * documentation et l'ecoute decrivent, et chaque commentaire dit sur quoi il
 * se fonde. Aucune n'est une emulation, et aucune ne pretend l'etre.
 */

import { buildBitcrushCurve, buildPulseWave } from "./dsp";
import type { AideVoix } from "./moteurs";

/** Les six moteurs natifs qui manquaient d'une voix propre. */
export const MOTEURS_OP1 = [
  "op1_digital",
  "op1_iter",
  "op1_phase",
  "op1_dna",
  "op1_voltage",
] as const;

export type MoteurOp1 = (typeof MOTEURS_OP1)[number];

export type ParamsOp1 = {
  /** Timbre principal, en pourcentage. Le potentiometre bleu de la machine. */
  op1Timbre: number;
  /** Deuxieme axe : coupure, ecart ou index selon le moteur. */
  op1Forme: number;
  /** Mouvement : vitesse d'iteration, de balayage ou de derive. */
  op1Mouvement: number;
  /** Longueur de la decroissance, en pourcentage. */
  op1Decay: number;
};

const borne = (v: number, min: number, max: number): number =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;

/* ======================================================================== *
 * DIGITAL — la reduction de resolution comme timbre
 * ======================================================================== */

/**
 * Digital.
 *
 * Le moteur « digital » de l'OP-1 est decrit par sa documentation comme un
 * son deliberement numerique : quantifie, aliase, assume. On le construit
 * donc a l'envers d'un synthe analogique — pas de filtre qui adoucit, mais
 * une reduction de resolution qui durcit.
 *
 * Une dent de scie passe dans un quantificateur dont le nombre de marches
 * suit le timbre. Peu de marches : le son se casse en escalier et gagne des
 * harmoniques qui n'ont aucun rapport avec la fondamentale. C'est le bruit de
 * quantification, et c'est ici le sujet.
 */
function digital(
  ctx: BaseAudioContext,
  p: ParamsOp1,
  freq: number,
  now: number,
  aide: AideVoix,
): AudioNode {
  const sortie = ctx.createGain();
  const osc = aide.trk(ctx.createOscillator());
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(freq, now);

  const crush = ctx.createWaveShaper();
  // 16 bits = transparent, 2 = destruction. Le timbre parcourt l'intervalle
  // a l'envers : plus on monte, moins il reste de marches.
  const bits = Math.round(16 - (borne(p.op1Timbre, 0, 100) / 100) * 13);
  crush.curve = buildBitcrushCurve(bits);
  crush.oversample = "2x";

  // Un passe-haut leger : la quantification ajoute une composante continue
  // qui, sans lui, deplace tout le signal vers le haut et mange la dynamique.
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.setValueAtTime(40, now);

  const duree = 0.15 + (borne(p.op1Decay, 0, 100) / 100) * 1.6;
  osc.connect(crush);
  crush.connect(hp);
  hp.connect(sortie);
  osc.start(now);
  aide.noteStop(osc, now + duree);
  aide.holdUntil(now + duree + 0.05);
  return sortie;
}

/* ======================================================================== *
 * ITER — la meme note, repetee de plus en plus vite
 * ======================================================================== */

/**
 * Iter.
 *
 * « Iter » repete la note pendant qu'elle sonne, en accelerant ou en
 * ralentissant. Ce n'est pas un arpege — la hauteur ne bouge pas — mais un
 * redeclenchement rythmique, comme un roulement.
 *
 * On l'obtient par un LFO carre branche sur le gain : chaque creneau coupe le
 * son, chaque plateau le laisse passer. Le carre plutot qu'une sinusoide
 * parce que la coupure doit etre franche, sinon on entend un tremolo.
 */
function iter(
  ctx: BaseAudioContext,
  p: ParamsOp1,
  freq: number,
  now: number,
  aide: AideVoix,
): AudioNode {
  const sortie = ctx.createGain();
  const osc = aide.trk(ctx.createOscillator());
  osc.type = borne(p.op1Timbre, 0, 100) > 50 ? "square" : "sawtooth";
  osc.frequency.setValueAtTime(freq, now);

  const porte = ctx.createGain();
  porte.gain.setValueAtTime(0.5, now);

  const lfo = aide.trk(ctx.createOscillator());
  lfo.type = "square";
  // De 2 a 24 repetitions par seconde : en dessous on compte les coups, au
  // dessus le grain devient une hauteur a lui seul.
  lfo.frequency.setValueAtTime(2 + (borne(p.op1Mouvement, 0, 100) / 100) * 22, now);
  const ampleur = ctx.createGain();
  ampleur.gain.setValueAtTime(0.5, now);
  lfo.connect(ampleur);
  ampleur.connect(porte.gain);
  lfo.start(now);

  const filtre = ctx.createBiquadFilter();
  filtre.type = "lowpass";
  filtre.frequency.setValueAtTime(400 + (borne(p.op1Forme, 0, 100) / 100) * 7000, now);

  const duree = 0.3 + (borne(p.op1Decay, 0, 100) / 100) * 2;
  osc.connect(filtre);
  filtre.connect(porte);
  porte.connect(sortie);
  osc.start(now);
  aide.noteStop(osc, now + duree);
  aide.noteStop(lfo, now + duree);
  aide.holdUntil(now + duree + 0.05);
  return sortie;
}

/* ======================================================================== *
 * PHASE — deux oscillateurs qui derivent l'un par rapport a l'autre
 * ======================================================================== */

/**
 * Phase.
 *
 * Deux oscillateurs identiques a la meme frequence, dont l'un derive
 * lentement. Leur somme passe par tous les etats entre l'addition et
 * l'annulation : le timbre respire sans qu'aucun filtre ne bouge.
 *
 * C'est le principe du phasing, et il tient a une seule chose — l'ecart doit
 * etre TRES petit. A un demi-hertz on entend deux notes ; a un centieme, on
 * entend une note qui vit.
 */
function phase(
  ctx: BaseAudioContext,
  p: ParamsOp1,
  freq: number,
  now: number,
  aide: AideVoix,
): AudioNode {
  const sortie = ctx.createGain();
  const somme = ctx.createGain();
  somme.gain.setValueAtTime(0.5, now);

  const derive = (borne(p.op1Mouvement, 0, 100) / 100) * 0.6;
  for (const decalage of [0, derive]) {
    const osc = aide.trk(ctx.createOscillator());
    osc.type = borne(p.op1Timbre, 0, 100) > 50 ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(freq + decalage, now);
    osc.connect(somme);
    osc.start(now);
    aide.noteStop(osc, now + 0.4 + (borne(p.op1Decay, 0, 100) / 100) * 3);
  }

  const filtre = ctx.createBiquadFilter();
  filtre.type = "lowpass";
  filtre.frequency.setValueAtTime(600 + (borne(p.op1Forme, 0, 100) / 100) * 6000, now);
  somme.connect(filtre);
  filtre.connect(sortie);
  aide.holdUntil(now + 0.5 + (borne(p.op1Decay, 0, 100) / 100) * 3);
  return sortie;
}

/* ======================================================================== *
 * DNA — une pile d'harmoniques dont la forme evolue
 * ======================================================================== */

/**
 * DNA.
 *
 * Synthese additive : une pile d'harmoniques dont les amplitudes suivent une
 * courbe, et dont les rangs impairs sont attenues ou renforces selon le
 * timbre. Renforcer les impairs donne un son creux, proche d'une clarinette ;
 * les attenuer donne un son plein.
 *
 * Le nombre de partiels est borne a douze : au-dela, chaque note coute une
 * douzaine d'oscillateurs de plus pour une difference qu'on n'entend pas, et
 * la polyphonie s'effondre avant l'oreille.
 */
function dna(
  ctx: BaseAudioContext,
  p: ParamsOp1,
  freq: number,
  now: number,
  aide: AideVoix,
): AudioNode {
  const sortie = ctx.createGain();
  const somme = ctx.createGain();
  const partiels = 3 + Math.round((borne(p.op1Forme, 0, 100) / 100) * 9);
  somme.gain.setValueAtTime(0.4 / Math.sqrt(partiels), now);

  const creux = borne(p.op1Timbre, 0, 100) / 100;
  const duree = 0.4 + (borne(p.op1Decay, 0, 100) / 100) * 2.5;

  for (let rang = 1; rang <= partiels; rang += 1) {
    const f = freq * rang;
    // Un partiel au-dela de Nyquist se replierait en une frequence grave
    // parasite — un sifflement qu'on n'explique pas.
    if (f >= ctx.sampleRate / 2) break;
    const osc = aide.trk(ctx.createOscillator());
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, now);

    const g = ctx.createGain();
    const impair = rang % 2 === 1;
    // Decroissance en 1/rang, la pente naturelle d'une dent de scie, puis
    // le timbre penche vers les impairs ou les pairs.
    const niveau = (1 / rang) * (impair ? 0.4 + creux * 0.6 : 1 - creux * 0.7);
    g.gain.setValueAtTime(Math.max(0.0001, niveau), now);
    // Les partiels hauts s'eteignent avant les bas : c'est ce qui fait
    // entendre une note qui s'assombrit plutot qu'un accord qui s'arrete.
    g.gain.exponentialRampToValueAtTime(0.0001, now + duree / Math.sqrt(rang));

    osc.connect(g);
    g.connect(somme);
    osc.start(now);
    aide.noteStop(osc, now + duree);
  }

  somme.connect(sortie);
  aide.holdUntil(now + duree + 0.1);
  return sortie;
}

/* ======================================================================== *
 * VOLTAGE — la largeur d'impulsion balayee
 * ======================================================================== */

/**
 * Voltage.
 *
 * Une impulsion dont la largeur est balayee pendant la note. C'est la
 * modulation de largeur d'impulsion, le geste le plus reconnaissable des
 * synthetiseurs a tension de commande — d'ou le nom.
 *
 * `OscillatorNode` ne sait pas faire varier un rapport cyclique : son type
 * `square` est fige a 50 %. On fabrique donc plusieurs ondes de Fourier a des
 * largeurs differentes et l'on passe de l'une a l'autre pendant la note. La
 * transition est discrete, non continue — c'est la limite du procede, et elle
 * s'entend a peine au-dela de six paliers.
 */
function voltage(
  ctx: BaseAudioContext,
  p: ParamsOp1,
  freq: number,
  now: number,
  aide: AideVoix,
): AudioNode {
  const sortie = ctx.createGain();
  const osc = aide.trk(ctx.createOscillator());
  osc.frequency.setValueAtTime(freq, now);

  const largeurDepart = 10 + (borne(p.op1Timbre, 0, 100) / 100) * 40;
  osc.setPeriodicWave(buildPulseWave(ctx, largeurDepart));

  const duree = 0.3 + (borne(p.op1Decay, 0, 100) / 100) * 2;
  const paliers = 6;
  const amplitude = (borne(p.op1Mouvement, 0, 100) / 100) * 35;
  for (let i = 1; i <= paliers; i += 1) {
    const t = now + (duree * i) / paliers;
    const largeur = Math.min(90, Math.max(5, largeurDepart + Math.sin(i) * amplitude));
    // `setPeriodicWave` n'est pas programmable dans le temps : on planifie le
    // changement nous-memes. Un contexte hors ligne ignore setTimeout, d'ou
    // le repli sur la valeur de depart pour le rendu.
    if (typeof setTimeout === "function" && "currentTime" in ctx) {
      const delai = (t - ctx.currentTime) * 1000;
      if (delai > 0 && delai < 30_000) {
        setTimeout(() => {
          try {
            osc.setPeriodicWave(buildPulseWave(ctx, largeur));
          } catch {
            /* la note peut etre finie */
          }
        }, delai);
      }
    }
  }

  const filtre = ctx.createBiquadFilter();
  filtre.type = "lowpass";
  filtre.frequency.setValueAtTime(500 + (borne(p.op1Forme, 0, 100) / 100) * 7000, now);
  osc.connect(filtre);
  filtre.connect(sortie);
  osc.start(now);
  aide.noteStop(osc, now + duree);
  aide.holdUntil(now + duree + 0.05);
  return sortie;
}

/** Les cinq constructeurs, par identifiant. */
const CONSTRUCTEURS: Record<
  MoteurOp1,
  (ctx: BaseAudioContext, p: ParamsOp1, freq: number, now: number, aide: AideVoix) => AudioNode
> = {
  op1_digital: digital,
  op1_iter: iter,
  op1_phase: phase,
  op1_dna: dna,
  op1_voltage: voltage,
};

/** Ce moteur a-t-il une voix ici ? */
export function estMoteurOp1(id: string): id is MoteurOp1 {
  return id in CONSTRUCTEURS;
}

/**
 * Construit un moteur natif de l'OP-1 et rend son noeud de sortie.
 *
 * Rend `null` pour un identifiant inconnu, plutot que de lever : l'appelant
 * retombe alors sur son propre repli, ce qui vaut mieux qu'une note qui
 * casse la page.
 */
export function construireMoteurOp1(
  ctx: BaseAudioContext,
  id: string,
  p: ParamsOp1,
  freq: number,
  now: number,
  aide: AideVoix,
): AudioNode | null {
  if (!estMoteurOp1(id)) return null;
  return CONSTRUCTEURS[id](ctx, p, freq, now, aide);
}

/** Reglages neutres, pour un appelant qui n'a pas d'interface. */
export const PARAMS_OP1_DEFAUT: ParamsOp1 = {
  op1Timbre: 50,
  op1Forme: 50,
  op1Mouvement: 40,
  op1Decay: 45,
};
