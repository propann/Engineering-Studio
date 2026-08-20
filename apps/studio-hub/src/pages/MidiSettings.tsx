import { TopBar } from "../components/TopBar";
import { MidiSyncPanel } from "../MidiSyncPanel";

/**
 * Page « Synchronisation MIDI » du menu Réglages.
 *
 * MidiSyncPanel existait depuis longtemps — 368 lignes fonctionnelles — mais
 * n'était monté nulle part : `openTool` n'avait aucun cas pour l'entrée
 * `midi`, qui retombait sur une modale purement descriptive. Le panneau était
 * donc du code mort et l'entrée de menu un cul-de-sac.
 */
export default function MidiSettings() {
  return (
    <div className="studio-app-wrapper">
      <TopBar activePage="midi-settings" />
      <main className="midi-settings-page">
        <header className="midi-settings-head">
          <h1>Synchronisation MIDI</h1>
          <p>
            Horloge de transport, notes de test et arrêt d'urgence, envoyés aux
            machines connectées. Aucune écriture de projet ni de SysEx.
          </p>
        </header>
        <MidiSyncPanel />
      </main>
    </div>
  );
}
