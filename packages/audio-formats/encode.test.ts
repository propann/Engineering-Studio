import { describe, expect, it } from "vitest";
import { encodeAiffPcm16, encodeWavPcm16, convertToOp1Audio } from "./encode";
import { extractAiffInterleaved, getAiffMetadata, parseAiffFormat, readAiffSample } from "./aiff";

/**
 * Encodage vers les formats des machines.
 *
 * C'est le code qui écrit le fichier que l'OP-1 va lire. Une erreur ici ne
 * lève pas : elle produit un fichier qui sonne faux, ou pas du tout, et on ne
 * le découvre que sur la machine.
 *
 * La stratégie est l'aller-retour : encoder, puis relire avec l'analyseur du
 * même paquet. Deux implémentations indépendantes qui s'accordent sur le même
 * flux d'octets constituent une vérification réelle — pas une tautologie,
 * puisque l'une écrit et l'autre lit, et qu'un décalage d'un octet ferait
 * diverger les deux.
 */

/** Sinusoïde entrelacée, de quoi éprouver le signe et l'amplitude. */
function sinus(trames: number, canaux = 1, periode = 32): Float32Array {
  const out = new Float32Array(trames * canaux);
  for (let t = 0; t < trames; t++) {
    const v = Math.sin((2 * Math.PI * t) / periode) * 0.8;
    for (let c = 0; c < canaux; c++) out[t * canaux + c] = v;
  }
  return out;
}

describe("encodeAiffPcm16 — aller-retour", () => {
  it("produit un AIFF que l'analyseur reconnaît", () => {
    const bytes = encodeAiffPcm16(sinus(64), 1, 44100);
    const f = parseAiffFormat(bytes);
    expect(f).not.toBeNull();
    expect(f!.channels).toBe(1);
    expect(f!.bitDepth).toBe(16);
  });

  it("conserve la fréquence d'échantillonnage à travers le flottant 80 bits", () => {
    // Le sampleRate d'un AIFF est un flottant étendu Motorola, écrit puis relu
    // à la main de part et d'autre. C'est le champ le plus facile à casser, et
    // un fichier à la mauvaise fréquence sonne simplement à la mauvaise hauteur.
    for (const hz of [22050, 32000, 44100, 46875, 48000]) {
      expect(getAiffMetadata(encodeAiffPcm16(sinus(16), 1, hz))?.sampleRate, `${hz} Hz`).toBe(hz);
    }
  });

  it("conserve le nombre de trames", () => {
    for (const n of [1, 16, 441, 1000]) {
      expect(parseAiffFormat(encodeAiffPcm16(sinus(n), 1, 44100))?.frameCount, `${n} trames`).toBe(n);
    }
  });

  it("conserve le stéréo et l'entrelacement", () => {
    const f = parseAiffFormat(encodeAiffPcm16(sinus(32, 2), 2, 44100))!;
    expect(f.channels).toBe(2);
    expect(f.frameCount).toBe(32);
    expect(f.bytesPerFrame).toBe(4);
  });

  it("restitue la forme d'onde à la précision du 16 bits près", () => {
    // Le point central : les valeurs relues doivent être celles écrites. Un
    // décalage d'un octet, un mauvais boutisme ou un signe perdu se voient ici.
    const source = sinus(128);
    const relu = extractAiffInterleaved(encodeAiffPcm16(source, 1, 44100))!;
    expect(relu).toHaveLength(source.length);
    for (let i = 0; i < source.length; i++) {
      expect(relu[i], `échantillon ${i}`).toBeCloseTo(source[i], 3);
    }
  });

  it("conserve les valeurs NÉGATIVES", () => {
    // Le complément à deux est le piège classique de l'audio PCM : un signe
    // perdu fait sonner la moitié de la forme d'onde à l'envers.
    const source = new Float32Array([-0.8, -0.5, -0.25, -0.01]);
    const relu = extractAiffInterleaved(encodeAiffPcm16(source, 1, 44100))!;
    for (let i = 0; i < source.length; i++) {
      expect(relu[i], `échantillon ${i}`).toBeLessThan(0);
      expect(relu[i]).toBeCloseTo(source[i], 3);
    }
  });

  it("borne sans déborder aux extrêmes", () => {
    // Une valeur hors bornes qui repasserait par zéro produirait un claquement.
    const relu = extractAiffInterleaved(encodeAiffPcm16(new Float32Array([1, -1, 1.5, -1.5]), 1, 44100))!;
    for (const v of relu) expect(Math.abs(v)).toBeLessThanOrEqual(1);
    expect(relu[0]).toBeGreaterThan(0.9);
    expect(relu[1]).toBeLessThan(-0.9);
    expect(relu[2]).toBeGreaterThan(0.9);
    expect(relu[3]).toBeLessThan(-0.9);
  });

  it("accepte un signal vide sans lever", () => {
    expect(() => encodeAiffPcm16(new Float32Array(0), 1, 44100)).not.toThrow();
  });

  it("annonce la bonne taille dans l'en-tête FORM, en big-endian", () => {
    // Notre analyseur ne LIT pas ce champ : il parcourt les chunks. Un lecteur
    // réel s'y fie. L'aller-retour ne prouve donc rien ici — d'où ce contrôle
    // direct sur les octets. Découvert par sabotage : écrire ce champ en
    // little-endian ne faisait échouer aucun test.
    const b = encodeAiffPcm16(sinus(64, 2), 2, 44100);
    expect(new DataView(b).getUint32(4, false)).toBe(b.byteLength - 8);
  });

  it("annonce le bon nombre de trames dans COMM", () => {
    // Même angle mort : notre analyseur déduit frameCount de la taille du bloc
    // SSND et ignore ce champ. L'OP-1, elle, le lit — un mauvais compte tronque
    // ou allonge le sample. Sabotage vérifié : +1 ici ne cassait rien.
    for (const [trames, canaux] of [[64, 1], [100, 2], [1, 1]] as const) {
      const b = encodeAiffPcm16(sinus(trames, canaux), canaux, 44100);
      // COMM commence à 20 (12 en-tête + 8 id/taille) ; numFrames à +2.
      expect(new DataView(b).getUint32(22, false), `${trames}x${canaux}`).toBe(trames);
    }
  });

  it("écrit le flottant 80 bits octet pour octet", () => {
    // 44100 Hz s'encode en [64,14,172,68,0,0,0,0,0,0] — valeur documentée et
    // vérifiable. Les quatre derniers octets valant zéro pour cette fréquence,
    // les tronquer passait inaperçu au sabotage : seule une comparaison octet
    // à octet ferme ce trou.
    // COMM : données à 20 — canaux (2), trames (4), profondeur (2), puis le
    // flottant à 28. C'est ce décalage que la première version de ce test avait
    // faux ; l'assertion octet à octet l'a signalé tout de suite.
    const b = encodeAiffPcm16(sinus(8), 1, 44100);
    const octets = Array.from(new Uint8Array(b, 28, 10));
    expect(octets).toEqual([64, 14, 172, 68, 0, 0, 0, 0, 0, 0]);
  });

  it("encode octet pour octet toutes les fréquences des machines", () => {
    // Valeurs calculées indépendamment de l'encodeur. Elles fixent aussi une
    // limite utile : les quatre derniers octets — le mot de poids faible de la
    // mantisse — valent zéro pour TOUTES ces fréquences, parce que ce sont des
    // entiers dont les bits significatifs tiennent dans le mot de poids fort.
    //
    // Conséquence à connaître avant de « corriger » quoi que ce soit ici :
    // tronquer ce mot de poids faible est sans effet sur ce projet. Un sabotage
    // l'a tenté, aucun test n'est tombé, et c'était la bonne réponse — ce
    // n'était pas un défaut. Il ne le deviendrait qu'avec une fréquence non
    // entière ou beaucoup plus grande.
    const attendu: Record<number, number[]> = {
      22050: [64, 13, 172, 68, 0, 0, 0, 0, 0, 0],
      26250: [64, 13, 205, 20, 0, 0, 0, 0, 0, 0], // EP-133 LO
      32000: [64, 13, 250, 0, 0, 0, 0, 0, 0, 0], // EP-133 MID
      44100: [64, 14, 172, 68, 0, 0, 0, 0, 0, 0],
      46875: [64, 14, 183, 27, 0, 0, 0, 0, 0, 0], // EP-133 HI
      48000: [64, 14, 187, 128, 0, 0, 0, 0, 0, 0],
    };
    for (const [hz, octets] of Object.entries(attendu)) {
      const bytes = encodeAiffPcm16(sinus(8), 1, Number(hz));
      expect(Array.from(new Uint8Array(bytes, 28, 10)), `${hz} Hz`).toEqual(octets);
    }
  });

  it("produit un fichier de taille cohérente", () => {
    // 2 octets par échantillon, plus les en-têtes. Une taille aberrante
    // signalerait un chunk mal dimensionné — que l'analyseur, lui, pourrait
    // tolérer en silence.
    const n = 100;
    const taille = encodeAiffPcm16(sinus(n, 2), 2, 44100).byteLength;
    expect(taille).toBeGreaterThan(n * 2 * 2);
    expect(taille).toBeLessThan(n * 2 * 2 + 200);
  });
});

describe("encodeWavPcm16", () => {
  const entete = (b: ArrayBuffer, off: number) =>
    String.fromCharCode(...new Uint8Array(b, off, 4));

  it("produit un en-tête RIFF/WAVE", () => {
    const b = encodeWavPcm16(sinus(32), 1, 44100);
    expect(entete(b, 0)).toBe("RIFF");
    expect(entete(b, 8)).toBe("WAVE");
  });

  it("écrit la fréquence et les canaux en little-endian", () => {
    // Le WAV est little-endian là où l'AIFF est big-endian : les deux
    // encodeurs vivent côte à côte, et confondre les deux est facile.
    const v = new DataView(encodeWavPcm16(sinus(32, 2), 2, 48000));
    expect(v.getUint16(22, true)).toBe(2); // canaux
    expect(v.getUint32(24, true)).toBe(48000); // fréquence
    expect(v.getUint16(34, true)).toBe(16); // bits
  });

  it("n'est PAS reconnu comme un AIFF", () => {
    // Garde-fou croisé : si l'analyseur AIFF acceptait un WAV, toute la
    // détection de format en aval serait fausse.
    expect(parseAiffFormat(encodeWavPcm16(sinus(32), 1, 44100))).toBeNull();
  });
});

describe("convertToOp1Audio", () => {
  const sourceAiff = () => encodeAiffPcm16(sinus(4410), 1, 44100);

  it("convertit un AIFF vers de l'AIFF par défaut", () => {
    const r = convertToOp1Audio(sourceAiff())!;
    expect(r.format).toBe("aiff");
    expect(r.bitDepth).toBe(16);
    expect(parseAiffFormat(r.bytes)).not.toBeNull();
  });

  it("accepte une source WAV", () => {
    const r = convertToOp1Audio(encodeWavPcm16(sinus(4410), 1, 44100));
    expect(r).not.toBeNull();
    expect(r!.format).toBe("aiff");
  });

  it("produit du WAV sur demande", () => {
    expect(convertToOp1Audio(sourceAiff(), { targetFormat: "wav" })?.format).toBe("wav");
  });

  it("rééchantillonne vers la fréquence demandée", () => {
    const r = convertToOp1Audio(sourceAiff(), { targetSampleRate: 22050 })!;
    expect(r.sampleRate).toBe(22050);
    // Deux fois moins d'échantillons pour la même durée.
    expect(r.durationSeconds).toBeCloseTo(0.1, 2);
  });

  it("replie le stéréo en mono", () => {
    const stereo = encodeAiffPcm16(sinus(1000, 2), 2, 44100);
    expect(convertToOp1Audio(stereo, { targetChannels: 1 })?.channels).toBe(1);
  });

  it("découpe selon le trim demandé", () => {
    const r = convertToOp1Audio(sourceAiff(), { trim: { startSeconds: 0.02, endSeconds: 0.06 } })!;
    expect(r.durationSeconds).toBeCloseTo(0.04, 2);
  });

  it("rend null sur une entrée qui n'est ni AIFF ni WAV", () => {
    // Jamais d'exception : l'appelant traite des fichiers choisis par
    // l'utilisateur, dont certains ne sont pas de l'audio.
    expect(convertToOp1Audio(new ArrayBuffer(64))).toBeNull();
  });

  it("rend null sur un tampon vide", () => {
    expect(convertToOp1Audio(new ArrayBuffer(0))).toBeNull();
  });

  it("ne lève jamais sur des octets quelconques", () => {
    const bruit = new Uint8Array(256);
    for (let i = 0; i < bruit.length; i++) bruit[i] = (i * 91) % 256;
    expect(() => convertToOp1Audio(bruit.buffer)).not.toThrow();
  });
});
