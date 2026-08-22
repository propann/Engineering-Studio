import { useEffect, useRef, useState } from "react";
import { buildMidiClockWindow, buildMidiNotePacket, buildMidiPanicPackets, buildMidiRealtimePacket, createHubNoteMessage, createHubPanicMessage, createHubTransportMessage, parseMidiNotePacket } from "@studio-hub/midi-bridge";
import { sAbonner } from "@studio-hub/midi-dispatch";
import {
  Arpegiateur, Sequenceur,
  pasArpege, quantifier, type Gamme, type Motif,
  basculerPas, ecrirePas, pasAJouer, redimensionner, remplirAuHasard, sequenceVide,
  type Direction, type Pas,
} from "@studio-hub/musique";
import { ORDRE_DIVISIONS, dureeDivisionMs, type Division } from "./core/audio/tempo";

import { createLogger } from "@studio-hub/audio-bridge";

const log = createLogger("Hub.MidiSync");

type SyncOutput = { id: string; name: string; output: MIDIOutput };
type SyncInput = { id: string; name: string; input: MIDIInput };
type TransportTarget = { target: Window; origin: string };

type MidiSyncPanelProps = { getTransportTargets?: () => TransportTarget[] };

const TEST_SEQUENCE = [36, 38, 40, 43, 40, 38, 36, 43];

function isTargetOutput(output: MIDIOutput) {
  return output.state === "connected" && /OP[- ]?1|EP[- ]?133|K[.]O[.]?[- ]?II/i.test(output.name || "");
}

function isOp1Input(input: MIDIInput) {
  return input.state === "connected" && /OP[- ]?1/i.test(input.name || "");
}

/**
 * Small, deliberately explicit MIDI master for the two connected machines.
 * It sends transport and short note messages; it never writes projects or SysEx.
 */
export function MidiSyncPanel({ getTransportTargets }: MidiSyncPanelProps) {
  const [outputs, setOutputs] = useState<SyncOutput[]>([]);
  const [inputs, setInputs] = useState<SyncInput[]>([]);
  const [studioCount, setStudioCount] = useState(0);
  const [controllerEnabled, setControllerEnabled] = useState(false);
  const [status, setStatus] = useState("Aucune sortie MIDI détectée");
  const [bpm, setBpm] = useState(120);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const runningRef = useRef(false);
  const hardwareRunningRef = useRef(false);
  const nextTickRef = useRef(0);
  const outputsRef = useRef<SyncOutput[]>([]);
  const inputsRef = useRef<SyncInput[]>([]);
  const controllerInputRef = useRef<SyncInput | null>(null);
  /**
   * Desabonnement du repartiteur MIDI.
   *
   * Ce panneau ecrivait `input.onmidimessage` en direct : il ecrasait le
   * gestionnaire du repartiteur, et le remettait a `null` en se desactivant,
   * ce qui rendait muets TOUS les abonnes.
   */
  const desabonnerControleurRef = useRef<(() => void) | null>(null);
  const noteTimersRef = useRef<number[]>([]);
  const sequenceTimerRef = useRef<number | undefined>(undefined);
  const sequenceStepRef = useRef(0);
  const sequenceRunningRef = useRef(false);
  const sequenceActiveNoteRef = useRef<number | null>(null);
  const [sequencePlaying, setSequencePlaying] = useState(false);
  // ── Arpégiateur ────────────────────────────────────────────────────────
  //
  // Il vit ici et pas dans le rack de moteurs : posé là-bas il n'arpégerait
  // que lui. D'ici il atteint tout ce qui écoute — le rack, l'OP-1,
  // l'EP-133, et n'importe quelle machine branchée. C'est la séparation des
  // métiers : ce rack produit les notes, le rack de moteurs en fait du son.
  const [arpEnabled, setArpEnabled] = useState(false);
  const [arpMotif, setArpMotif] = useState<Motif>("haut");
  const [arpGamme, setArpGamme] = useState<Gamme>("chromatique");
  const [arpTonique, setArpTonique] = useState(60);
  const [arpOctaves, setArpOctaves] = useState(1);
  const [arpDivision, setArpDivision] = useState<Division>("1/8");
  const [arpNotes, setArpNotes] = useState<number[]>([]);
  const arpNotesRef = useRef<Set<number>>(new Set());
  const arpTimerRef = useRef<number | undefined>(undefined);
  const arpStepRef = useRef(0);
  const arpRunningRef = useRef(false);
  // Ce qui sonne à cet instant, pour pouvoir le couper. Sans ce relevé, tout
  // arrêt laisse des notes suspendues sur la machine — le défaut classique
  // de l'arpégiateur, et celui qui oblige à débrancher pour s'en sortir.
  const arpSoundingRef = useRef<number[]>([]);
  const arpEnabledRef = useRef(false);
  // ── Sequenceur pas a pas ───────────────────────────────────────────────
  //
  // A cote de l'arpegiateur et non a sa place : l'arpege deroule ce qu'on
  // TIENT, la sequence joue ce qu'on a ECRIT. Les deux partagent l'horloge et
  // les sorties de ce panneau, rien d'autre.
  const [seqSequence, setSeqSequence] = useState<Pas[]>(() => sequenceVide(16));
  const [seqLongueur, setSeqLongueur] = useState(16);
  const [seqDirection, setSeqDirection] = useState<Direction>("avant");
  const [seqDivision, setSeqDivision] = useState<Division>("1/8");
  const [seqGamme, setSeqGamme] = useState<Gamme>("pentatonique_mineure");
  const [seqTonique, setSeqTonique] = useState(60);
  const [seqEnMarche, setSeqEnMarche] = useState(false);
  const [seqPasCourant, setSeqPasCourant] = useState<number | null>(null);
  const seqTimerRef = useRef<number | undefined>(undefined);
  const seqCompteurRef = useRef(0);
  const seqRunningRef = useRef(false);
  // Ce qui sonne, pour pouvoir le couper. Meme raison que l'arpege : sans ce
  // releve, tout arret laisse une note suspendue sur la machine.
  const seqSonnanteRef = useRef<number | null>(null);
  // Les reglages lus DANS la minuterie, pas dans la portee capturee.
  const seqParamsRef = useRef({ sequence: seqSequence, direction: seqDirection, division: seqDivision, gamme: seqGamme, tonique: seqTonique, bpm });
  seqParamsRef.current = { sequence: seqSequence, direction: seqDirection, division: seqDivision, gamme: seqGamme, tonique: seqTonique, bpm };
  // Les réglages lus DANS la minuterie. Une minuterie capture la portée de
  // son tour de rendu : sans ce relevé, changer le tempo ou le motif ne
  // prendrait effet qu'au prochain re-rendu déclenché par autre chose.
  const arpParamsRef = useRef({ motif: arpMotif, gamme: arpGamme, tonique: arpTonique, octaves: arpOctaves, division: arpDivision, bpm });
  arpParamsRef.current = { motif: arpMotif, gamme: arpGamme, tonique: arpTonique, octaves: arpOctaves, division: arpDivision, bpm };
  arpEnabledRef.current = arpEnabled;

  useEffect(() => {
    const refreshTargets = () => setStudioCount(getTransportTargets?.().length ?? 0);
    refreshTargets();
    const timer = window.setInterval(refreshTargets, 500);
    return () => window.clearInterval(timer);
  }, [getTransportTargets]);

  function hasDestination() {
    return outputsRef.current.length > 0 || studioCount > 0;
  }

  function noDestinationStatus() {
    setStatus("Aucune destination connectée : ouvre OP‑1/EP‑133 Studio ou connecte les sorties MIDI.");
  }

  function clearTimer() {
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
  }

  function clearSequence() {
    if (sequenceTimerRef.current !== undefined) window.clearTimeout(sequenceTimerRef.current);
    sequenceTimerRef.current = undefined;
    sequenceRunningRef.current = false;
    const activeNote = sequenceActiveNoteRef.current;
    sequenceActiveNoteRef.current = null;
    if (activeNote !== null) broadcastNote("note-off", activeNote, 0);
    setSequencePlaying(false);
  }

  function broadcast(type: "start" | "stop", timestamp: number) {
    const message = createHubTransportMessage(type, bpm, timestamp);
    getTransportTargets?.().forEach(({ target, origin }) => target.postMessage(message, origin));
  }

  function broadcastNote(action: "note-on" | "note-off", note: number, velocity = 100) {
    const targets = getTransportTargets?.() ?? [];
    if (!outputsRef.current.length && !targets.length) {
      if (action === "note-on") noDestinationStatus();
      return false;
    }
    const timestamp = performance.now();
    const hardwarePacket = buildMidiNotePacket(action, note, velocity, 0, timestamp);
    outputsRef.current.forEach(({ output }) => {
      try { output.send(hardwarePacket.data, hardwarePacket.timestamp); } catch { /* un branchement peut disparaître pendant le test */ }
    });
    const message = createHubNoteMessage(action, note, velocity, 0, performance.now());
    targets.forEach(({ target, origin }) => target.postMessage(message, origin));
    if (action === "note-on") setStatus(outputsRef.current.length || targets.length ? `Note ${note} envoyée aux machines et studios ouverts.` : "Connecte les machines ou ouvre les deux studios pour tester le routage.");
    return true;
  }

  function relayControllerNote(action: "note-on" | "note-off", note: number, velocity: number, channel: number) {
    // Arpégiateur actif : le contrôleur ne joue plus, il CHOISIT. Les notes
    // alimentent le réservoir tenu et c'est l'arpège qui les envoie. Relayer
    // en plus ferait sonner deux fois la même touche.
    if (arpEnabledRef.current) {
      const tenues = arpNotesRef.current;
      if (action === "note-on" && velocity > 0) tenues.add(note);
      else tenues.delete(note);
      setArpNotes(Array.from(tenues).sort((x, y) => x - y));
      return;
    }

    const targets = getTransportTargets?.() ?? [];
    const destinations = outputsRef.current.filter(({ name }) => /EP[- ]?133|K[.]O[.]?[- ]?II/i.test(name));
    if (!destinations.length && !targets.length) {
      if (action === "note-on") noDestinationStatus();
      return;
    }
    const timestamp = performance.now();
    const hardwarePacket = buildMidiNotePacket(action, note, velocity, channel, timestamp);
    // L’OP-1 est la source en mode CTRL : on vise seulement l’EP-133 pour
    // empêcher qu’une note revienne vers la sortie OP-1 et crée une boucle.
    destinations.forEach(({ output }) => {
        try { output.send(hardwarePacket.data, hardwarePacket.timestamp); } catch { /* la machine peut disparaître pendant une note */ }
      });
    const message = createHubNoteMessage(action, note, velocity, channel, timestamp);
    targets.forEach(({ target, origin }) => target.postMessage(message, origin));
    if (action === "note-on") setStatus(`Contrôleur OP‑1 : note ${note} relayée vers EP‑133 et les studios ouverts.`);
  }

  function disableController() {
    const active = controllerInputRef.current;
    // Se desabonner, jamais debrancher : le port sert aussi aux autres.
    desabonnerControleurRef.current?.();
    desabonnerControleurRef.current = null;
    controllerInputRef.current = null;
    setControllerEnabled(false);
  }

  function enableController() {
    if (controllerEnabled) {
      disableController();
      setStatus("Mode contrôleur OP‑1 désactivé. L’OP‑1 reste en mode classique côté Hub.");
      return;
    }
    if (!hasDestination()) {
      noDestinationStatus();
      return;
    }
    const candidate = inputsRef.current[0];
    if (!candidate) {
      setStatus("Aucune entrée OP‑1 : passe la machine en COM → T2 / CTRL puis actualise les ports.");
      return;
    }
    // Abonnement filtre sur le port choisi.
    //
    // L'ecriture directe de `onmidimessage` ecrasait le gestionnaire du
    // repartiteur : le rack et les studios devenaient muets des l'activation
    // du mode controleur, sans aucun message.
    desabonnerControleurRef.current = sAbonner(({ donnees, port }) => {
      // Le repartiteur diffuse TOUTES les entrees : on ne garde que la sienne.
      if (port !== candidate.name) return;
      try {
        const message = parseMidiNotePacket(donnees);
        if (message) relayControllerNote(message.action, message.note, message.velocity, message.channel);
      } catch (error) {
        log.warn("Failed to parse MIDI note packet", error);
      }
    });
    controllerInputRef.current = candidate;
    setControllerEnabled(true);
    setStatus(`Mode contrôleur OP‑1 actif sur ${candidate.name}. Les notes vont vers EP‑133 sans écho vers l’OP‑1.`);
  }

  function testNote(note: number) {
    if (!broadcastNote("note-on", note)) return;
    const timer = window.setTimeout(() => {
      broadcastNote("note-off", note, 0);
      noteTimersRef.current = noteTimersRef.current.filter((value) => value !== timer);
    }, 240);
    noteTimersRef.current.push(timer);
  }

  function scheduleSequenceStep() {
    if (!sequenceRunningRef.current) return;
    const note = TEST_SEQUENCE[sequenceStepRef.current % TEST_SEQUENCE.length];
    sequenceStepRef.current += 1;
    sequenceActiveNoteRef.current = note;
    broadcastNote("note-on", note);
    const noteLength = Math.max(60, 60_000 / bpm / 3);
    const stepLength = Math.max(120, 60_000 / bpm / 2);
    sequenceTimerRef.current = window.setTimeout(() => {
      if (!sequenceRunningRef.current) return;
      broadcastNote("note-off", note, 0);
      sequenceActiveNoteRef.current = null;
      sequenceTimerRef.current = window.setTimeout(scheduleSequenceStep, Math.max(20, stepLength - noteLength));
    }, noteLength);
  }

  function startSequence() {
    if (sequenceRunningRef.current) return;
    if (!hasDestination()) {
      noDestinationStatus();
      return;
    }
    if (!runningRef.current) start(outputsRef.current.length < 2);
    if (!runningRef.current) return;
    sequenceStepRef.current = 0;
    sequenceRunningRef.current = true;
    setSequencePlaying(true);
    setStatus("Séquence test synchronisée en cours.");
    scheduleSequenceStep();
  }

  // Coupe tout ce que l'arpégiateur fait sonner. Appelé avant chaque pas et à
  // tout arrêt : c'est la seule chose qui empêche les notes suspendues.
  // Démontage : couper la minuterie et relâcher. Sans cela, quitter la page
  // arpégiateur en marche laisse la machine tenir ses dernières notes — il
  // faut la débrancher pour les faire taire.
  useEffect(() => {
    return () => {
      arpRunningRef.current = false;
      if (arpTimerRef.current !== undefined) window.clearTimeout(arpTimerRef.current);
      arpTimerRef.current = undefined;
      seqRunningRef.current = false;
    if (seqTimerRef.current !== undefined) window.clearTimeout(seqTimerRef.current);
    seqTimerRef.current = undefined;
    const suspendues = seqSonnanteRef.current === null
      ? arpSoundingRef.current
      : [...arpSoundingRef.current, seqSonnanteRef.current];
    seqSonnanteRef.current = null;
    for (const note of suspendues) {
        outputsRef.current.forEach(({ output }) => {
          try { output.send([0x80, note, 0]); } catch { /* la machine peut avoir disparu */ }
        });
      }
      arpSoundingRef.current = [];
    };
  }, []);
  
  // ── Moteur du sequenceur ───────────────────────────────────────────────

  function seqRelacher() {
    const note = seqSonnanteRef.current;
    seqSonnanteRef.current = null;
    if (note !== null) broadcastNote("note-off", note, 0);
  }

  function seqPas() {
    if (!seqRunningRef.current) return;
    const p = seqParamsRef.current;
    const attente = dureeDivisionMs(p.bpm, p.division);

    // La note precedente est coupee ICI, au debut du pas suivant : les pas sont
    // donc lies, sans deuxieme minuterie pour la duree de note.
    seqRelacher();

    const index = p.sequence.length
      ? ((Math.floor(seqCompteurRef.current) % p.sequence.length) + p.sequence.length) % p.sequence.length
      : 0;
    const aJouer = pasAJouer(p.sequence, p.direction, seqCompteurRef.current, p.gamme, p.tonique);
    // On affiche l'index REELLEMENT parcouru, pas le compteur : en arriere ou
    // en aller-retour, les deux ne coincident pas.
    setSeqPasCourant(p.direction === "avant" ? index : null);
    seqCompteurRef.current += 1;

    if (aJouer) {
      broadcastNote("note-on", aJouer.note, aJouer.velocite);
      seqSonnanteRef.current = aJouer.note;
    }

    seqTimerRef.current = window.setTimeout(seqPas, attente);
  }

  function seqArreter() {
    seqRunningRef.current = false;
    if (seqTimerRef.current !== undefined) window.clearTimeout(seqTimerRef.current);
    seqTimerRef.current = undefined;
    seqRelacher();
    setSeqPasCourant(null);
  }

  function seqBasculer() {
    if (seqEnMarche) {
      setSeqEnMarche(false);
      seqArreter();
      setStatus("Sequenceur arrete.");
      return;
    }
    if (!hasDestination()) {
      noDestinationStatus();
      return;
    }
    setSeqEnMarche(true);
    seqRunningRef.current = true;
    seqCompteurRef.current = 0;
    setStatus("Sequenceur en marche : la phrase part vers tout ce qui ecoute.");
    seqPas();
  }
  function arpRelacherSonnantes() {
    for (const note of arpSoundingRef.current) broadcastNote("note-off", note, 0);
    arpSoundingRef.current = [];
  }
  
  function arpPas() {
    if (!arpRunningRef.current) return;
    const p = arpParamsRef.current;
    const attente = dureeDivisionMs(p.bpm, p.division);
  
    // La note du pas précédent est coupée ICI, au début du suivant : les pas
    // sont donc joués liés, sans deuxième minuterie pour la durée de note.
    arpRelacherSonnantes();
  
    const tenues = Array.from(arpNotesRef.current);
    // Rien de tenu : la minuterie continue de tourner à vide plutôt que de
    // s'arrêter. Sinon relâcher toutes les notes tuerait l'arpège, et le
    // reprendre demanderait de le rallumer à la main.
    const notes = tenues.length
      ? pasArpege(tenues, p.motif, arpStepRef.current, p.octaves).map((n) => quantifier(n, p.tonique, p.gamme))
      : [];
    if (tenues.length) arpStepRef.current += 1;
  
    for (const note of notes) broadcastNote("note-on", note);
    arpSoundingRef.current = notes;
  
    arpTimerRef.current = window.setTimeout(arpPas, attente);
  }
  
  function arpArreter() {
    // Le sequenceur aussi : un PANIC qui laisse une minuterie tourner
    // renverrait des notes juste apres avoir tout coupe.
    seqRunningRef.current = false;
    if (seqTimerRef.current !== undefined) window.clearTimeout(seqTimerRef.current);
    seqTimerRef.current = undefined;
    seqSonnanteRef.current = null;
    setSeqEnMarche(false);
    setSeqPasCourant(null);
    arpRunningRef.current = false;
    if (arpTimerRef.current !== undefined) window.clearTimeout(arpTimerRef.current);
    arpTimerRef.current = undefined;
    arpRelacherSonnantes();
  }
  
  function arpBasculer() {
    if (arpEnabled) {
      setArpEnabled(false);
      arpArreter();
      setStatus("Arpégiateur arrêté.");
      return;
    }
    if (!hasDestination()) {
      noDestinationStatus();
      return;
    }
    setArpEnabled(true);
    arpRunningRef.current = true;
    arpStepRef.current = 0;
    setStatus("Arpégiateur actif : choisis des notes, elles partent vers tout ce qui écoute.");
    arpPas();
  }
  
  // Une note cliquée reste tenue jusqu'au prochain clic. Un arpégiateur sans
  // maintien demanderait de garder trois doigts sur l'écran.
  function arpBasculerNote(note: number) {
    const tenues = arpNotesRef.current;
    if (tenues.has(note)) tenues.delete(note);
    else tenues.add(note);
    setArpNotes(Array.from(tenues).sort((a, b) => a - b));
  }
  
  function arpToutRelacher() {
    arpNotesRef.current.clear();
    setArpNotes([]);
    arpRelacherSonnantes();
  }
  
  function panic() {
    // L'arpégiateur d'abord : un PANIC qui laisse la minuterie tourner
    // renverrait des notes juste après avoir tout coupé.
    // Le sequenceur aussi : un PANIC qui laisse une minuterie tourner
    // renverrait des notes juste apres avoir tout coupe.
    seqRunningRef.current = false;
    if (seqTimerRef.current !== undefined) window.clearTimeout(seqTimerRef.current);
    seqTimerRef.current = undefined;
    seqSonnanteRef.current = null;
    setSeqEnMarche(false);
    setSeqPasCourant(null);
    arpRunningRef.current = false;
    if (arpTimerRef.current !== undefined) window.clearTimeout(arpTimerRef.current);
    arpTimerRef.current = undefined;
    arpSoundingRef.current = [];
    setArpEnabled(false);
    if (!hasDestination()) {
      noDestinationStatus();
      return;
    }
    noteTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    noteTimersRef.current = [];
    const hardwarePackets = buildMidiPanicPackets(performance.now());
    outputsRef.current.forEach(({ output }) => hardwarePackets.forEach((packet) => {
      try { output.send(packet.data, packet.timestamp); } catch { /* un branchement peut disparaître pendant le PANIC */ }
    }));
    const message = createHubPanicMessage(performance.now());
    const targets = getTransportTargets?.() ?? [];
    targets.forEach(({ target, origin }) => target.postMessage(message, origin));
    setStatus(outputsRef.current.length || targets.length ? "PANIC envoyé aux machines et studios ouverts." : "Aucune machine ou fenêtre ouverte pour recevoir le PANIC.");
  }

  function sendHardware(type: "start" | "stop", timestamp: number) {
    // Web MIDI cannot retract packets already scheduled. Put Stop after the
    // current short clock window so no clock is delivered after transport stop.
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
      disableController();
      const access = await navigator.requestMIDIAccess();
      const nextOutputs = [...access.outputs.values()]
        .filter(isTargetOutput)
        .map((output) => ({ id: output.id, name: output.name || output.id, output }));
      outputsRef.current = nextOutputs;
      setOutputs(nextOutputs);
      log.info("MIDI outputs connected", { count: nextOutputs.length, outputs: nextOutputs.map(o => o.name) });
      // Keep the panel compatible with minimal Web MIDI test doubles that
      // expose outputs only; real Web MIDI access always includes inputs.
      const nextInputs = [...(access.inputs?.values?.() ?? [])]
        .filter(isOp1Input)
        .map((input) => ({ id: input.id, name: input.name || input.id, input }));
      inputsRef.current = nextInputs;
      setInputs(nextInputs);
      log.info("MIDI inputs connected", { count: nextInputs.length, inputs: nextInputs.map(i => i.name) });
      setStatus(nextOutputs.length >= 2 ? (nextInputs.length ? "Les deux sorties et l’entrée OP‑1 sont prêtes." : "Les deux sorties sont prêtes.") : "Branche les sorties OP‑1 et EP‑133.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Autorisation MIDI refusée.";
      log.error("Failed to connect MIDI", error);
      setStatus(message);
    }
  }

  function start(simulated = false) {
    if ((!simulated && outputsRef.current.length < 2) || runningRef.current) return;
    runningRef.current = true;
    hardwareRunningRef.current = !simulated;
    setRunning(true);
    const startAt = performance.now() + 50;
    if (!simulated) sendHardware("start", startAt);
    broadcast("start", startAt);
    nextTickRef.current = startAt + 60_000 / bpm / 24;
    if (!simulated) scheduleClock();
    setStatus(simulated ? `Simulation en cours à ${bpm} BPM (sans machine).` : `Synchronisation en cours à ${bpm} BPM.`);
  }

  function stop() {
    if (!runningRef.current) return;
    clearSequence();
    runningRef.current = false;
    clearTimer();
    const stopAt = Math.max(performance.now(), nextTickRef.current);
    if (hardwareRunningRef.current) {
      sendHardware("stop", stopAt);
      clearTimer();
    }
    broadcast("stop", stopAt);
    hardwareRunningRef.current = false;
    setRunning(false);
    setStatus("Synchronisation arrêtée.");
  }

  useEffect(() => () => {
    const wasRunning = runningRef.current;
    runningRef.current = false;
    clearTimer();
    noteTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    noteTimersRef.current = [];
    clearSequence();
    const active = controllerInputRef.current;
    // Se desabonner, jamais debrancher : le port sert aussi aux autres.
    desabonnerControleurRef.current?.();
    desabonnerControleurRef.current = null;
    if (wasRunning) {
      const stopAt = Math.max(performance.now(), nextTickRef.current);
      if (hardwareRunningRef.current) sendHardware("stop", stopAt);
      broadcast("stop", stopAt);
    }
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
          {inputs.length > 0 && <div className="sync-inputs" aria-live="polite"><strong>Entrée détectée</strong>{inputs.map((input) => <span key={input.id}>↓ {input.name}</span>)}<button className="secondary-button" onClick={enableController}>{controllerEnabled ? "Désactiver CTRL" : "Activer contrôleur OP‑1"}</button></div>}
          <div className="sync-destinations" aria-live="polite">Destinations : {outputs.length} sortie{outputs.length === 1 ? "" : "s"} MIDI · {studioCount} studio{studioCount === 1 ? " ouvert" : "s ouverts"}</div>
          <div className="sync-actions">
            <button className="primary-button" disabled={outputs.length < 2 || running} onClick={() => start()}>Démarrer les deux</button>
            <button className="secondary-button" disabled={running} onClick={() => start(true)}>Tester sans machine</button>
            <button className="secondary-button" disabled={!running} onClick={stop}>Arrêter</button>
          </div>
          {(outputs.length > 0 || studioCount > 0) && <p className="sync-status-text">{status}</p>}
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
          <p>Mode classique : laisse CTRL désactivé. Pour piloter l’atelier depuis l’OP‑1, choisis <strong>COM → T2 / CTRL</strong> sur la machine, actualise les ports, puis active le relais. Les notes entrantes vont vers EP‑133 et les studios ouverts, sans retour vers l’OP‑1 source.</p>
          <div className="midi-note-test">
            <strong>Routage de notes et séquence</strong>
            <span>Les notes courtes et la séquence test partent vers les machines connectées et les studios ouverts. PANIC vide les notes bloquées.</span>
            <div className="midi-note-actions">
              <button className="midi-note-button" disabled={!hasDestination()} onClick={() => testNote(36)}>C2</button>
              <button className="midi-note-button" disabled={!hasDestination()} onClick={() => testNote(38)}>D2</button>
              <button className="midi-note-button" disabled={!hasDestination()} onClick={() => testNote(40)}>E2</button>
              <button className="secondary-button" disabled={!hasDestination() || sequencePlaying} onClick={startSequence}>{sequencePlaying ? "SÉQUENCE EN COURS" : "SÉQUENCE TEST"}</button>
              <button className="panic-button" disabled={!hasDestination()} onClick={panic}>PANIC</button>
            </div>
          </div>
          {/* Le rack MIDI rend sa propre interface, comme le rack d'effets rend
              la sienne. Ce panneau garde ce qui est a lui : l'horloge, les
              sorties, l'envoi. */}
          <Arpegiateur
            actif={arpEnabled}
            onActif={arpBasculer}
            pret={hasDestination()}
            motif={arpMotif}
            onMotif={setArpMotif}
            gamme={arpGamme}
            onGamme={setArpGamme}
            tonique={arpTonique}
            onTonique={setArpTonique}
            division={arpDivision}
            onDivision={setArpDivision}
            octaves={arpOctaves}
            onOctaves={setArpOctaves}
            notesTenues={arpNotes}
            onBasculerNote={arpBasculerNote}
            onToutRelacher={arpToutRelacher}
          />
          {/* Le sequenceur partage l'horloge et les sorties de ce panneau, rien
              d'autre. L'arpege deroule ce qu'on tient ; lui joue ce qu'on a ecrit. */}
          <Sequenceur
            sequence={seqSequence}
            onSequence={setSeqSequence}
            pasCourant={seqPasCourant}
            enMarche={seqEnMarche}
            onMarche={seqBasculer}
            pret={hasDestination()}
            longueur={seqLongueur}
            onLongueur={(n) => { setSeqLongueur(n); setSeqSequence((s) => redimensionner(s, n)); }}
            direction={seqDirection}
            onDirection={setSeqDirection}
            division={seqDivision}
            onDivision={setSeqDivision}
            gamme={seqGamme}
            onGamme={setSeqGamme}
            tonique={seqTonique}
            onTonique={setSeqTonique}
            onEcrire={(index, note) => setSeqSequence((s) => ecrirePas(s, index, note, seqGamme, seqTonique))}
            onBasculer={(index) => setSeqSequence((s) => basculerPas(s, index))}
            onRemplir={() => setSeqSequence(remplirAuHasard(seqLongueur, seqGamme, seqTonique))}
            onEffacer={() => setSeqSequence(sequenceVide(seqLongueur))}
            prefixe="seq"
          />
        </div>
      </div>
    </section>
  );
}
