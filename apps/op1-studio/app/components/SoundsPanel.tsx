import type { ReactNode } from "react";
import { SoundControlsPanel } from "./SoundControlsPanel";
import { SoundLibraryIndex } from "./SoundLibraryIndex";
import { SampleEditorPanel } from "./SampleEditorPanel";

type SoundsIcon = (props: { name: "archive" | "plug" | "tape" | "wave" | "download" | "check"; size?: number }) => ReactNode;

// Grille 24 pads retirée de cette fenêtre (13 août 2026) : la bibliothèque à
// deux colonnes (Son machine / Son ordinateur) dans SoundLibraryIndex couvre
// déjà toutes les catégories. Le composant SoundPadGrid reste disponible
// pour un futur usage dédié (Exercices/finger drumming), juste plus monté
// ici. Le bandeau "sound-categories" (compteurs figés) est retiré aussi :
// les compteurs réels sont maintenant dans chaque colonne de la bibliothèque.
export function SoundsPanel({ Icon, ready, libraryHandle, onPreparePack, onTransfer, onSamplePrepared }: { Icon: SoundsIcon; ready: boolean; libraryHandle?: FileSystemDirectoryHandle | null; onPreparePack: () => void; onTransfer: () => void; onSamplePrepared?: () => void }) {
  return <div className="tool-body"><SampleEditorPanel Icon={Icon} onPrepared={onSamplePrepared} /><SoundControlsPanel Icon={Icon} onPrepared={onSamplePrepared} /><SoundLibraryIndex libraryHandle={libraryHandle} /><div className="pack-builder"><div className="mod-section-heading"><div><span className="section-label">PACK À PRÉPARER</span><strong>Pack OP-1 · User Library</strong></div><small>{ready ? "PRÊT" : "BROUILLON"}</small></div><label><input type="checkbox" defaultChecked /> Samples synth · `synth/user`</label><label><input type="checkbox" defaultChecked /> Samples drum · `drum/user`</label><label><input type="checkbox" defaultChecked /> Pistes Tape · `tape`</label><label><input type="checkbox" /> Faces Album · `album`</label></div><div className="editor-footer"><span>{ready ? "Pack vérifié et prêt pour copie" : "Sélection locale · aucune copie exécutée"}</span><button className="primary-action" onClick={onPreparePack}><Icon name="archive" />Préparer le pack</button></div><div className="sound-transfer-panel"><div><span className="section-label">TRANSFERT OP-1</span><strong>Copier les sons préparés</strong><small>La sauvegarde doit être validée dans Sauvegardes avant toute copie.</small></div><button className="secondary-action" onClick={onTransfer}><Icon name="plug" />Préparer le transfert</button></div></div>;
}
