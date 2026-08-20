import { useCallback, useState } from "react";
import { TopBar } from "../components/TopBar";
import { useWebMidi } from "../../../ep133-studio/src/core/midi/useWebMidi";
import type { MidiObservation } from "../../../ep133-studio/src/core/midi/useWebMidi";
import { MachineTestPage } from "../../../ep133-studio/src/pages/MachineTestPage";
import { EDITOR_GROUPS, type EditorGroup } from "../../../ep133-studio/src/core/project/exporters";

/**
 * Réglages > EP-133.
 *
 * Monte la page de test machine d'ep133-studio, qui porte déjà toute la
 * mécanique : observation des messages, assignation des contrôles, journal de
 * diagnostic téléchargeable.
 *
 * La connexion est demandée avec SysEx : sans lui la machine ne répond pas aux
 * interrogations d'état, et la page reste sur « Connecté MIDI » sans jamais
 * afficher les groupes actifs.
 */
export default function EP133Settings() {
  const [observations, setObservations] = useState<MidiObservation[]>([]);
  const [machineGroup, setMachineGroup] = useState<EditorGroup>("A");

  const handleObservation = useCallback((message: MidiObservation) => {
    // Les plus récentes en tête : MachineTestPage lit observations[0].
    // Fenêtre bornée, sinon une rafale de messages fait enfler la liste
    // indéfiniment.
    setObservations((prev) => [message, ...prev].slice(0, 200));
  }, []);

  const midi = useWebMidi(() => {}, handleObservation);

  // La machine s'adresse par index numerique ; l'interface travaille en
  // lettres A-D. EDITOR_GROUPS fait la conversion, comme dans ep133-studio.
  const selectGroup = useCallback(
    async (groupIndex: number) => {
      const fileId = await midi.selectMachineGroup(groupIndex);
      setMachineGroup(EDITOR_GROUPS[groupIndex]);
      return fileId;
    },
    [midi]
  );

  return (
    <div className="studio-app-wrapper">
      <TopBar activePage="ep133-settings" />
      <main className="machine-settings-page">
        <header className="machine-settings-head">
          <h1>EP-133 K.O. II</h1>
          <p>
            Observation des messages, assignation des contrôles et diagnostic.
            La connexion utilise SysEx : c'est ce qui permet d'interroger l'état
            de la machine, pas seulement de recevoir ses notes.
          </p>
        </header>

        <div className="machine-settings-status">
          <div className="mss-row">
            <span className="mss-label">ÉTAT</span>
            <span className={midi.connected ? "mss-ok" : "mss-warn"}>{midi.status}</span>
          </div>
          <div className="mss-row">
            <span className="mss-label">SYSEX</span>
            <span className={midi.sysexEnabled ? "mss-ok" : "mss-warn"}>
              {midi.sysexEnabled ? "actif" : "inactif — cliquez Connecter"}
            </span>
          </div>
          <div className="mss-row">
            <span className="mss-label">MESSAGES</span>
            <span>{observations.length} observés</span>
          </div>
        </div>

        <MachineTestPage
          connected={midi.connected}
          sysexEnabled={midi.sysexEnabled}
          inputNames={midi.inputNames}
          observations={observations}
          machineGroup={machineGroup}
          onBack={() => (window as any).navigateMaquette("outils")}
          // connectMonitor et non connect : c'est cette voie qui demande
          // requestMIDIAccess({ sysex: true }).
          onConnect={() => void midi.connectMonitor()}
          onSendLearned={midi.sendLearnedMessage}
          onSelectMachineGroup={selectGroup}
        />
      </main>
    </div>
  );
}
