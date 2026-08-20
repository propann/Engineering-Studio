import { useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";
import { createLogger } from "@studio-hub/audio-bridge";
import { StudioMachinePanel } from "../../../op1-studio/app/components/StudioMachinePanel";

const log = createLogger("Hub.OP1Settings");

/**
 * Réglages > OP-1.
 *
 * Monte le clavier joué d'op1-studio (`StudioMachinePanel`), qui porte déjà
 * son mode de réglage : bouton « config », puis on clique un contrôle et on
 * l'actionne sur la machine — le message reçu devient sa signature. Les
 * liaisons sont conservées sous `op1-studio-control-map-v1`.
 *
 * À ne pas confondre avec KeyboardEditor, qui sert à *fabriquer* la
 * disposition du clavier (peinture de la grille), pas à la régler.
 *
 * Cette page n'apporte que ce qui manquait ici : l'accès Web MIDI.
 */
export default function OP1Settings() {
  const [pressedNotes, setPressedNotes] = useState<number[]>([]);
  const [lastRawMidiIn, setLastRawMidiIn] = useState<number[] | null>(null);
  const [status, setStatus] = useState("initialisation…");
  const [ports, setPorts] = useState<string[]>([]);
  const outputsRef = useRef<any[]>([]);

  useEffect(() => {
    let access: any = null;

    const handle = (portName: string) => (msg: any) => {
      const data = Array.from(msg.data as Uint8Array) as number[];
      // L'horloge de transport arrive en continu et écraserait en boucle le
      // message que l'apprentissage doit capturer.
      if (data[0] >= 0xf8) return;

      // Nouvelle référence à chaque message, même octets identiques : le
      // panneau s'appuie dessus pour distinguer deux appuis successifs sur
      // la même touche.
      setLastRawMidiIn([...data]);

      const command = data[0] & 0xf0;
      const note = data[1];
      if (command === 0x90 && data[2] > 0) {
        setPressedNotes((prev) => (prev.includes(note) ? prev : [...prev, note]));
      } else if (command === 0x80 || (command === 0x90 && data[2] === 0)) {
        setPressedNotes((prev) => prev.filter((n) => n !== note));
      }
    };

    const refresh = () => {
      if (!access) return;
      const names: string[] = [];
      access.inputs.forEach((input: any) => {
        try {
          void input.open?.();
        } catch {
          /* port pris par une autre application */
        }
        input.onmidimessage = handle(input.name ?? "port inconnu");
        if (input.name) names.push(input.name);
      });
      outputsRef.current = Array.from(access.outputs.values());
      setPorts(names);
      setStatus(
        names.length
          ? `${names.length} entrée(s) : ${names.join(" · ")}`
          : "accès accordé, aucune entrée détectée"
      );
      log.info("Entrées MIDI", { names });
    };

    if (!navigator.requestMIDIAccess) {
      setStatus("Web MIDI indisponible (navigateur ou contexte non sécurisé)");
      return;
    }

    navigator
      .requestMIDIAccess()
      .then((a) => {
        access = a;
        refresh();
        (a as any).onstatechange = refresh;
      })
      .catch((error) => {
        setStatus(`accès refusé : ${(error as any)?.message ?? error}`);
        log.warn("requestMIDIAccess refusé", error);
      });

    return () => {
      // onstatechange doit partir aussi : sans ca il survit au demontage et
      // reattache nos gestionnaires par-dessus ceux de la page suivante.
      if (access) {
        access.onstatechange = null;
        access.inputs.forEach((input: any) => {
          input.onmidimessage = null;
        });
      }
    };
  }, []);

  const sendMidi = (data: number[]) => {
    for (const out of outputsRef.current) {
      try {
        out.send(data);
      } catch (error) {
        log.warn("Envoi MIDI échoué", { port: out.name, error });
      }
    }
  };

  return (
    <div className="studio-app-wrapper">
      <TopBar activePage="op1-settings" />
      <main className="machine-settings-page">
        <header className="machine-settings-head">
          <h1>OP-1</h1>
          <p>
            Cliquez <strong>config</strong> sur le clavier, puis un contrôle,
            puis actionnez-le sur la machine : le message reçu devient sa
            signature. Les liaisons sont conservées.
          </p>
        </header>

        <div className="machine-settings-status">
          <div className="mss-row">
            <span className="mss-label">MIDI</span>
            <span className={ports.length ? "mss-ok" : "mss-warn"}>{status}</span>
          </div>
          <div className="mss-row">
            <span className="mss-label">DERNIER MSG</span>
            <span className="mss-mono">
              {lastRawMidiIn
                ? lastRawMidiIn.map((b) => b.toString(16).padStart(2, "0")).join(" ")
                : "—"}
            </span>
          </div>
        </div>

        <StudioMachinePanel
          mode="midi"
          pressedNotes={pressedNotes}
          lastRawMidiIn={lastRawMidiIn}
          onSendMidi={sendMidi}
          onTogglePlayback={() => {}}
        />
      </main>
    </div>
  );
}
