import { describe, expect, it } from "vitest";
import {
  buildMidiClockWindow,
  buildMidiNotePacket,
  buildMidiPanicPackets,
  buildMidiRealtimePacket,
  createHubCacheEnvelope,
  createHubNoteMessage,
  createHubPanicMessage,
  createHubTransportMessage,
  isHubNoteMessage,
  isHubPanicMessage,
  isHubTransportMessage,
  parseMidiNotePacket,
  readHubCache,
} from "./index";

/**
 * Les octets envoyés à une machine physique.
 *
 * Ce paquet n'avait aucun test : 7,7 % de ses fonctions étaient exécutées, et
 * le reste ne l'était que par les pages qui l'appellent — donc jamais sous
 * vérification. Une erreur ici ne casse pas l'application : elle envoie
 * silencieusement les mauvais octets à un OP-1 ou à un EP-133.
 *
 * Ces tests APPELLENT le code au lieu de lire le fichier. La distinction
 * compte : dix-sept fichiers de test du dépôt vérifient la présence d'une
 * chaîne dans un source, ce qui laisserait passer n'importe quelle erreur de
 * calcul.
 *
 * Les valeurs attendues viennent de la spécification MIDI 1.0, pas du code —
 * sans quoi le test ne ferait que répéter l'implémentation.
 */

describe("les paquets de note", () => {
  it("note-on porte le statut 0x90, note-off le statut 0x80", () => {
    expect(buildMidiNotePacket("note-on", 60, 100, 0, 0).data[0]).toBe(0x90);
    expect(buildMidiNotePacket("note-off", 60, 0, 0, 0).data[0]).toBe(0x80);
  });

  it("le canal occupe les quatre bits de poids faible du statut", () => {
    // Canal 1 en affichage humain = 0 sur le fil. Le canal 16 vaut donc 15.
    expect(buildMidiNotePacket("note-on", 60, 100, 15, 0).data[0]).toBe(0x9f);
    expect(buildMidiNotePacket("note-off", 60, 0, 9, 0).data[0]).toBe(0x89);
  });

  it("un canal hors bornes est replié, il ne déborde pas sur le statut", () => {
    /**
     * Le choix des valeurs decide si ce test prouve quelque chose.
     *
     * Premiere version : canal 16, attendu 0x90. Elle passait AUSSI sans le
     * masque, parce que 0x90 vaut 1001 0000 et que 16 vaut 0001 0000 — le bit
     * est deja pose, le OU ne change rien. Verifie par sabotage : retirer
     * `& 0x0f` ne la faisait pas tomber. Meme piege avec 17.
     *
     * Il faut un canal dont les bits debordent AILLEURS que sur ceux du
     * statut. 32 vaut 0010 0000 : sans masque, 0x90 | 32 donne 0xb0, soit un
     * Control Change. La machine ne jouerait pas la note, elle changerait un
     * reglage.
     */
    expect(buildMidiNotePacket("note-on", 60, 100, 32, 0).data[0]).toBe(0x90);
    expect(buildMidiNotePacket("note-on", 60, 100, 33, 0).data[0]).toBe(0x91);
    expect(buildMidiNotePacket("note-off", 60, 0, 64, 0).data[0]).toBe(0x80);
  });

  it("note et vélocité tiennent sur sept bits", () => {
    // Le huitieme bit distingue un octet de statut d'un octet de donnee. Une
    // note a 200 poserait ce bit et la machine lirait un nouveau message.
    const p = buildMidiNotePacket("note-on", 200, 200, 0, 0);
    expect(p.data[1]).toBe(200 & 0x7f);
    expect(p.data[2]).toBe(200 & 0x7f);
    expect(p.data[1]).toBeLessThan(0x80);
    expect(p.data[2]).toBeLessThan(0x80);
  });

  it("le paquet fait exactement trois octets", () => {
    expect(buildMidiNotePacket("note-on", 60, 100, 0, 0).data).toHaveLength(3);
  });
});

describe("PANIC — l'arrêt d'urgence", () => {
  /**
   * C'est le bouton qu'on presse quand une note reste coincée sur la machine.
   * S'il oublie un canal, la note ne s'arrête pas et il faut débrancher.
   */
  const paquets = buildMidiPanicPackets(0);

  it("couvre les seize canaux, deux messages chacun", () => {
    expect(paquets).toHaveLength(32);
  });

  it("envoie All Notes Off (CC 123) sur chaque canal", () => {
    for (let ch = 0; ch < 16; ch++) {
      const trouve = paquets.some(
        (p) => p.data[0] === (0xb0 | ch) && p.data[1] === 123 && p.data[2] === 0,
      );
      expect(trouve, `canal ${ch} sans All Notes Off`).toBe(true);
    }
  });

  it("envoie Reset All Controllers (CC 121) sur chaque canal", () => {
    // Sans lui, une roue de modulation ou un pitch bend reste ou il etait.
    for (let ch = 0; ch < 16; ch++) {
      const trouve = paquets.some(
        (p) => p.data[0] === (0xb0 | ch) && p.data[1] === 121 && p.data[2] === 0,
      );
      expect(trouve, `canal ${ch} sans Reset All Controllers`).toBe(true);
    }
  });

  it("n'envoie que des Control Change", () => {
    for (const p of paquets) expect(p.data[0] & 0xf0).toBe(0xb0);
  });
});

describe("les messages temps réel", () => {
  it("respecte les octets de la spécification", () => {
    // 0xFA start, 0xFB continue, 0xFC stop, 0xF8 clock. Les intervertir ferait
    // repartir une machine du debut la ou on voulait reprendre.
    expect(buildMidiRealtimePacket("start", 0).data[0]).toBe(0xfa);
    expect(buildMidiRealtimePacket("continue", 0).data[0]).toBe(0xfb);
    expect(buildMidiRealtimePacket("stop", 0).data[0]).toBe(0xfc);
    expect(buildMidiRealtimePacket("clock", 0).data[0]).toBe(0xf8);
  });

  it("tient sur un seul octet", () => {
    expect(buildMidiRealtimePacket("start", 0).data).toHaveLength(1);
  });
});

describe("la fenêtre d'horloge", () => {
  it("cadence à 24 impulsions par noire", () => {
    // 120 BPM = 500 ms la noire, donc 500/24 entre deux impulsions.
    const f = buildMidiClockWindow(120, 4, 0);
    expect(f.intervalMs).toBeCloseTo(500 / 24, 10);
  });

  it("l'intervalle suit le tempo", () => {
    // Deux fois plus vite, deux fois moins d'attente.
    expect(buildMidiClockWindow(240, 1, 0).intervalMs).toBeCloseTo(
      buildMidiClockWindow(120, 1, 0).intervalMs / 2,
      10,
    );
  });

  it("produit le nombre d'impulsions demandé, régulièrement espacées", () => {
    const f = buildMidiClockWindow(120, 6, 1000);
    expect(f.packets).toHaveLength(6);
    f.packets.forEach((p, i) => {
      expect(p.data[0]).toBe(0xf8);
      expect(p.timestamp).toBeCloseTo(1000 + i * f.intervalMs, 10);
    });
  });

  it("LIMITE CONNUE : un tempo nul produit des horodatages infinis", () => {
    /**
     * Le module ne borne pas le tempo. `rack-bus` le fait — `bornerBpm` entre
     * BPM_MIN et BPM_MAX — et c'est lui qui alimente l'horloge en pratique.
     *
     * Ce test ne valide pas ce comportement : il le CONSTATE, pour que
     * personne ne le decouvre sur une machine. Si un jour le tempo est borne
     * ici, ce test tombera et devra etre reecrit.
     */
    const f = buildMidiClockWindow(0, 2, 0);
    expect(f.intervalMs).toBe(Infinity);
    expect(f.packets[1].timestamp).toBe(Infinity);
  });
});

describe("la lecture d'un paquet reçu", () => {
  it("reconnaît une note enfoncée et une note relâchée", () => {
    expect(parseMidiNotePacket([0x90, 60, 100])).toEqual({
      action: "note-on", note: 60, velocity: 100, channel: 0,
    });
    expect(parseMidiNotePacket([0x80, 60, 64])).toEqual({
      action: "note-off", note: 60, velocity: 64, channel: 0,
    });
  });

  it("traite un note-on de vélocité nulle comme un relâchement", () => {
    // Convention MIDI que beaucoup de claviers utilisent au lieu de 0x80.
    // La rater laisse la note sonner indefiniment.
    expect(parseMidiNotePacket([0x90, 60, 0])).toEqual({
      action: "note-off", note: 60, velocity: 0, channel: 0,
    });
  });

  it("retrouve le canal", () => {
    expect(parseMidiNotePacket([0x95, 60, 100])?.channel).toBe(5);
    expect(parseMidiNotePacket([0x8f, 60, 100])?.channel).toBe(15);
  });

  it("ignore ce qui n'est pas une note", () => {
    expect(parseMidiNotePacket([0xb0, 123, 0])).toBeNull(); // control change
    expect(parseMidiNotePacket([0xf8])).toBeNull();          // horloge
    expect(parseMidiNotePacket([])).toBeNull();
    expect(parseMidiNotePacket([0x90, 60])).toBeNull();      // tronque
  });

  it("relit ce que le module a écrit", () => {
    // L'aller-retour attrape une divergence entre construction et lecture que
    // ni l'un ni l'autre ne montrerait seul.
    for (const canal of [0, 7, 15]) {
      const p = buildMidiNotePacket("note-on", 64, 90, canal, 0);
      expect(parseMidiNotePacket(p.data)).toEqual({
        action: "note-on", note: 64, velocity: 90, channel: canal,
      });
    }
  });
});

describe("les messages du Hub", () => {
  it("chaque fabricant pose son type, et son garde le reconnaît", () => {
    const note = createHubNoteMessage("note-on", 60, 100, 0, 42);
    const transport = createHubTransportMessage("start", 120, 42);
    const panic = createHubPanicMessage(42);

    expect(isHubNoteMessage(note)).toBe(true);
    expect(isHubTransportMessage(transport)).toBe(true);
    expect(isHubPanicMessage(panic)).toBe(true);
  });

  it("les gardes ne se confondent pas entre eux", () => {
    // Trois gardes qui rendraient tous `true` laisseraient un message de
    // transport etre traite comme une note.
    const note = createHubNoteMessage("note-on", 60, 100, 0, 42);
    expect(isHubTransportMessage(note)).toBe(false);
    expect(isHubPanicMessage(note)).toBe(false);
  });

  it("les gardes survivent à null et aux objets étrangers", () => {
    for (const garde of [isHubNoteMessage, isHubTransportMessage, isHubPanicMessage]) {
      expect(garde(null)).toBeFalsy();
      expect(garde(undefined)).toBeFalsy();
      expect(garde({})).toBeFalsy();
    }
  });
});

describe("le cache du Hub", () => {
  it("l'enveloppe porte la donnée et un horodatage", () => {
    const e = createHubCacheEnvelope({ a: 1 });
    expect(e.data).toEqual({ a: 1 });
    expect(typeof e.timestamp).toBe("number");
  });

  it("relit une enveloppe et rend la donnée seule", () => {
    const brut = JSON.stringify(createHubCacheEnvelope({ nom: "AZOTH" }));
    expect(readHubCache<{ nom: string }>(brut)).toEqual({ nom: "AZOTH" });
  });

  it("accepte aussi une donnée sans enveloppe", () => {
    expect(readHubCache<number[]>("[1,2,3]")).toEqual([1, 2, 3]);
  });

  it("rend null plutôt que de jeter sur une entrée illisible", () => {
    // Un cache corrompu ne doit pas empecher l'application de demarrer.
    expect(readHubCache("")).toBeNull();
    expect(readHubCache("pas du json")).toBeNull();
    expect(readHubCache("{incomplet")).toBeNull();
  });
});
