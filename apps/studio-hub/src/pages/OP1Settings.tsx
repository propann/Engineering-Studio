import { useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";
import { createLogger } from "@studio-hub/audio-bridge";
import { StudioMachinePanel } from "../../../op1-studio/app/components/StudioMachinePanel";

const log = createLogger("Hub.OP1Settings");

type ConsoleLine = {
  id: number;
  dir: "in" | "out";
  time: number;
  data: number[];
  label: string;
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteName = (n: number) => `${NOTE_NAMES[n % 12]}${Math.floor(n / 12) - 1}`;

/** Libelle lisible d'un message : sans ca la console n'affiche que des octets. */
function describeMidi(d: number[]): string {
  const status = d[0] ?? 0;
  const cmd = status & 0xf0;
  const ch = (status & 0x0f) + 1;
  if (status === 0xf8) return "clock";
  if (status === 0xfa) return "start";
  if (status === 0xfc) return "stop";
  if (status === 0xf0) return "sysex";
  if (cmd === 0x90 && d[2] > 0) return `note on  ${noteName(d[1])} vel ${d[2]} · ch${ch}`;
  if (cmd === 0x80 || (cmd === 0x90 && d[2] === 0)) return `note off ${noteName(d[1])} · ch${ch}`;
  if (cmd === 0xb0) return `cc ${d[1]} = ${d[2]} · ch${ch}`;
  if (cmd === 0xc0) return `program ${d[1]} · ch${ch}`;
  if (cmd === 0xe0) return `pitch ${((d[2] << 7) | d[1]) - 8192} · ch${ch}`;
  if (cmd === 0xa0) return `aftertouch ${noteName(d[1])} ${d[2]} · ch${ch}`;
  if (cmd === 0xd0) return `pression ${d[1]} · ch${ch}`;
  return "inconnu";
}

const hex = (d: number[]) => d.map((b) => b.toString(16).padStart(2, "0")).join(" ");
const CONSOLE_LIMIT = 200;

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
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [showClock, setShowClock] = useState(false);
  const outputsRef = useRef<any[]>([]);
  const lineIdRef = useRef(0);
  const screenRef = useRef<HTMLDivElement>(null);

  const pushLine = (dir: "in" | "out", data: number[]) => {
    lineIdRef.current += 1;
    const entry: ConsoleLine = {
      id: lineIdRef.current,
      dir,
      time: Date.now(),
      data,
      label: describeMidi(data),
    };
    // Fenetre bornee : l'horloge seule produit 24 messages par noire.
    setLines((prev) => [...prev, entry].slice(-CONSOLE_LIMIT));
  };

  useEffect(() => {
    let access: any = null;

    const handle = (portName: string) => (msg: any) => {
      const data = Array.from(msg.data as Uint8Array) as number[];
      // L'horloge de transport arrive en continu et écraserait en boucle le
      // message que l'apprentissage doit capturer. Elle reste visible dans la
      // console si on l'y autorise, mais ne remonte pas au panneau.
      if (data[0] >= 0xf8) {
        pushLine("in", data);
        return;
      }

      // Nouvelle référence à chaque message, même octets identiques : le
      // panneau s'appuie dessus pour distinguer deux appuis successifs sur
      // la même touche.
      setLastRawMidiIn([...data]);
      pushLine("in", data);

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

  // Suivre le bas de la console, sauf si l'utilisateur a remonte pour lire.
  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const sendMidi = (data: number[]) => {
    pushLine("out", data);
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
          <p>
            Le clavier se joue aussi au clavier de l'ordinateur : la lettre
            inscrite en bas de chaque touche est celle à presser sur{" "}
            <em>votre</em> disposition. Attention, ce mappage diffère de celui
            du rack audio.
          </p>
        </header>

        {/* Ecran OP-1 : la console MIDI y defile. Reprend la trame de
            l'afficheur de la machine — cadre sombre, coins arrondis, texte
            monospace colore selon le sens du message. */}
        <div className="op1-screen">
          <div className="op1-screen-bezel">
            <div className="op1-screen-glass">
              <div className="op1-screen-bar">
                <span className={`op1-led ${ports.length ? "on" : ""}`} />
                <span className="op1-screen-title">MIDI CONSOLE</span>
                <span className="op1-screen-meta">{status}</span>
              </div>

              <div className="op1-screen-body" ref={screenRef}>
                {lines.length === 0 ? (
                  <p className="op1-screen-empty">
                    En attente. Jouez une touche sur l'OP-1, ou cliquez le
                    clavier ci-dessous.
                  </p>
                ) : (
                  lines
                    .filter((l) => showClock || l.data[0] < 0xf8)
                    .map((l) => (
                      <div key={l.id} className={`op1-line op1-line-${l.dir}`}>
                        <span className="op1-line-time">
                          {new Date(l.time).toLocaleTimeString("fr-FR", { hour12: false })}
                        </span>
                        <span className="op1-line-dir">{l.dir === "in" ? "IN " : "OUT"}</span>
                        <span className="op1-line-hex">{hex(l.data)}</span>
                        <span className="op1-line-label">{l.label}</span>
                      </div>
                    ))
                )}
              </div>

              <div className="op1-screen-foot">
                <span>{lines.length} msg</span>
                <label className="op1-screen-toggle">
                  <input
                    type="checkbox"
                    checked={showClock}
                    onChange={(e) => setShowClock(e.target.checked)}
                  />
                  horloge
                </label>
                <button
                  type="button"
                  className="op1-screen-btn"
                  onClick={() => setLines([])}
                  disabled={!lines.length}
                >
                  vider
                </button>
                <button
                  type="button"
                  className="op1-screen-btn"
                  onClick={() => {
                    const txt = lines
                      .map(
                        (l) =>
                          `${new Date(l.time).toISOString()}\t${l.dir.toUpperCase()}\t${hex(l.data)}\t${l.label}`
                      )
                      .join("\n");
                    const url = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `midi-op1-${Date.now()}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  disabled={!lines.length}
                >
                  exporter
                </button>
              </div>
            </div>
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
