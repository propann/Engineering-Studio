import { useEffect, useRef, useState } from "react";
import { buildMidiClockWindow, buildMidiRealtimePacket } from "@studio-hub/midi-bridge";

type SyncOutput = { id: string; name: string; output: MIDIOutput };

function isTargetOutput(output: MIDIOutput) {
  return output.state === "connected" && /OP[- ]?1|EP[- ]?133|K[.]O[.]?[- ]?II/i.test(output.name || "");
}

/**
 * Small, deliberately explicit MIDI master for the two connected machines.
 * It only sends realtime transport bytes; it never writes projects or SysEx.
 */
export function MidiSyncPanel() {
  const [outputs, setOutputs] = useState<SyncOutput[]>([]);
  const [status, setStatus] = useState("Aucune sortie MIDI détectée");
  const [bpm, setBpm] = useState(120);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const runningRef = useRef(false);
  const nextTickRef = useRef(0);
  const outputsRef = useRef<SyncOutput[]>([]);

  function clearTimer() {
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
  }

  function send(type: "start" | "stop") {
    // Web MIDI cannot retract packets already scheduled. Put Stop after the
    // current short clock window so no clock is delivered after transport stop.
    const timestamp = type === "stop" ? Math.max(performance.now(), nextTickRef.current) : performance.now();
    const packet = buildMidiRealtimePacket(type, timestamp);
    outputsRef.current.forEach(({ output }) => output.send(packet.data, packet.timestamp));
  }

  function scheduleClock() {
    if (!runningRef.current) return;
    const now = performance.now();
    const windowStart = Math.max(now, nextTickRef.current);
    const clock = buildMidiClockWindow(bpm, 4, windowStart);
    clock.packets.forEach((packet) => {
      outputsRef.current.forEach(({ output }) => output.send(packet.data, packet.timestamp));
    });
    nextTickRef.current = windowStart + clock.packets.length * clock.intervalMs;
    timerRef.current = window.setTimeout(scheduleClock, Math.max(5, nextTickRef.current - performance.now() - 25));
  }

  async function connect() {
    if (!("requestMIDIAccess" in navigator)) {
      setStatus("Web MIDI indisponible : utilise Chrome ou Chromium.");
      return;
    }
    try {
      const access = await navigator.requestMIDIAccess();
      const nextOutputs = [...access.outputs.values()]
        .filter(isTargetOutput)
        .map((output) => ({ id: output.id, name: output.name || output.id, output }));
      outputsRef.current = nextOutputs;
      setOutputs(nextOutputs);
      setStatus(nextOutputs.length >= 2 ? "Les deux sorties sont prêtes." : "Branche les sorties OP‑1 et EP‑133.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Autorisation MIDI refusée.");
    }
  }

  function start() {
    if (outputsRef.current.length < 2 || runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    const startAt = performance.now() + 50;
    const packet = buildMidiRealtimePacket("start", startAt);
    outputsRef.current.forEach(({ output }) => output.send(packet.data, packet.timestamp));
    nextTickRef.current = startAt + 60_000 / bpm / 24;
    scheduleClock();
    setStatus(`Synchronisation en cours à ${bpm} BPM.`);
  }

  function stop() {
    if (!runningRef.current) return;
    runningRef.current = false;
    clearTimer();
    send("stop");
    setRunning(false);
    setStatus("Synchronisation arrêtée.");
  }

  useEffect(() => () => {
    runningRef.current = false;
    clearTimer();
    if (outputsRef.current.length) send("stop");
  }, []);

  useEffect(() => {
    if (!runningRef.current) return;
    clearTimer();
    nextTickRef.current = performance.now() + 50;
    scheduleClock();
  }, [bpm]);

  return (
    <section className="midi-sync-panel" id="midi-sync">
      <div className="midi-sync-header">
        <div>
          <span className="section-kicker">TRANSPORT CENTRAL</span>
          <h2>Jouer OP‑1 et EP‑133 ensemble</h2>
          <p className="muted">Le Hub devient le métronome commun : tempo, démarrage et arrêt partent vers les deux machines.</p>
        </div>
        <span className={`sync-status ${running ? "running" : ""}`}>{running ? "● EN SYNCHRO" : "○ EN ATTENTE"}</span>
      </div>
      <div className="midi-sync-grid">
        <div className="midi-sync-card">
          <label className="sync-field">Tempo (BPM)
            <input type="number" min={30} max={240} step={1} value={bpm} disabled={running} onChange={(event) => setBpm(Math.max(30, Math.min(240, Number(event.target.value) || 120)))} />
          </label>
          <button className="secondary-button" onClick={() => void connect()}>{outputs.length ? "Actualiser les sorties" : "Connecter les machines"}</button>
          <div className="sync-outputs" aria-live="polite">
            {outputs.length ? outputs.map((output) => <span key={output.id}>✓ {output.name}</span>) : <span>{status}</span>}
          </div>
          <div className="sync-actions">
            <button className="primary-button" disabled={outputs.length < 2 || running} onClick={start}>Démarrer les deux</button>
            <button className="secondary-button" disabled={!running} onClick={stop}>Arrêter</button>
          </div>
          {outputs.length > 0 && <p className="sync-status-text">{status}</p>}
        </div>
        <div className="midi-sync-help">
          <strong>Pour le premier essai</strong>
          <ol>
            <li>Branche les deux machines en USB sur cet ordinateur.</li>
            <li>Autorise les sorties nommées OP‑1 et EP‑133.</li>
            <li>Active l’écoute de l’horloge externe sur les machines.</li>
            <li>Lance ici, puis joue les séquences sur chaque outil.</li>
          </ol>
          <p>Cette commande n’envoie ni sauvegarde, ni sample, ni firmware : uniquement Start, horloge MIDI 24 PPQN et Stop.</p>
        </div>
      </div>
    </section>
  );
}
