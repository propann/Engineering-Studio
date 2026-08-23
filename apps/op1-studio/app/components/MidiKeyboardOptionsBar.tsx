import { useState } from "react";
import { FAMILLES, NOMS_GAMMES, NOMS_NOTES, type Gamme } from "../../../../packages/musique/gammes";
import { NOMS_MOTIFS, ORDRE_MOTIFS, type Motif } from "../../../../packages/musique/arpege";
import { ORDRE_DIVISIONS, type Division } from "../../../../packages/musique/divisions";

export type ChordMode = "off" | "major" | "minor" | "seventh" | "power5" | "octave";

export interface MidiKeyboardOptions {
  // Scale Quantizer
  scaleEnabled: boolean;
  scaleRoot: number; // 60 = C4
  scaleType: Gamme;

  // Arpeggiator
  arpEnabled: boolean;
  arpPattern: Motif;
  arpDivision: Division;
  arpOctaves: number;
  arpLatch: boolean;

  // Performance / Keyboard
  octaveShift: number; // -3 to +3
  transpose: number; // -12 to +12
  fixedVelocity: boolean;
  velocityValue: number;
  chordMode: ChordMode;
}

export const DEFAULT_MIDI_KEYBOARD_OPTIONS: MidiKeyboardOptions = {
  scaleEnabled: false,
  scaleRoot: 60, // C4
  scaleType: "majeure",
  arpEnabled: false,
  arpPattern: "haut",
  arpDivision: "1/8",
  arpOctaves: 1,
  arpLatch: false,
  octaveShift: 0,
  transpose: 0,
  fixedVelocity: false,
  velocityValue: 100,
  chordMode: "off",
};

export function MidiKeyboardOptionsBar({
  options,
  onChange,
  onPanic,
  tempo = 90,
  isOpen,
  onToggleOpen,
}: {
  options: MidiKeyboardOptions;
  onChange: (next: Partial<MidiKeyboardOptions>) => void;
  onPanic?: () => void;
  tempo?: number;
  isOpen: boolean;
  onToggleOpen: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"scale" | "arp" | "keyboard">("scale");

  const rootNoteName = NOMS_NOTES[options.scaleRoot % 12];
  const scaleName = NOMS_GAMMES[options.scaleType] || options.scaleType;

  return (
    <div className="midi-options-container" aria-label="Options Clavier MIDI et Gammes">
      {/* Quick summary bar / launcher header */}
      <div className="midi-options-bar-strip">
        <button
          type="button"
          className={`midi-options-toggle-btn ${isOpen ? "is-open" : ""}`}
          onClick={onToggleOpen}
          aria-expanded={isOpen}
          title="Ouvrir le panneau des gammes, arpégiateur et options clavier"
        >
          <span className="midi-options-icon">🎹</span>
          <span className="midi-options-title">OPTIONS CLAVIER & JEU MIDI</span>
          <span className="midi-options-badges">
            <span className={`midi-opt-badge ${options.scaleEnabled ? "is-active" : ""}`}>
              {options.scaleEnabled ? `Gamme: ${rootNoteName} ${scaleName.split(" ")[0]}` : "Gamme: Chromatique"}
            </span>
            <span className={`midi-opt-badge ${options.arpEnabled ? "is-active" : ""}`}>
              {options.arpEnabled ? `Arp: ${options.arpDivision} · ${options.arpPattern}` : "Arp: Off"}
            </span>
            <span className="midi-opt-badge">
              Oct: {options.octaveShift >= 0 ? `+${options.octaveShift}` : options.octaveShift}
            </span>
            {options.chordMode !== "off" && (
              <span className="midi-opt-badge is-active">
                Accord: {options.chordMode}
              </span>
            )}
          </span>
          <span className="midi-options-chevron">{isOpen ? "▲ Fermer" : "▼ Déplier"}</span>
        </button>

        {onPanic && (
          <button
            type="button"
            className="midi-panic-quick-btn"
            onClick={onPanic}
            title="Couper toutes les notes actives (Panic All Notes Off)"
          >
            ⏹ PANIC
          </button>
        )}
      </div>

      {/* Expanded control drawer */}
      {isOpen && (
        <div className="midi-options-drawer">
          {/* Tabs header */}
          <div className="midi-options-drawer-tabs">
            <button
              type="button"
              className={`midi-tab-btn ${activeTab === "scale" ? "is-active" : ""}`}
              onClick={() => setActiveTab("scale")}
            >
              <span>🎼</span> Gammes & Quantification
              {options.scaleEnabled && <i className="active-dot" />}
            </button>
            <button
              type="button"
              className={`midi-tab-btn ${activeTab === "arp" ? "is-active" : ""}`}
              onClick={() => setActiveTab("arp")}
            >
              <span>⚡</span> Arpégiateur Sync ({tempo} BPM)
              {options.arpEnabled && <i className="active-dot" />}
            </button>
            <button
              type="button"
              className={`midi-tab-btn ${activeTab === "keyboard" ? "is-active" : ""}`}
              onClick={() => setActiveTab("keyboard")}
            >
              <span>🎛️</span> Transposition & Accords
              {options.chordMode !== "off" && <i className="active-dot" />}
            </button>
          </div>

          {/* Tab 1: Scale & Quantizer */}
          {activeTab === "scale" && (
            <div className="midi-tab-content midi-scale-section">
              <div className="midi-section-row">
                <label className="midi-toggle-label">
                  <input
                    type="checkbox"
                    checked={options.scaleEnabled}
                    onChange={(e) => onChange({ scaleEnabled: e.target.checked })}
                  />
                  <strong>Activer la Quantification de Gamme</strong>
                </label>
                <small className="midi-help-text">
                  Force toutes les notes jouées (clavier virtuel, touches PC, clavier MIDI externe) dans la gamme sélectionnée.
                </small>
              </div>

              <div className="midi-controls-grid">
                <div className="midi-control-field">
                  <label htmlFor="scale-root-select">Tonique / Racine :</label>
                  <select
                    id="scale-root-select"
                    value={options.scaleRoot}
                    disabled={!options.scaleEnabled}
                    onChange={(e) => onChange({ scaleRoot: Number(e.target.value) })}
                  >
                    {NOMS_NOTES.map((nom, idx) => (
                      <option key={nom} value={60 + idx}>
                        {nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="midi-control-field midi-field-wide">
                  <label htmlFor="scale-type-select">Mode / Gamme Musicale :</label>
                  <select
                    id="scale-type-select"
                    value={options.scaleType}
                    disabled={!options.scaleEnabled}
                    onChange={(e) => onChange({ scaleType: e.target.value as Gamme })}
                  >
                    {FAMILLES.map((famille) => (
                      <optgroup key={famille.nom} label={famille.nom}>
                        {famille.gammes.map((g) => (
                          <option key={g} value={g}>
                            {NOMS_GAMMES[g]}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick scale preset buttons */}
              <div className="midi-quick-pills">
                <span className="midi-pills-label">Accès direct :</span>
                {[
                  { label: "Majeure", type: "majeure" as Gamme },
                  { label: "Mineure", type: "mineure" as Gamme },
                  { label: "Penta Maj", type: "pentatonique_majeure" as Gamme },
                  { label: "Penta Min", type: "pentatonique_mineure" as Gamme },
                  { label: "Blues", type: "blues" as Gamme },
                  { label: "Dorien", type: "dorien" as Gamme },
                  { label: "Japonaise", type: "japonaise" as Gamme },
                  { label: "Arabe", type: "double_harmonique" as Gamme },
                ].map((preset) => (
                  <button
                    key={preset.type}
                    type="button"
                    className={`midi-quick-pill ${options.scaleType === preset.type && options.scaleEnabled ? "is-selected" : ""}`}
                    onClick={() => onChange({ scaleType: preset.type, scaleEnabled: true })}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Arpeggiator */}
          {activeTab === "arp" && (
            <div className="midi-tab-content midi-arp-section">
              <div className="midi-section-row">
                <div className="midi-toggle-row">
                  <label className="midi-toggle-label">
                    <input
                      type="checkbox"
                      checked={options.arpEnabled}
                      onChange={(e) => onChange({ arpEnabled: e.target.checked })}
                    />
                    <strong>Activer l’Arpégiateur</strong>
                  </label>
                  <label className="midi-toggle-label">
                    <input
                      type="checkbox"
                      checked={options.arpLatch}
                      disabled={!options.arpEnabled}
                      onChange={(e) => onChange({ arpLatch: e.target.checked })}
                    />
                    <span>Maintien (Latch)</span>
                  </label>
                </div>
                <small className="midi-help-text">
                  Joue séquentiellement les notes tenues, synchronisé sur le tempo {tempo} BPM de l’OP-1.
                </small>
              </div>

              <div className="midi-controls-grid">
                <div className="midi-control-field">
                  <label htmlFor="arp-pattern-select">Motif :</label>
                  <select
                    id="arp-pattern-select"
                    value={options.arpPattern}
                    disabled={!options.arpEnabled}
                    onChange={(e) => onChange({ arpPattern: e.target.value as Motif })}
                  >
                    {ORDRE_MOTIFS.map((m) => (
                      <option key={m} value={m}>
                        {NOMS_MOTIFS[m]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="midi-control-field">
                  <label htmlFor="arp-division-select">Vitesse / Division :</label>
                  <select
                    id="arp-division-select"
                    value={options.arpDivision}
                    disabled={!options.arpEnabled}
                    onChange={(e) => onChange({ arpDivision: e.target.value as Division })}
                  >
                    {ORDRE_DIVISIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="midi-control-field">
                  <label htmlFor="arp-octaves-select">Étendue Octaves :</label>
                  <select
                    id="arp-octaves-select"
                    value={options.arpOctaves}
                    disabled={!options.arpEnabled}
                    onChange={(e) => onChange({ arpOctaves: Number(e.target.value) })}
                  >
                    <option value={1}>1 Octave</option>
                    <option value={2}>2 Octaves</option>
                    <option value={3}>3 Octaves</option>
                    <option value={4}>4 Octaves</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Performance, Transposition & Chords */}
          {activeTab === "keyboard" && (
            <div className="midi-tab-content midi-perf-section">
              <div className="midi-controls-grid">
                <div className="midi-control-field">
                  <label>Décalage d’Octave :</label>
                  <div className="midi-stepper">
                    <button
                      type="button"
                      onClick={() => onChange({ octaveShift: Math.max(-3, options.octaveShift - 1) })}
                      disabled={options.octaveShift <= -3}
                    >
                      -
                    </button>
                    <strong>{options.octaveShift >= 0 ? `+${options.octaveShift}` : options.octaveShift}</strong>
                    <button
                      type="button"
                      onClick={() => onChange({ octaveShift: Math.min(3, options.octaveShift + 1) })}
                      disabled={options.octaveShift >= 3}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="midi-control-field">
                  <label>Transposition (demi-tons) :</label>
                  <div className="midi-stepper">
                    <button
                      type="button"
                      onClick={() => onChange({ transpose: Math.max(-12, options.transpose - 1) })}
                      disabled={options.transpose <= -12}
                    >
                      -
                    </button>
                    <strong>{options.transpose >= 0 ? `+${options.transpose} st` : `${options.transpose} st`}</strong>
                    <button
                      type="button"
                      onClick={() => onChange({ transpose: Math.min(12, options.transpose + 1) })}
                      disabled={options.transpose >= 12}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="midi-reset-btn"
                      onClick={() => onChange({ transpose: 0 })}
                      title="Remettre à zéro"
                    >
                      0
                    </button>
                  </div>
                </div>

                <div className="midi-control-field">
                  <label htmlFor="chord-mode-select">Générateur d’Accords :</label>
                  <select
                    id="chord-mode-select"
                    value={options.chordMode}
                    onChange={(e) => onChange({ chordMode: e.target.value as ChordMode })}
                  >
                    <option value="off">Désactivé (Note seule)</option>
                    <option value="major">Accord Majeur (1-3-5)</option>
                    <option value="minor">Accord Mineur (1-♭3-5)</option>
                    <option value="seventh">Accord 7ème (1-3-5-7)</option>
                    <option value="power5">Quinte / Power Chord (1-5)</option>
                    <option value="octave">Octave Doublée (+12)</option>
                  </select>
                </div>

                <div className="midi-control-field">
                  <label>Vélocité :</label>
                  <div className="midi-toggle-row">
                    <label className="midi-toggle-label">
                      <input
                        type="checkbox"
                        checked={options.fixedVelocity}
                        onChange={(e) => onChange({ fixedVelocity: e.target.checked })}
                      />
                      <span>Fixe ({options.velocityValue})</span>
                    </label>
                    {options.fixedVelocity && (
                      <input
                        type="range"
                        min="1"
                        max="127"
                        value={options.velocityValue}
                        onChange={(e) => onChange({ velocityValue: Number(e.target.value) })}
                        aria-label="Valeur de vélocité fixe"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
