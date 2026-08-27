/**
 * Un `AudioContext` factice, pour les tests.
 *
 * Les fonctions qui construisent un graphe audio ne se servent du contexte que
 * comme **fabrique de nœuds** : elles n'appellent ni le rendu, ni l'horloge du
 * matériel. Un faux contexte suffit donc à vérifier ce qui compte — quels
 * nœuds sont créés, comment ils sont reliés, et quelles valeurs sont posées —
 * sans navigateur ni dépendance.
 *
 * Ce module vivait dans `dsp-nodes.test.ts`, et il lui manquait deux fabriques.
 * Le sortir évite d'en écrire une seconde copie : deux contextes factices
 * divergeraient au premier nœud ajouté, et le test qui utiliserait le plus
 * ancien vérifierait un graphe que le code ne construit plus.
 *
 * Il n'importe rien de vitest : les appels sont enregistrés à la main, ce qui
 * le rend utilisable partout et le garde hors du paquet livré.
 */

export type NoeudFactice = {
  __id: string;
  __kind: string;
  connect: (cible: unknown) => unknown;
  [cle: string]: unknown;
};

/** Un `AudioParam` factice : il retient la dernière valeur posée. */
export type ParamFactice = {
  value: number;
  /** Toutes les valeurs posées, dans l'ordre — une rampe en pose plusieurs. */
  valeursPosees: number[];
  setValueAtTime: (v: number, quand?: number) => ParamFactice;
  linearRampToValueAtTime: (v: number, quand?: number) => ParamFactice;
  exponentialRampToValueAtTime: (v: number, quand?: number) => ParamFactice;
  cancelScheduledValues: (quand?: number) => ParamFactice;
};

export function creerParamFactice(valeur = 0): ParamFactice {
  const p: ParamFactice = {
    value: valeur,
    valeursPosees: [],
    setValueAtTime(v) { p.value = v; p.valeursPosees.push(v); return p; },
    linearRampToValueAtTime(v) { p.value = v; p.valeursPosees.push(v); return p; },
    exponentialRampToValueAtTime(v) { p.value = v; p.valeursPosees.push(v); return p; },
    cancelScheduledValues() { return p; },
  };
  return p;
}

export type ContexteFactice = {
  /** À passer aux fonctions testées. */
  ctx: BaseAudioContext;
  /** Chaque liaison, sous la forme `[idSource, idCible]`. */
  liaisons: Array<[string, string]>;
  /** Tous les nœuds créés, dans l'ordre de création. */
  noeuds: NoeudFactice[];
  /** Les nœuds d'un type donné : `"gain"`, `"filter"`, `"delay"`, … */
  parType: (kind: string) => NoeudFactice[];
  /** Le nœud relié à celui-ci, s'il y en a un. */
  cibles: (n: NoeudFactice) => string[];
};

export function creerContexteFactice(sampleRate = 48000): ContexteFactice {
  const liaisons: Array<[string, string]> = [];
  const noeuds: NoeudFactice[] = [];
  let compteur = 0;

  const noeud = (kind: string, extra: Record<string, unknown> = {}): NoeudFactice => {
    const id = `${kind}#${compteur++}`;
    const n: NoeudFactice = {
      __id: id,
      __kind: kind,
      connect(cible: unknown) {
        // Une liaison vers un AudioParam n'a pas d'identifiant de noeud : on
        // la note quand meme, c'est ainsi qu'un LFO s'attache a un parametre.
        liaisons.push([id, (cible as NoeudFactice | undefined)?.__id ?? "param"]);
        return cible;
      },
      ...extra,
    };
    noeuds.push(n);
    return n;
  };

  const ctx = {
    sampleRate,
    currentTime: 0,
    createBuffer: (channels: number, length: number, rate: number) => ({
      numberOfChannels: channels,
      length,
      sampleRate: rate,
      _data: Array.from({ length: channels }, () => new Float32Array(length)),
      getChannelData(ch: number) { return (this as { _data: Float32Array[] })._data[ch]; },
    }),
    createGain: () => noeud("gain", { gain: creerParamFactice(1) }),
    createDelay: (max = 1) => noeud("delay", { __max: max, delayTime: creerParamFactice(0) }),
    createBiquadFilter: () =>
      noeud("filter", { type: "lowpass", frequency: creerParamFactice(350), Q: creerParamFactice(1), gain: creerParamFactice(0) }),
    createOscillator: () =>
      noeud("osc", { type: "sine", frequency: creerParamFactice(440), detune: creerParamFactice(0), start: () => {}, stop: () => {} }),
    createWaveShaper: () => noeud("waveshaper", { curve: null, oversample: "none" }),
    createStereoPanner: () => noeud("panner", { pan: creerParamFactice(0) }),
    createPeriodicWave: (real: Float32Array, imag: Float32Array) => ({ __kind: "wave", real, imag }),
  };

  return {
    ctx: ctx as unknown as BaseAudioContext,
    liaisons,
    noeuds,
    parType: (kind) => noeuds.filter((n) => n.__kind === kind),
    cibles: (n) => liaisons.filter(([source]) => source === n.__id).map(([, cible]) => cible),
  };
}
