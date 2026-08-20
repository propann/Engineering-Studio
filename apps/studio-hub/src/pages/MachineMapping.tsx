import { useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";
import { createLogger } from "@studio-hub/audio-bridge";
import {
  controlsFor,
  describeAssignment,
  findConflict,
  formatBytes,
  kindOf,
  loadAssignments,
  MACHINE_LABELS,
  portMatchesMachine,
  saveAssignments,
  signatureOf,
  type AssignmentMap,
  type ControlDef,
  type MachineId,
} from "../core/midi/machineMapping";

const log = createLogger("Hub.MachineMapping");

/**
 * Configuration des correspondances MIDI, une machine à la fois.
 *
 * Fonctionne par apprentissage : on choisit un contrôle, on actionne quelque
 * chose sur la machine, le message reçu lui est assigné. Pas de saisie
 * manuelle de numéro de note ou de CC — c'est la machine qui dicte.
 */
export default function MachineMapping() {
  const [machine, setMachine] = useState<MachineId>("op1");
  const [assignments, setAssignments] = useState<AssignmentMap>(() => loadAssignments("op1"));
  const [learning, setLearning] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string>("—");
  const [ports, setPorts] = useState<string[]>([]);
  const [midiStatus, setMidiStatus] = useState("initialisation…");
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  // Le gestionnaire MIDI est abonné une seule fois ; il lit l'état courant
  // via des refs, sinon chaque changement de sélection le ré-abonnerait.
  const learningRef = useRef<string | null>(null);
  const machineRef = useRef<MachineId>("op1");
  const assignmentsRef = useRef<AssignmentMap>(assignments);
  useEffect(() => {
    learningRef.current = learning;
  }, [learning]);
  useEffect(() => {
    machineRef.current = machine;
  }, [machine]);
  useEffect(() => {
    assignmentsRef.current = assignments;
  }, [assignments]);

  // Changement de machine : recharger ses assignations.
  useEffect(() => {
    setAssignments(loadAssignments(machine));
    setLearning(null);
  }, [machine]);

  const controls = useMemo(() => controlsFor(machine), [machine]);

  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const visible = q
      ? controls.filter(
          (c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
        )
      : controls;
    const byGroup = new Map<string, ControlDef[]>();
    for (const c of visible) {
      if (!byGroup.has(c.group)) byGroup.set(c.group, []);
      byGroup.get(c.group)!.push(c);
    }
    return Array.from(byGroup.entries());
  }, [controls, filter]);

  // ---------------------------------------------------------------------
  // Réception MIDI
  // ---------------------------------------------------------------------
  useEffect(() => {
    let access: any = null;

    const onMessage = (portName: string) => (msg: any) => {
      const data = Array.from(msg.data as Uint8Array) as number[];
      // L'horloge de transport arrive en continu et noierait l'affichage.
      if (data[0] >= 0xf8) return;

      const sig = signatureOf(data);
      setLastMessage(`${formatBytes(data)}   ${sig}   ← ${portName}`);

      const target = learningRef.current;
      if (!target) return;

      // Un note-off suit chaque note-on : l'ignorer, sinon l'apprentissage
      // enregistrerait systématiquement le relâchement.
      const isNoteOff = (data[0] & 0xf0) === 0x80 || ((data[0] & 0xf0) === 0x90 && data[2] === 0);
      if (isNoteOff) return;

      const current = assignmentsRef.current;
      const conflict = findConflict(current, sig, target);
      const next: AssignmentMap = {
        ...current,
        [target]: { signature: sig, data, kind: kindOf(data), port: portName, learnedAt: Date.now() },
      };
      if (conflict) delete next[conflict];

      setAssignments(next);
      saveAssignments(machineRef.current, next);
      setLearning(null);
      setNotice(
        conflict
          ? `Assigné. La liaison précédente de « ${conflict} » a été retirée : un même message ne peut piloter qu'un contrôle.`
          : "Assigné."
      );
      log.info("Assignation apprise", { control: target, signature: sig, port: portName });
    };

    const refresh = () => {
      if (!access) return;
      const names: string[] = [];
      access.inputs.forEach((input: any) => {
        try {
          void input.open?.();
        } catch {
          /* port indisponible */
        }
        input.onmidimessage = onMessage(input.name ?? "port inconnu");
        if (input.name) names.push(input.name);
      });
      setPorts(names);
      setMidiStatus(names.length ? `${names.length} entrée(s)` : "aucune entrée détectée");
    };

    if (!navigator.requestMIDIAccess) {
      setMidiStatus("Web MIDI indisponible sur ce navigateur");
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
        setMidiStatus(`accès refusé : ${(error as any)?.message ?? error}`);
        log.warn("requestMIDIAccess refusé", error);
      });

    return () => {
      access?.inputs?.forEach((input: any) => {
        input.onmidimessage = null;
      });
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(t);
  }, [notice]);

  const clearOne = (id: string) => {
    const next = { ...assignments };
    delete next[id];
    setAssignments(next);
    saveAssignments(machine, next);
    setNotice("Liaison retirée.");
  };

  const clearAll = () => {
    setAssignments({});
    saveAssignments(machine, {});
    setNotice(`Toutes les liaisons de ${MACHINE_LABELS[machine]} ont été retirées.`);
  };

  const assignedCount = controls.filter((c) => assignments[c.id]).length;
  const machinePort = ports.find((p) => portMatchesMachine(p, machine));

  return (
    <div className="studio-app-wrapper">
      <TopBar activePage="machine-mapping" />
      <main className="mapping-page">
        <header className="mapping-head">
          <h1>Correspondances MIDI</h1>
          <p>
            Choisissez un contrôle, actionnez-le sur la machine : le message
            reçu lui est assigné. Les réglages sont conservés par machine.
          </p>
        </header>

        <div className="mapping-machines" role="tablist">
          {(["op1", "ep133"] as MachineId[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={machine === m}
              className={`mapping-tab ${machine === m ? "active" : ""}`}
              onClick={() => setMachine(m)}
            >
              {MACHINE_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="mapping-status">
          <div className="mapping-status-row">
            <span className="mapping-label">MIDI</span>
            <span className={ports.length ? "mapping-ok" : "mapping-warn"}>{midiStatus}</span>
          </div>
          <div className="mapping-status-row">
            <span className="mapping-label">PORT MACHINE</span>
            <span className={machinePort ? "mapping-ok" : "mapping-warn"}>
              {machinePort ?? `aucun port ne correspond à ${MACHINE_LABELS[machine]}`}
            </span>
          </div>
          <div className="mapping-status-row">
            <span className="mapping-label">DERNIER MSG</span>
            <span className="mapping-mono">{lastMessage}</span>
          </div>
          <div className="mapping-status-row">
            <span className="mapping-label">ASSIGNÉS</span>
            <span>
              {assignedCount} / {controls.length}
            </span>
          </div>
        </div>

        {learning && (
          <div className="mapping-learning" role="status">
            En attente d'un message pour <strong>{learning}</strong> — actionnez
            le contrôle sur la machine.
            <button className="mapping-cancel" onClick={() => setLearning(null)}>
              Annuler
            </button>
          </div>
        )}

        {notice && <div className="mapping-notice">{notice}</div>}

        <div className="mapping-toolbar">
          <input
            type="search"
            className="mapping-search"
            placeholder="Filtrer les contrôles…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button
            className="mapping-clear-all"
            onClick={clearAll}
            disabled={assignedCount === 0}
          >
            Tout effacer
          </button>
        </div>

        {groups.map(([groupName, items]) => (
          <section key={groupName} className="mapping-group">
            <h2>{groupName}</h2>
            <div className="mapping-grid">
              {items.map((c) => {
                const a = assignments[c.id];
                const isLearning = learning === c.id;
                return (
                  <div
                    key={c.id}
                    className={`mapping-item ${a ? "assigned" : ""} ${isLearning ? "learning" : ""}`}
                  >
                    <div className="mapping-item-head">
                      <strong>{c.label}</strong>
                      {a && (
                        <button
                          className="mapping-item-clear"
                          onClick={() => clearOne(c.id)}
                          title="Retirer cette liaison"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="mapping-item-value">
                      {a ? describeAssignment(a) : c.hint ? `usine : ${c.hint}` : "non assigné"}
                    </div>
                    <button
                      className="mapping-learn"
                      onClick={() => setLearning(isLearning ? null : c.id)}
                    >
                      {isLearning ? "En attente…" : a ? "Réassigner" : "Apprendre"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
