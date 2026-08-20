import { describe, expect, it, vi } from "vitest";
import { attachLfo, buildFeedbackLoop, buildImpulseResponse, buildPulseWave } from "./dsp";

/**
 * Les quatre briques restantes exigent un AudioContext. Elles ne s'en servent
 * que comme fabrique de noeuds : un contexte factice suffit a verifier le
 * graphe construit et les valeurs posees, sans navigateur.
 */

type FakeNode = { connect: ReturnType<typeof vi.fn>; [k: string]: unknown };

function makeContext(sampleRate = 48000) {
  const connections: Array<[string, string]> = [];
  let seq = 0;

  const node = (kind: string, extra: Record<string, unknown> = {}): FakeNode => {
    const id = `${kind}#${seq++}`;
    const n: FakeNode = {
      __id: id,
      __kind: kind,
      connect: vi.fn((target: any) => {
        connections.push([id, target?.__id ?? "param"]);
        return target;
      }),
      ...extra,
    };
    return n;
  };

  const param = (value = 0) => ({
    value,
    setValueAtTime: vi.fn(function (this: any, v: number) {
      this.value = v;
    }),
  });

  const ctx = {
    sampleRate,
    currentTime: 0,
    createBuffer: vi.fn((channels: number, length: number, rate: number) => ({
      numberOfChannels: channels,
      length,
      sampleRate: rate,
      _data: Array.from({ length: channels }, () => new Float32Array(length)),
      getChannelData(ch: number) {
        return this._data[ch];
      },
    })),
    createGain: vi.fn(() => node("gain", { gain: param(1) })),
    createDelay: vi.fn((max = 1) => node("delay", { __max: max, delayTime: param(0) })),
    createBiquadFilter: vi.fn(() =>
      node("filter", { type: "lowpass", frequency: param(350), Q: param(1) })
    ),
    createOscillator: vi.fn(() =>
      node("osc", { type: "sine", frequency: param(440), start: vi.fn(), stop: vi.fn() })
    ),
    createPeriodicWave: vi.fn((real: Float32Array, imag: Float32Array) => ({
      __kind: "wave",
      real,
      imag,
    })),
  };
  return { ctx: ctx as any, connections };
}

describe("buildImpulseResponse", () => {
  it("produit un tampon stereo a la duree demandee", () => {
    const { ctx } = makeContext(48000);
    const buf = buildImpulseResponse(ctx, 2, 2);
    expect(buf.numberOfChannels).toBe(2);
    expect(buf.length).toBe(96000); // 2 s x 48 kHz
  });

  it("decroit du debut vers la fin", () => {
    // Sans decroissance ce n'est plus une reverberation mais du bruit
    // continu : la queue ne s'eteindrait jamais.
    const { ctx } = makeContext(8000);
    const d = buildImpulseResponse(ctx, 1, 3).getChannelData(0);
    const energie = (from: number, to: number) => {
      let s = 0;
      for (let i = from; i < to; i++) s += Math.abs(d[i]);
      return s / (to - from);
    };
    expect(energie(0, 500)).toBeGreaterThan(energie(7000, 7500) * 5);
  });

  it("reste dans les bornes -1..1", () => {
    const { ctx } = makeContext(4000);
    for (const v of buildImpulseResponse(ctx, 1, 2).getChannelData(0)) {
      expect(Math.abs(v)).toBeLessThanOrEqual(1);
    }
  });

  it("decroit plus vite avec un facteur plus eleve", () => {
    const { ctx } = makeContext(8000);
    const mid = (decay: number) => Math.abs(buildImpulseResponse(ctx, 1, decay).getChannelData(0)[4000]);
    // Moyenne sur plusieurs tirages : le contenu est aleatoire.
    const moy = (decay: number) =>
      Array.from({ length: 40 }, () => mid(decay)).reduce((a, b) => a + b, 0) / 40;
    expect(moy(8)).toBeLessThan(moy(1));
  });

  it("ne produit jamais un tampon vide", () => {
    // Une duree nulle donnerait un AudioBuffer invalide, rejete par
    // ConvolverNode.
    const { ctx } = makeContext(48000);
    expect(buildImpulseResponse(ctx, 0, 2).length).toBeGreaterThan(0);
  });
});

describe("buildPulseWave", () => {
  it("laisse la composante continue a zero", () => {
    // real[0] non nul introduirait un decalage permanent du signal.
    const { ctx } = makeContext();
    const w: any = buildPulseWave(ctx, 50);
    expect(w.real[0]).toBe(0);
    expect(w.imag.every((v: number) => v === 0)).toBe(true);
  });

  it("annule les harmoniques paires a 50 % de rapport cyclique", () => {
    // Propriete connue de l'onde carree parfaite : c'est ce qui lui donne
    // son timbre creux.
    const { ctx } = makeContext();
    const w: any = buildPulseWave(ctx, 50);
    for (let h = 2; h < 16; h += 2) expect(Math.abs(w.real[h])).toBeLessThan(1e-6);
  });

  it("fait apparaitre les harmoniques paires hors de 50 %", () => {
    // C'est precisement ce que le reglage doit s'entendre produire.
    const { ctx } = makeContext();
    const w: any = buildPulseWave(ctx, 25);
    const paires = [2, 4, 6].map((h) => Math.abs(w.real[h]));
    expect(Math.max(...paires)).toBeGreaterThan(0.01);
  });

  it("borne les rapports cycliques extremes", () => {
    // A 0 % ou 100 % l'onde serait plate : plus de son du tout.
    const { ctx } = makeContext();
    for (const duty of [0, 100, -50, 999]) {
      const w: any = buildPulseWave(ctx, duty);
      expect(w.real.some((v: number) => Math.abs(v) > 1e-6)).toBe(true);
    }
  });
});

describe("attachLfo", () => {
  it("branche l'oscillateur sur le parametre via un gain de profondeur", () => {
    // Brancher l'oscillateur directement sur le parametre rendrait la
    // profondeur non reglable.
    const { ctx, connections } = makeContext();
    const cible = { value: 0, setValueAtTime: vi.fn() } as any;
    const lfo = attachLfo(ctx, cible, 5, 200, 0);
    expect(ctx.createGain).toHaveBeenCalled();
    expect(connections.some(([from]) => from.startsWith("osc"))).toBe(true);
    expect((lfo as any).start).toHaveBeenCalledWith(0);
  });

  it("pose la frequence demandee", () => {
    const { ctx } = makeContext();
    const lfo: any = attachLfo(ctx, { value: 0, setValueAtTime: vi.fn() } as any, 7.5, 100, 0);
    expect(lfo.frequency.value).toBe(7.5);
  });

  it("empeche une frequence nulle ou negative", () => {
    // Un OscillatorNode a 0 Hz ne module plus rien ; en negatif, il leve.
    const { ctx } = makeContext();
    for (const rate of [0, -3]) {
      const lfo: any = attachLfo(ctx, { value: 0, setValueAtTime: vi.fn() } as any, rate, 50, 0);
      expect(lfo.frequency.value).toBeGreaterThan(0);
    }
  });

  it("accepte une forme d'onde choisie", () => {
    const { ctx } = makeContext();
    const lfo: any = attachLfo(ctx, { value: 0, setValueAtTime: vi.fn() } as any, 2, 10, 0, "square");
    expect(lfo.type).toBe("square");
  });
});

describe("buildFeedbackLoop", () => {
  // Trois gains sont crees : entree, sortie, puis rebouclage. Seul le
  // troisieme est plafonne — les deux premiers valent 1, ce qui est normal.
  const gainRebouclage = (ctx: any) => ctx.createGain.mock.results[2].value.gain.value;

  it("plafonne le gain de rebouclage sous 1", () => {
    // Au-dela de 1 la boucle s'emballe : larsen immediat.
    for (const fb of [100, 150, 1000]) {
      const { ctx } = makeContext();
      buildFeedbackLoop(ctx, 0.05, fb, 4000);
      expect(gainRebouclage(ctx)).toBeLessThan(1);
    }
  });

  it("ne descend jamais sous zero", () => {
    const { ctx } = makeContext();
    buildFeedbackLoop(ctx, 0.05, -50, 4000);
    expect(gainRebouclage(ctx)).toBeGreaterThanOrEqual(0);
  });

  it("croit avec le reglage demande", () => {
    // Sans cette progression le reglage n'aurait aucun effet audible.
    const faible = makeContext();
    buildFeedbackLoop(faible.ctx, 0.05, 10, 4000);
    const fort = makeContext();
    buildFeedbackLoop(fort.ctx, 0.05, 90, 4000);
    expect(gainRebouclage(fort.ctx)).toBeGreaterThan(gainRebouclage(faible.ctx));
  });

  it("insere un filtre d'amortissement dans la boucle", () => {
    // Sans amortissement les aigus s'accumulent a chaque tour et la boucle
    // devient stridente.
    const { ctx } = makeContext();
    buildFeedbackLoop(ctx, 0.05, 60, 3200);
    expect(ctx.createBiquadFilter).toHaveBeenCalled();
    const f: any = ctx.createBiquadFilter.mock.results[0].value;
    expect(f.type).toBe("lowpass");
    expect(f.frequency.value).toBe(3200);
  });

  it("garde un temps de retard strictement positif", () => {
    // Un DelayNode a 0 s reboucle instantanement et fait exploser le signal.
    const { ctx } = makeContext();
    buildFeedbackLoop(ctx, 0, 50, 4000);
    const d: any = ctx.createDelay.mock.results[0].value;
    expect(d.delayTime.value).toBeGreaterThan(0);
  });

  it("expose une entree et une sortie distinctes", () => {
    const { ctx } = makeContext();
    const loop = buildFeedbackLoop(ctx, 0.05, 40, 4000);
    expect(loop.input).toBeDefined();
    expect(loop.output).toBeDefined();
    expect(loop.input).not.toBe(loop.output);
  });

  it("laisse passer le signal direct en plus du retard", () => {
    // input est connecte a la fois au delai et a la sortie : sans le trajet
    // direct, seule la queue serait audible et l'attaque disparaitrait.
    const { ctx, connections } = makeContext();
    const loop = buildFeedbackLoop(ctx, 0.05, 40, 4000);
    const depuisEntree = connections.filter(([from]) => from === (loop.input as any).__id);
    expect(depuisEntree.length).toBeGreaterThanOrEqual(2);
  });
});
