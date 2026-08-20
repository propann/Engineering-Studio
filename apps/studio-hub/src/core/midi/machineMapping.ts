/**
 * Correspondances MIDI par machine.
 *
 * Le format d'assignation reprend celui de
 * `apps/ep133-studio/src/core/midi/controlMapping.ts` — même forme de
 * signature, même structure — pour que les deux applications puissent lire
 * les mêmes réglages sans conversion.
 *
 * Principe : apprentissage. On sélectionne un contrôle, on actionne quelque
 * chose sur la machine, le message reçu est capturé et lié au contrôle.
 * Aucune saisie manuelle de numéro de note ou de CC.
 */

export type MachineId = "op1" | "ep133";

/** Assignation d'un message MIDI à un contrôle. */
export interface ControlAssignment {
  /** Signature canonique : identifie le message indépendamment de sa vélocité. */
  signature: string;
  /** Octets bruts du message capturé, pour pouvoir le rejouer. */
  data: number[];
  /** Famille du message, pour l'affichage. */
  kind: "note" | "control" | "program" | "pitch" | "system" | "unknown";
  /** Nom du port par lequel il est arrivé. */
  port?: string;
  /** Horodatage de la capture. */
  learnedAt?: number;
}

export type AssignmentMap = Record<string, ControlAssignment>;

const STORAGE_KEYS: Record<MachineId, string> = {
  // Clé alignée sur celle d'ep133-studio : les deux applications partagent
  // réellement les mêmes assignations.
  ep133: "ep133-rhythm-hero:midi-control-map:v1",
  op1: "studio-hub:op1-midi-control-map:v1",
};

/**
 * Famille d'un message à partir de son octet de statut.
 */
export function kindOf(data: number[] | Uint8Array): ControlAssignment["kind"] {
  const status = data[0] ?? 0;
  if (status === 0xf0) return "system";
  const command = status & 0xf0;
  if (command === 0x80 || command === 0x90) return "note";
  if (command === 0xb0) return "control";
  if (command === 0xc0) return "program";
  if (command === 0xe0) return "pitch";
  if (status >= 0xf8) return "system";
  return "unknown";
}

/**
 * Signature canonique d'un message.
 *
 * La vélocité et la valeur de contrôleur sont volontairement exclues : une
 * touche jouée fort et la même touche jouée doucement doivent produire la
 * même signature, sinon l'apprentissage ne reconnaîtrait qu'un seul niveau.
 */
export function signatureOf(data: number[] | Uint8Array): string {
  const bytes = Array.from(data);
  const status = bytes[0] ?? 0;
  const channel = status & 0x0f;
  const kind = kindOf(bytes);

  if (kind === "note") return `note:ch${channel}:${bytes[1] ?? "-"}`;
  if (kind === "control") return `control:ch${channel}:${bytes[1] ?? "-"}`;
  if (kind === "program") return `program:ch${channel}:${bytes[1] ?? "-"}`;
  if (kind === "pitch") return `pitch:ch${channel}`;
  return `${kind}:${bytes.map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/** Rendu lisible d'une assignation. */
export function describeAssignment(a: ControlAssignment | undefined): string {
  if (!a) return "non assigné";
  const [, ch, value] = a.signature.split(":");
  const channel = ch?.replace("ch", "");
  switch (a.kind) {
    case "note":
      return `Note ${value} · canal ${Number(channel) + 1}`;
    case "control":
      return `CC ${value} · canal ${Number(channel) + 1}`;
    case "program":
      return `Program ${value} · canal ${Number(channel) + 1}`;
    case "pitch":
      return `Pitch bend · canal ${Number(channel) + 1}`;
    default:
      return a.signature;
  }
}

/** Octets bruts en hexadécimal, pour le diagnostic. */
export function formatBytes(data: number[] | Uint8Array): string {
  return Array.from(data)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

export function loadAssignments(machine: MachineId): AssignmentMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[machine]);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ControlAssignment | string>;
    // ep133 tolère des valeurs texte héritées : on les ignore plutôt que de
    // planter à la lecture.
    return Object.fromEntries(
      Object.entries(parsed).flatMap(([k, v]) => (typeof v === "string" ? [] : [[k, v]]))
    );
  } catch {
    return {};
  }
}

export function saveAssignments(machine: MachineId, map: AssignmentMap): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS[machine], JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
}

/**
 * Contrôle déjà lié à cette signature, s'il existe.
 * Sert à prévenir qu'une assignation va en écraser une autre.
 */
export function findConflict(map: AssignmentMap, signature: string, exceptId?: string): string | null {
  for (const [id, a] of Object.entries(map)) {
    if (id !== exceptId && a.signature === signature) return id;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Inventaire des contrôles par machine
// ---------------------------------------------------------------------------

export type ControlDef = {
  id: string;
  label: string;
  group: string;
  /** Valeur d'usine, affichée tant qu'aucun apprentissage n'a eu lieu. */
  hint?: string;
};

/**
 * Notes du clavier OP-1.
 * Reprises de op1-studio/lib/keyboardLayout.ts, qui documente — capture brute
 * à l'appui — que la première touche blanche envoie la note 53 (F3) et non 48.
 */
const OP1_WHITE = [53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76];
const OP1_BLACK = [54, 56, 58, 61, 63, 66, 68, 70, 73, 75];

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function midiNoteName(note: number): string {
  return `${NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
}

export function buildOp1Controls(): ControlDef[] {
  const keys = [...OP1_WHITE, ...OP1_BLACK]
    .sort((a, b) => a - b)
    .map((n) => ({
      id: `key:${n}`,
      label: midiNoteName(n),
      group: "Clavier",
      hint: `Note ${n}`,
    }));

  const encoders = ["bleu", "vert", "blanc", "orange"].map((c, i) => ({
    id: `encoder:${i + 1}`,
    label: `Encodeur ${c}`,
    group: "Encodeurs",
    hint: `CC ${70 + i}`,
  }));

  const transport = [
    ["play", "Lecture"],
    ["rec", "Enregistrement"],
    ["stop", "Arrêt"],
    ["rewind", "Retour"],
    ["forward", "Avance"],
  ].map(([id, label]) => ({ id: `transport:${id}`, label, group: "Transport" }));

  const modes = [
    ["synth", "Synth"],
    ["drum", "Drum"],
    ["tape", "Tape"],
    ["mixer", "Mixer"],
    ["seq", "Sequencer"],
  ].map(([id, label]) => ({ id: `mode:${id}`, label, group: "Modes" }));

  return [...modes, ...transport, ...encoders, ...keys];
}

export function buildEp133Controls(): ControlDef[] {
  const groups = (["A", "B", "C", "D"] as const).map((g) => ({
    id: `group:${g}`,
    label: `Groupe ${g}`,
    group: "Groupes",
  }));

  // Douze pads, numérotation de la machine.
  const pads = Array.from({ length: 12 }, (_, i) => ({
    id: `pad:${i}`,
    label: `Pad ${i + 1}`,
    group: "Pads",
    hint: `Note ${36 + i}`,
  }));

  const transport = [
    ["play", "Lecture"],
    ["stop", "Arrêt"],
    ["rec", "Enregistrement"],
  ].map(([id, label]) => ({ id: `transport:${id}`, label, group: "Transport" }));

  const knobs = [
    ["volume", "Volume"],
    ["filter", "Filtre"],
    ["fx", "Effet"],
  ].map(([id, label]) => ({ id: `knob:${id}`, label, group: "Potentiomètres" }));

  return [...groups, ...pads, ...transport, ...knobs];
}

export function controlsFor(machine: MachineId): ControlDef[] {
  return machine === "op1" ? buildOp1Controls() : buildEp133Controls();
}

export const MACHINE_LABELS: Record<MachineId, string> = {
  op1: "OP-1",
  ep133: "EP-133 K.O. II",
};

/** Reconnaissance du port correspondant à une machine, d'après son nom. */
export function portMatchesMachine(portName: string, machine: MachineId): boolean {
  return machine === "op1"
    ? /OP[- ]?1/i.test(portName)
    : /EP[- ]?133|K[.]?O[.]?[- ]?(II|2)/i.test(portName);
}
