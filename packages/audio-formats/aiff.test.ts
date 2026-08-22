import { describe, expect, it } from "vitest";
import {
  extractAiffInterleaved,
  getAiffMetadata,
  isAiffFormat,
  parseAiffFormat,
  readAiffSample,
} from "./aiff";

/**
 * Lecture AIFF — le format réel des patches et pistes de l'OP-1.
 *
 * Ce code n'avait aucun test alors qu'il existait en DEUX exemplaires, dont un
 * dans un répertoire que le typecheck n'inspecte pas. C'est de l'analyse de
 * format binaire : une erreur d'un octet sur un décalage ne lève pas, elle rend
 * du bruit. Rien ne l'aurait signalée.
 *
 * Les fichiers d'essai sont construits ici, octet par octet, plutôt que lus
 * depuis le disque : un test qui dépend d'un fichier absent ne prouve rien, et
 * on veut pouvoir fabriquer des cas limites que le disque ne contient pas.
 */

/** Flottant étendu 80 bits IEEE 754 (champ `sampleRate` de `COMM`). */
function ecrireEtendu80(vue: DataView, offset: number, valeur: number): void {
  if (valeur === 0) {
    for (let i = 0; i < 10; i++) vue.setUint8(offset + i, 0);
    return;
  }
  const exposant = Math.floor(Math.log2(valeur));
  const mantisse = BigInt(Math.round(valeur / Math.pow(2, exposant - 63)));
  vue.setUint16(offset, exposant + 16383, false);
  vue.setUint32(offset + 2, Number((mantisse >> BigInt(32)) & BigInt(0xffffffff)), false);
  vue.setUint32(offset + 6, Number(mantisse & BigInt(0xffffffff)), false);
}

type Options = {
  canaux?: number;
  frequence?: number;
  bits?: number;
  trames?: number;
  /** Ajoute un chunk APPL, comme en portent les patches OP-1. */
  appl?: Uint8Array;
  /** Retire un chunk obligatoire, pour éprouver les refus. */
  sans?: "COMM" | "SSND";
  /** Rampe descendante vers les valeurs négatives, pour éprouver le signe. */
  negatif?: boolean;
  forme?: string;
  type?: string;
};

/** Construit un AIFF minimal mais valide. Les échantillons montent en rampe. */
function aiff(o: Options = {}): ArrayBuffer {
  const canaux = o.canaux ?? 1;
  const frequence = o.frequence ?? 44100;
  const bits = o.bits ?? 16;
  const trames = o.trames ?? 4;
  const octetsParEchantillon = Math.ceil(bits / 8);
  const tailleSsnd = 8 + trames * canaux * octetsParEchantillon;

  const morceaux: { id: string; taille: number }[] = [];
  if (o.sans !== "COMM") morceaux.push({ id: "COMM", taille: 18 });
  if (o.sans !== "SSND") morceaux.push({ id: "SSND", taille: tailleSsnd });
  if (o.appl) morceaux.push({ id: "APPL", taille: o.appl.byteLength });

  const total = 12 + morceaux.reduce((n, m) => n + 8 + m.taille + (m.taille % 2), 0);
  const buf = new ArrayBuffer(total);
  const v = new DataView(buf);
  const ecrireId = (off: number, id: string) => {
    for (let i = 0; i < 4; i++) v.setUint8(off + i, id.charCodeAt(i));
  };

  ecrireId(0, o.forme ?? "FORM");
  v.setUint32(4, total - 8, false);
  ecrireId(8, o.type ?? "AIFF");

  let off = 12;
  for (const m of morceaux) {
    ecrireId(off, m.id);
    v.setUint32(off + 4, m.taille, false);
    const debut = off + 8;

    if (m.id === "COMM") {
      v.setInt16(debut, canaux, false);
      v.setUint32(debut + 2, trames, false);
      v.setInt16(debut + 6, bits, false);
      ecrireEtendu80(v, debut + 8, frequence);
    } else if (m.id === "SSND") {
      v.setUint32(debut, 0, false); // offset
      v.setUint32(debut + 4, 0, false); // blockSize
      // Rampe : chaque échantillon vaut (i+1)/trames de la pleine échelle.
      const max = Math.pow(2, bits - 1) - 1;
      let p = debut + 8;
      for (let t = 0; t < trames; t++) {
        for (let c = 0; c < canaux; c++) {
          // Rampe montante, ou descendante vers le négatif selon l'option.
          const val = o.negatif
            ? -Math.round((max * (t + 1)) / trames)
            : Math.round((max * (t + 1)) / trames);
          if (bits <= 8) v.setInt8(p, val);
          else if (bits <= 16) v.setInt16(p, val, false);
          else if (bits <= 24) {
            v.setUint8(p, (val >> 16) & 0xff);
            v.setUint8(p + 1, (val >> 8) & 0xff);
            v.setUint8(p + 2, val & 0xff);
          } else v.setInt32(p, val, false);
          p += octetsParEchantillon;
        }
      }
    } else if (m.id === "APPL" && o.appl) {
      new Uint8Array(buf, debut, o.appl.byteLength).set(o.appl);
    }
    off += 8 + m.taille + (m.taille % 2);
  }
  return buf;
}

describe("parseAiffFormat — en-tête", () => {
  it("lit les champs d'un AIFF mono 16 bits", () => {
    const f = parseAiffFormat(aiff({ canaux: 1, frequence: 44100, bits: 16, trames: 4 }))!;
    expect(f.channels).toBe(1);
    expect(f.sampleRate).toBe(44100);
    expect(f.bitDepth).toBe(16);
    expect(f.frameCount).toBe(4);
    expect(f.bytesPerSample).toBe(2);
    expect(f.bytesPerFrame).toBe(2);
  });

  it("lit un stéréo", () => {
    const f = parseAiffFormat(aiff({ canaux: 2, trames: 8 }))!;
    expect(f.channels).toBe(2);
    expect(f.bytesPerFrame).toBe(4);
    expect(f.frameCount).toBe(8);
  });

  it("décode le flottant étendu 80 bits du champ sampleRate", () => {
    // Le seul champ du format qui ne soit pas un entier : un flottant
    // historique Motorola, décodé à la main. Une erreur ici donnerait un
    // fichier à la mauvaise hauteur, sans rien signaler.
    for (const hz of [22050, 32000, 44100, 46875, 48000]) {
      expect(parseAiffFormat(aiff({ frequence: hz }))?.sampleRate, `${hz} Hz`).toBe(hz);
    }
  });

  it("accepte AIFC autant qu'AIFF", () => {
    expect(parseAiffFormat(aiff({ type: "AIFC" }))).not.toBeNull();
  });

  it("relève la position du chunk APPL quand il existe", () => {
    // C'est ce chunk qui porte les marqueurs de patch de l'OP-1.
    const f = parseAiffFormat(aiff({ appl: new Uint8Array([1, 2, 3, 4]) }))!;
    expect(f.applStart).not.toBeNull();
    expect(f.applLength).toBe(4);
  });

  it("laisse applStart à null en son absence", () => {
    expect(parseAiffFormat(aiff())!.applStart).toBeNull();
  });
});

describe("parseAiffFormat — refus", () => {
  it("refuse un tampon trop court", () => {
    expect(parseAiffFormat(new ArrayBuffer(4))).toBeNull();
  });

  it("refuse un tampon vide", () => {
    expect(parseAiffFormat(new ArrayBuffer(0))).toBeNull();
  });

  it("refuse un fichier qui n'est pas du FORM", () => {
    expect(parseAiffFormat(aiff({ forme: "RIFF" }))).toBeNull();
  });

  it("refuse un type inconnu", () => {
    expect(parseAiffFormat(aiff({ type: "WAVE" }))).toBeNull();
  });

  it("refuse un fichier sans COMM", () => {
    // Rendre `null` plutôt que lever : l'appelant traite des fichiers choisis
    // par l'utilisateur, dont certains ne sont pas de l'audio.
    expect(parseAiffFormat(aiff({ sans: "COMM" }))).toBeNull();
  });

  it("refuse un fichier sans SSND", () => {
    expect(parseAiffFormat(aiff({ sans: "SSND" }))).toBeNull();
  });

  it("ne lève jamais sur des octets quelconques", () => {
    const bruit = new Uint8Array(64);
    for (let i = 0; i < bruit.length; i++) bruit[i] = (i * 37) % 256;
    expect(() => parseAiffFormat(bruit.buffer)).not.toThrow();
  });
});

describe("readAiffSample — profondeurs", () => {
  it("rend des valeurs bornées à -1..1 sur 8, 16, 24 et 32 bits", () => {
    for (const bits of [8, 16, 24, 32]) {
      const f = parseAiffFormat(aiff({ bits, trames: 4 }))!;
      for (let t = 0; t < f.frameCount; t++) {
        const v = readAiffSample(f, f.dataStart + t * f.bytesPerFrame);
        expect(Math.abs(v), `${bits} bits, trame ${t}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("restitue la rampe croissante du fichier d'essai", () => {
    // Vérifie l'ordre ET le décalage : une erreur d'un octet donnerait des
    // valeurs désordonnées sans rien faire échouer d'autre.
    const f = parseAiffFormat(aiff({ bits: 16, trames: 4 }))!;
    const vals = [0, 1, 2, 3].map((t) => readAiffSample(f, f.dataStart + t * f.bytesPerFrame));
    for (let i = 1; i < vals.length; i++) expect(vals[i]).toBeGreaterThan(vals[i - 1]);
  });

  it("lit le 24 bits en complément à deux", () => {
    const f = parseAiffFormat(aiff({ bits: 24, trames: 2 }))!;
    expect(readAiffSample(f, f.dataStart)).toBeGreaterThan(0);
  });

  it("étend le signe des valeurs 24 bits NÉGATIVES", () => {
    // Le 24 bits est reconstruit à la main sur trois octets : sans extension
    // de signe explicite, une valeur négative est lue comme un grand positif.
    // Le fichier sonnerait à l'envers sur la moitié de sa forme d'onde.
    //
    // Ce test a été ajouté après un sabotage : supprimer l'extension de signe
    // ne faisait échouer AUCUN test, parce que la rampe d'essai ne produisait
    // que des valeurs positives. Un test qui ne peut pas échouer ne prouve rien.
    const f = parseAiffFormat(aiff({ bits: 24, trames: 4, negatif: true }))!;
    for (let t = 0; t < f.frameCount; t++) {
      const v = readAiffSample(f, f.dataStart + t * f.bytesPerFrame);
      expect(v, `trame ${t}`).toBeLessThan(0);
      expect(v).toBeGreaterThanOrEqual(-1);
    }
  });

  it("étend le signe sur toutes les profondeurs", () => {
    for (const bits of [8, 16, 24, 32]) {
      const f = parseAiffFormat(aiff({ bits, trames: 3, negatif: true }))!;
      expect(readAiffSample(f, f.dataStart), `${bits} bits`).toBeLessThan(0);
    }
  });
});

describe("extractAiffInterleaved", () => {
  it("rend un échantillon par canal et par trame", () => {
    expect(extractAiffInterleaved(aiff({ canaux: 2, trames: 5 }))).toHaveLength(10);
  });

  it("borne strictement à -1..1", () => {
    const out = extractAiffInterleaved(aiff({ bits: 16, trames: 8 }))!;
    for (const v of out) expect(Math.abs(v)).toBeLessThanOrEqual(1);
  });

  it("rend null sur une entrée invalide", () => {
    expect(extractAiffInterleaved(new ArrayBuffer(4))).toBeNull();
  });
});

describe("isAiffFormat et getAiffMetadata", () => {
  it("reconnaît un AIFF", () => {
    expect(isAiffFormat(aiff())).toBe(true);
  });

  it("rejette ce qui n'en est pas un", () => {
    expect(isAiffFormat(new ArrayBuffer(32))).toBe(false);
  });

  it("calcule la durée à partir du nombre de trames", () => {
    const m = getAiffMetadata(aiff({ frequence: 44100, trames: 44100 }))!;
    expect(m.duration).toBeCloseTo(1, 6);
    expect(m.sampleRate).toBe(44100);
  });

  it("rend null sur une entrée invalide", () => {
    expect(getAiffMetadata(new ArrayBuffer(4))).toBeNull();
  });
});


describe("parseAiffFormat — entrées malformées", () => {
  it("rejette un chunk dont la longueur dépasse le tampon", () => {
    const bytes = new Uint8Array(20);
    bytes.set([70, 79, 82, 77, 0, 0, 0, 12, 65, 73, 70, 70, 67, 79, 77, 77, 255, 255, 255, 255]);
    expect(() => parseAiffFormat(bytes.buffer)).not.toThrow();
    expect(parseAiffFormat(bytes.buffer)).toBeNull();
  });
});
