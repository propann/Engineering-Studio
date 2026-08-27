import { describe, expect, it } from "vitest";
import { encodeWavPcm16 } from "../audio-formats/encode";
import {
  analyzeWavBuffer,
  computeWaveformPeaks,
  detectSilenceTrim,
  parseWavFormat,
  parseWavHeader,
  readSignedSample,
  suggestNormalizationGainDb,
} from "./index";

/**
 * L'analyse des fichiers WAV.
 *
 * Ce paquet n'avait aucun test : 17,4 % de ses fonctions étaient exécutées.
 * C'est lui qui alimente l'affichage de la forme d'onde et les suggestions de
 * découpe — une erreur ne plante rien, elle dessine une onde fausse, et la
 * découpe qu'on fait dessus l'est aussi.
 *
 * Les fichiers de test sont de VRAIS WAV. Deux sources :
 *
 * - `encodeWavPcm16` du paquet `audio-formats`, ce qui vérifie au passage que
 *   les deux paquets s'accordent — l'un écrit ce que l'autre relit ;
 * - un encodeur local sans dither, quand il faut placer un échantillon à une
 *   valeur exacte. Le dither de l'encodeur du dépôt ajoute ±1 LSB, ce qui suffit
 *   à rendre un test de saturation instable.
 */

/** Un WAV PCM 16 bits écrit à la main, sans dither : la valeur posée est celle lue. */
function wavExact(trames: number[][], sampleRate = 44100): ArrayBuffer {
  const canaux = trames[0]?.length ?? 1;
  const plat = trames.flat();
  const buffer = new ArrayBuffer(44 + plat.length * 2);
  const vue = new DataView(buffer);
  const texte = (o: number, t: string) => { for (let i = 0; i < t.length; i++) vue.setUint8(o + i, t.charCodeAt(i)); };
  texte(0, "RIFF");
  vue.setUint32(4, 36 + plat.length * 2, true);
  texte(8, "WAVE");
  texte(12, "fmt ");
  vue.setUint32(16, 16, true);
  vue.setUint16(20, 1, true);            // PCM
  vue.setUint16(22, canaux, true);
  vue.setUint32(24, sampleRate, true);
  vue.setUint32(28, sampleRate * canaux * 2, true);
  vue.setUint16(32, canaux * 2, true);
  vue.setUint16(34, 16, true);
  texte(36, "data");
  vue.setUint32(40, plat.length * 2, true);
  plat.forEach((v, i) => vue.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.round(v * 32767))), true));
  return buffer;
}

/** Une sinusoïde mono, en Float32 interleaved. */
function sinus(trames: number, amplitude = 0.5, sampleRate = 44100): Float32Array {
  const s = new Float32Array(trames);
  for (let i = 0; i < trames; i++) s[i] = amplitude * Math.sin((2 * Math.PI * 440 * i) / sampleRate);
  return s;
}

describe("parseWavFormat", () => {
  it("relit ce que l'encodeur du dépôt a écrit", () => {
    // L'aller-retour entre les deux paquets : si l'un change de disposition
    // d'en-tete, l'autre cesse de le lire et ce test le dit.
    const wav = encodeWavPcm16(sinus(1000), 1, 44100);
    const f = parseWavFormat(wav);
    expect(f).not.toBeNull();
    expect(f!.sampleRate).toBe(44100);
    expect(f!.channels).toBe(1);
    expect(f!.bitDepth).toBe(16);
    expect(f!.frameCount).toBe(1000);
  });

  it("compte les trames, pas les échantillons, en stéréo", () => {
    // Confondre les deux donnerait une duree double. C'est l'erreur classique
    // sur un fichier stereo.
    const wav = encodeWavPcm16(new Float32Array(2000), 2, 44100);
    const f = parseWavFormat(wav);
    expect(f!.frameCount).toBe(1000);
    expect(f!.bytesPerFrame).toBe(4);
  });

  it("refuse ce qui n'est pas un WAV", () => {
    const pasWav = new ArrayBuffer(200);
    expect(parseWavFormat(pasWav)).toBeNull();
  });

  it("refuse un fichier BIEN FORMÉ dont la signature ment", () => {
    /**
     * Isole le contrôle de signature, et il a fallu deux essais.
     *
     * Le premier test — un tampon de zéros — passait AUSSI sans le contrôle :
     * la marche des blocs ne trouvait alors aucun bloc `data` et rendait
     * `null` par un autre chemin. Vérifié par sabotage, il ne prouvait rien.
     *
     * Ici le fichier est un vrai WAV auquel on change les quatre premiers
     * octets. Tous les autres contrôles le laissent passer : seul celui de la
     * signature peut le refuser.
     */
    const wav = encodeWavPcm16(sinus(200), 1, 44100);
    expect(parseWavFormat(wav), "le fichier témoin devrait être valide").not.toBeNull();
    new DataView(wav).setUint32(0, 0x52494658, false); // « RIFX » au lieu de « RIFF »
    expect(parseWavFormat(wav)).toBeNull();
  });

  it("refuse un bloc de queue qui déborde, même après un data valide", () => {
    /**
     * Isole le contrôle de la marche des blocs. Le fichier porte un `fmt ` et
     * un `data` corrects, puis un troisième bloc qui annonce une taille
     * dépassant le tampon.
     *
     * Sans le contrôle, la marche saute au-delà de la fin, la boucle s'arrête,
     * et `data` ayant déjà été vu le fichier serait accepté — en faisant
     * confiance à un en-tête qu'on sait faux.
     */
    const base = encodeWavPcm16(sinus(100), 1, 44100);
    const buffer = new ArrayBuffer(base.byteLength + 8);
    new Uint8Array(buffer).set(new Uint8Array(base));
    const vue = new DataView(buffer);
    vue.setUint32(base.byteLength, 0x4c495354, false);      // « LIST »
    vue.setUint32(base.byteLength + 4, 9_000_000, true);    // taille mensongère
    expect(parseWavFormat(buffer)).toBeNull();
  });

  it("refuse un tampon trop court pour porter un en-tête", () => {
    expect(parseWavFormat(new ArrayBuffer(43))).toBeNull();
  });

  it("refuse un fichier dont un bloc déborde du tampon", () => {
    // Un fichier tronque en cours de telechargement. Le lire quand meme ferait
    // sortir des indices du tampon.
    const wav = encodeWavPcm16(sinus(500), 1, 44100);
    const vue = new DataView(wav);
    vue.setUint32(40, 10_000_000, true); // le bloc data s'annonce enorme
    expect(parseWavFormat(wav)).toBeNull();
  });

  it("refuse une profondeur de bits absurde", () => {
    const wav = encodeWavPcm16(sinus(100), 1, 44100);
    new DataView(wav).setUint16(34, 7, true);
    expect(parseWavFormat(wav)).toBeNull();
  });
});

describe("parseWavHeader — la lecture rapide", () => {
  it("rend les champs de l'en-tête canonique", () => {
    const wav = encodeWavPcm16(new Float32Array(200), 2, 48000);
    const h = parseWavHeader(wav);
    expect(h.sampleRate).toBe(48000);
    expect(h.channels).toBe(2);
    expect(h.bitDepth).toBe(16);
    expect(h.isStereo).toBe(true);
  });

  it("rend un objet vide plutôt que de jeter sur un tampon minuscule", () => {
    expect(parseWavHeader(new ArrayBuffer(10))).toEqual({});
  });
});

describe("analyzeWavBuffer", () => {
  it("calcule la durée à partir des trames et de la fréquence", () => {
    const a = analyzeWavBuffer(encodeWavPcm16(new Float32Array(44100), 1, 44100));
    expect(a!.durationSeconds).toBeCloseTo(1, 5);
    expect(a!.durationMs).toBeCloseTo(1000, 2);
  });

  it("trouve le niveau crête", () => {
    const a = analyzeWavBuffer(wavExact([[0.25], [0.8], [-0.4]]));
    expect(a!.peakLevel).toBeCloseTo(0.8, 2);
  });

  it("signale la saturation quand un échantillon touche le plafond", () => {
    // Un fichier sature ne se rattrape pas : la crete est ecretee a l'ecriture.
    const a = analyzeWavBuffer(wavExact([[0.1], [1.0], [0.1]]));
    expect(a!.clipped).toBe(true);
    expect(a!.clippedSampleCount).toBeGreaterThan(0);
  });

  it("ne signale pas de saturation sur un signal modéré", () => {
    const a = analyzeWavBuffer(wavExact([[0.3], [-0.5], [0.2]]));
    expect(a!.clipped).toBe(false);
    expect(a!.clippedSampleCount).toBe(0);
  });

  it("reconnaît le format attendu par l'OP-1", () => {
    // 44,1 kHz et 16 bits. Annoncer « format OP-1 » a tort enverrait un
    // fichier que la machine refuse.
    expect(analyzeWavBuffer(encodeWavPcm16(new Float32Array(100), 1, 44100))!.isOp1Format).toBe(true);
    expect(analyzeWavBuffer(encodeWavPcm16(new Float32Array(100), 1, 48000))!.isOp1Format).toBe(false);
  });

  it("rend null sur un fichier illisible, sans jeter", () => {
    expect(analyzeWavBuffer(new ArrayBuffer(100))).toBeNull();
  });

  it("accepte une taille annoncée par l'appelant", () => {
    // Le fichier peut venir d'un handle dont la taille est connue avant lecture.
    const a = analyzeWavBuffer(encodeWavPcm16(new Float32Array(100), 1, 44100), 999);
    expect(a!.fileSizeBytes).toBe(999);
  });
});

describe("computeWaveformPeaks — ce que l'écran dessine", () => {
  it("rend autant de points que demandé", () => {
    const p = computeWaveformPeaks(encodeWavPcm16(sinus(4410), 1, 44100), 50);
    expect(p!.values).toHaveLength(50);
    expect(p!.min).toHaveLength(50);
    expect(p!.max).toHaveLength(50);
  });

  it("ne demande jamais plus de points qu'il n'y a de trames", () => {
    // Sinon des seaux vides dessineraient des trous dans l'onde.
    const p = computeWaveformPeaks(wavExact([[0.5], [0.5], [0.5]]), 100);
    expect(p!.values).toHaveLength(3);
  });

  it("le silence donne des crêtes nulles", () => {
    const p = computeWaveformPeaks(wavExact(Array.from({ length: 20 }, () => [0])), 4);
    expect(p!.values.every((v) => v === 0)).toBe(true);
  });

  it("garde le signe : min négatif, max positif", () => {
    const p = computeWaveformPeaks(wavExact([[0.6], [-0.6], [0.6], [-0.6]]), 1);
    expect(p!.min[0]).toBeLessThan(0);
    expect(p!.max[0]).toBeGreaterThan(0);
  });

  it("rend null sur un fichier illisible", () => {
    expect(computeWaveformPeaks(new ArrayBuffer(100))).toBeNull();
  });
});

describe("detectSilenceTrim — la découpe proposée", () => {
  /** Silence, puis du signal, puis silence. */
  const avecBlancs = (avant: number, signal: number, apres: number) =>
    wavExact([
      ...Array.from({ length: avant }, () => [0]),
      ...Array.from({ length: signal }, () => [0.8]),
      ...Array.from({ length: apres }, () => [0]),
    ], 1000);

  it("trouve le début et la fin du signal", () => {
    const t = detectSilenceTrim(avecBlancs(500, 1000, 500), -40, 0);
    expect(t!.startSample).toBe(500);
    expect(t!.endSample).toBe(1500);
  });

  it("garde une marge de sécurité autour du signal", () => {
    // Couper au ras du premier echantillon audible produit un clic.
    const t = detectSilenceTrim(avecBlancs(500, 1000, 500), -40, 100);
    // Trames audibles : 500 a 1499. Marge de 100 echantillons de chaque cote.
    expect(t!.startSample).toBe(400);
    expect(t!.endSample).toBe(1600); // 1499 + 100 + 1
  });

  it("la marge ne sort jamais du fichier", () => {
    const t = detectSilenceTrim(avecBlancs(5, 100, 5), -40, 500);
    expect(t!.startSample).toBe(0);
    expect(t!.endSample).toBeLessThanOrEqual(110);
  });

  it("rend null quand tout est silencieux — il n'y a rien à découper", () => {
    expect(detectSilenceTrim(avecBlancs(0, 0, 500))).toBeNull();
  });

  it("le seuil décide de ce qui compte comme silence", () => {
    // Un signal a -20 dBFS est du silence pour un seuil a -12, pas pour -40.
    const doux = wavExact([[0], [0.1], [0]], 1000);
    expect(detectSilenceTrim(doux, -40, 0)).not.toBeNull();
    expect(detectSilenceTrim(doux, -12, 0)).toBeNull();
  });

  it("les secondes correspondent aux échantillons", () => {
    const t = detectSilenceTrim(avecBlancs(500, 1000, 500), -40, 0);
    expect(t!.startSeconds).toBeCloseTo(0.5, 6);
    expect(t!.endSeconds).toBeCloseTo(1.5, 6);
  });
});

describe("readSignedSample", () => {
  const vue = (octets: number[]) => new DataView(new Uint8Array(octets).buffer);

  it("lit chaque profondeur dans les bornes -1..1", () => {
    expect(readSignedSample(vue([128]), 0, 8)).toBeCloseTo(0, 6);
    expect(readSignedSample(vue([0x00, 0x40]), 0, 16)).toBeCloseTo(0.5, 4);
    expect(readSignedSample(vue([0x00, 0x00, 0x40]), 0, 24)).toBeCloseTo(0.5, 4);
  });

  it("interprète le 24 bits signé, y compris les valeurs négatives", () => {
    // 0xC00000 = -4194304 en complement a deux sur 24 bits, soit -0,5.
    expect(readSignedSample(vue([0x00, 0x00, 0xc0]), 0, 24)).toBeCloseTo(-0.5, 4);
  });

  it("rend 0 hors des bornes du tampon plutôt que de jeter", () => {
    /**
     * Le garde qui compte. Sans lui, un fichier tronqué en cours de lecture
     * ferait sortir `DataView` de ses bornes et remonterait une exception au
     * milieu du dessin de l'onde.
     */
    const v = vue([0, 0, 0, 0]);
    expect(readSignedSample(v, -1, 16)).toBe(0);
    expect(readSignedSample(v, 999, 16)).toBe(0);
    expect(readSignedSample(v, 3, 24), "24 bits a besoin de trois octets").toBe(0);
  });

  it("rend 0 sur une profondeur inconnue", () => {
    expect(readSignedSample(vue([1, 2, 3, 4]), 0, 12)).toBe(0);
  });
});

describe("suggestNormalizationGainDb", () => {
  it("propose le gain qui amène la crête à la cible", () => {
    // Crete a 0,5 (-6,02 dBFS), cible -1 dBFS : il manque 5,02 dB.
    expect(suggestNormalizationGainDb(0.5, -1)).toBeCloseTo(5.0206, 3);
  });

  it("propose une atténuation quand la crête dépasse déjà la cible", () => {
    expect(suggestNormalizationGainDb(1, -1)).toBeCloseTo(-1, 6);
  });

  it("rend null sur une crête nulle ou absurde", () => {
    // Un fichier entierement silencieux n'a pas de gain de normalisation :
    // proposer +Infini remplirait l'ecran d'un nombre qui ne veut rien dire.
    expect(suggestNormalizationGainDb(0)).toBeNull();
    expect(suggestNormalizationGainDb(-0.2)).toBeNull();
    expect(suggestNormalizationGainDb(NaN)).toBeNull();
    expect(suggestNormalizationGainDb(Infinity)).toBeNull();
  });
});
