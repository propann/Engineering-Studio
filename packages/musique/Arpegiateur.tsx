import { ORDRE_DIVISIONS, type Division } from "./divisions";
import { NOMS_MOTIFS, ORDRE_MOTIFS, type Motif } from "./arpege";
import { GATE_MAX, GATE_MIN } from "./divisions";
import { NOMS_NOTES, type Gamme } from "./gammes";
import { SelecteurGamme } from "./SelecteurGamme";

/**
 * Le rack MIDI — son interface.
 *
 * Chaque rack porte son interface dans son ventre. Celle-ci vivait dans
 * `MidiSyncPanel`, qui garde ce qui est vraiment a lui : l'horloge, les
 * sorties, l'envoi.
 *
 * Dans `packages/musique` et non dans le hub, pour la meme raison que
 * `SelecteurGamme` : un studio doit pouvoir le poser. Le moteur d'arpege reste
 * cote hote — c'est lui qui possede le tempo et sait a qui envoyer.
 *
 * **Controle, pas autonome.** Aucun etat interne : deux verites pour un seul
 * reglage seraient impossibles a diagnostiquer, et le clavier tenu doit rester
 * la ou l'envoi le lit.
 *
 * Les touches se maintiennent au clic. Un arpegiateur sans maintien demanderait
 * de garder trois doigts sur l'ecran.
 */
export type ProprietesArpegiateur = {
  actif: boolean;
  onActif: () => void;
  /** Une destination existe. Sans elle, demarrer n'aurait aucun effet audible. */
  pret: boolean;
  motif: Motif;
  onMotif: (motif: Motif) => void;
  gamme: Gamme;
  onGamme: (gamme: Gamme) => void;
  tonique: number;
  onTonique: (note: number) => void;
  division: Division;
  onDivision: (division: Division) => void;
  octaves: number;
  onOctaves: (octaves: number) => void;
  /** Longueur de note, en % du pas. 100 = notes liées, comme avant ce réglage. */
  gate: number;
  onGate: (gate: number) => void;
  notesTenues: number[];
  onBasculerNote: (note: number) => void;
  onToutRelacher: () => void;
  /** Prefixe de classes : chaque hote applique son propre style. */
  prefixe?: string;
};

export function Arpegiateur({
  actif, onActif, pret,
  motif, onMotif,
  gamme, onGamme,
  tonique, onTonique,
  division, onDivision,
  octaves, onOctaves,
  gate, onGate,
  notesTenues, onBasculerNote, onToutRelacher,
}: ProprietesArpegiateur) {
  return (
              <div className="arp-panneau">
    <div className="arp-tete">
      <strong>Arpégiateur</strong>
      <button
        type="button"
        className={`arp-bouton ${actif ? "actif" : ""}`}
        disabled={!pret && !actif}
        onClick={onActif}
      >
        {actif ? "■ Arrêter" : "▶ Démarrer"}
      </button>
    </div>
    <span className="arp-aide">
      Les notes choisies partent vers <strong>tout ce qui écoute</strong> — le rack
      de moteurs, l’OP‑1, l’EP‑133, et les machines branchées. En mode contrôleur,
      l’OP‑1 choisit les notes au lieu de les jouer.
    </span>
    <div className="arp-reglages">
      <label>Motif
        <select value={motif} onChange={(e) => onMotif(e.target.value as Motif)}>
          {ORDRE_MOTIFS.map((m) => <option key={m} value={m}>{NOMS_MOTIFS[m]}</option>)}
        </select>
      </label>
              <SelecteurGamme gamme={gamme} onGamme={onGamme} tonique={tonique} onTonique={onTonique} prefixe="arp-gamme" />
      <label>Vitesse
        <select value={division} onChange={(e) => onDivision(e.target.value as Division)}>
          {ORDRE_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>
      <label>Octaves
        <select value={octaves} onChange={(e) => onOctaves(Number(e.target.value))}>
          {[1, 2, 3, 4].map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
      {/* Longueur de note, en % du pas. A 100 la note court jusqu'au pas
          suivant — les pas sont lies, c'est le comportement d'origine. En
          dessous, elle est coupee avant : le jeu devient detache. */}
      <label title="Longueur de note en % du pas. 100 % = notes liées, en dessous = jeu détaché.">
        Longueur {gate}%
        <input
          type="range" min={GATE_MIN} max={GATE_MAX} step={5}
          value={gate}
          onChange={(e) => onGate(Number(e.target.value))}
        />
      </label>
    </div>
    <div className="arp-clavier">
      {Array.from({ length: 24 }, (_, d) => 48 + d).map((note) => (
        <button
          key={note}
          type="button"
          className={`arp-touche ${NOMS_NOTES[note % 12].includes("#") ? "noire" : ""} ${notesTenues.includes(note) ? "tenue" : ""}`}
          onClick={() => onBasculerNote(note)}
          title={`${NOMS_NOTES[note % 12]}${Math.floor(note / 12) - 1}`}
        >
          {NOMS_NOTES[note % 12]}
        </button>
      ))}
    </div>
    <div className="arp-pied">
      <span>{notesTenues.length ? `${notesTenues.length} note(s) tenue(s)` : "Aucune note tenue"}</span>
      <button type="button" className="secondary-button" onClick={onToutRelacher} disabled={!notesTenues.length}>
        Tout relâcher
      </button>
    </div>
              </div>
  );
}
