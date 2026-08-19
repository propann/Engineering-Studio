import { useState, useMemo } from 'react';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface SlimKeyboardBarProps {
  selectedNote: number; // MIDI note number (default 60 = C3 / C4)
  activePadName?: string;
  onSelectNote: (midiNote: number, noteName: string) => void;
  onPreviewNote?: (midiNote: number) => void;
}

export function SlimKeyboardBar(props: SlimKeyboardBarProps) {
  const [baseOctave, setBaseOctave] = useState(3); // Octave 3 (C3 = 60)
  const [activePressedNote, setActivePressedNote] = useState<number | null>(null);

  // Generate 2 octaves of keys starting from baseOctave (e.g. C3 to B4 = 24 keys)
  const keys = useMemo(() => {
    const list = [];
    const startMidi = (baseOctave + 1) * 12; // C3 = 60
    for (let i = 0; i < 25; i++) {
      const midi = startMidi + i;
      const noteIndex = midi % 12;
      const octave = Math.floor(midi / 12) - 1;
      const name = `${NOTE_NAMES[noteIndex]}${octave}`;
      const isBlack = NOTE_NAMES[noteIndex].includes('#');
      list.push({ midi, name, isBlack, noteIndex, octave });
    }
    return list;
  }, [baseOctave]);

  const handleKeyClick = (midi: number, name: string) => {
    setActivePressedNote(midi);
    props.onSelectNote(midi, name);
    if (props.onPreviewNote) {
      props.onPreviewNote(midi);
    }
    setTimeout(() => setActivePressedNote(null), 250);
  };

  const selectedNoteName = useMemo(() => {
    const noteIndex = props.selectedNote % 12;
    const octave = Math.floor(props.selectedNote / 12) - 1;
    return `${NOTE_NAMES[noteIndex]}${octave}`;
  }, [props.selectedNote]);

  return (
    <div className="slim-keyboard-container">
      <div className="slim-keyboard-header">
        <div className="slim-keyboard-info">
          <span>🎹 CLAVIER ÉTROIT (SÉLECTION DE NOTE)</span>
          <b>NOTE: {selectedNoteName} ({props.selectedNote})</b>
          {props.activePadName && <small>PAD: {props.activePadName}</small>}
        </div>
        <div className="slim-keyboard-octaves">
          <button
            disabled={baseOctave <= 0}
            onClick={() => setBaseOctave((prev) => Math.max(0, prev - 1))}
            title="Octave inférieure"
          >
            ◀ OCT -
          </button>
          <span>OCTAVE {baseOctave}</span>
          <button
            disabled={baseOctave >= 7}
            onClick={() => setBaseOctave((prev) => Math.min(7, prev + 1))}
            title="Octave supérieure"
          >
            OCT + ▶
          </button>
        </div>
      </div>

      {/* Ultra-slim piano keys strip */}
      <div className="slim-keyboard-strip">
        {keys.map((k) => (
          <button
            key={k.midi}
            className={`slim-key ${k.isBlack ? 'black' : 'white'} ${
              props.selectedNote === k.midi ? 'selected' : ''
            } ${activePressedNote === k.midi ? 'pressed' : ''}`}
            onClick={() => handleKeyClick(k.midi, k.name)}
            title={`Note ${k.name} (MIDI ${k.midi})`}
          >
            {!k.isBlack && <small>{k.name}</small>}
          </button>
        ))}
      </div>
    </div>
  );
}
