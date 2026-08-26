import { MidiSyncPanel } from "../MidiSyncPanel";
import { AppShell, PageHeader, StatusBadge } from "../ui";

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
    <AppShell activePage="midi-settings" className="midi-settings-page">
        <PageHeader
          eyebrow="ENGINEERING STUDIO · MIDI"
          title="Synchronisation MIDI"
          description="Horloge, transport, notes de test et arrêt d’urgence. Aucune écriture de projet ni de SysEx."
          onBack={() => (window as any).navigateMaquette("outils")}
          status={<StatusBadge tone="readonly">Contrôle uniquement</StatusBadge>}
        />
        <MidiSyncPanel />
    </AppShell>
  );
}
