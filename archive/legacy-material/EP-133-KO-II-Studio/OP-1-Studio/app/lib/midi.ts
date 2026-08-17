export type MidiNoteMessage = { type: "note_on" | "note_off"; note: number; velocity: number };

export function decodeMidiNote(data: Uint8Array | null): MidiNoteMessage | null {
  if (!data || data.length < 3) return null;
  const status = data[0] & 0xf0;
  const isNoteOn = status === 0x90 && data[2] > 0;
  const isNoteOff = status === 0x80 || (status === 0x90 && data[2] === 0);
  if (!isNoteOn && !isNoteOff) return null;
  return { type: isNoteOn ? "note_on" : "note_off", note: data[1], velocity: data[2] };
}
