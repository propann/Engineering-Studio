import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le rack MIDI : cablage de l'arpegiateur.
 *
 * Trois racks, trois metiers. Celui-ci PRODUIT les notes, le rack de moteurs
 * en fait du son, le rack d'effets le traite. C'est ce qui decide de
 * l'emplacement de l'arpegiateur : pose dans le rack de moteurs il n'arpegerait
 * que lui ; ici il atteint tout ce qui ecoute.
 *
 * La logique musicale est prouvee par core/midi/musique.test.ts, sur des
 * fonctions pures. Ce fichier verrouille ce qu'elle ne peut pas voir : que les
 * notes partent, qu'elles s'arretent, et que le rack de moteurs les entende.
 */

/**
 * Le corps d'une fonction du panneau, borne a la SUIVANTE.
 *
 * Une tranche de longueur fixe debordait de `arpPas` sur `arpArreter`, qui
 * appelle la meme fonction de relachement : supprimer l'appel dans `arpPas`
 * laissait le test vert. Un test qui ne peut pas echouer ne prouve rien.
 */
function corps(source: string, entete: string): string {
  const i = source.indexOf(entete);
  if (i < 0) return "";
  const j = source.indexOf("\n  function ", i + entete.length);
  return source.slice(i, j < 0 ? source.length : j);
}

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PANNEAU = readFileSync(path.join(DIR, "MidiSyncPanel.tsx"), "utf-8");
const RACK = readFileSync(path.join(DIR, "pages", "AudioPluginRack.tsx"), "utf-8");
const CSS = readFileSync(path.join(DIR, "styles.css"), "utf-8");

describe("le rack de moteurs entend le rack MIDI", () => {
  it("lit bien les deux sources", () => {
    expect(PANNEAU.length).toBeGreaterThan(10000);
    expect(RACK.length).toBeGreaterThan(100000);
  });

  it("le rack s'abonne a hub:midi-note", () => {
    // Le blocage de depart : seuls les deux studios ecoutaient. L'arpegiateur
    // atteignait l'OP-1 et l'EP-133 mais pas le rack — le seul instrument dont
    // le hub dispose sans materiel branche.
    expect(RACK).toContain('window.addEventListener("hub:midi-note"');
    expect(RACK).toContain('window.removeEventListener("hub:midi-note"');
  });

  it("le rack joue la note recue", () => {
    const i = RACK.indexOf('window.addEventListener("hub:midi-note"');
    const bloc = RACK.slice(Math.max(0, i - 1200), i);
    expect(bloc).toContain("playPluginNote(");
    expect(bloc).toContain("releaseVoice(");
  });

  it("les voix du hub ont un prefixe distinct de celles du clavier physique", () => {
    // Meme note jouee au clavier ET arpegee : un identifiant commun ferait
    // que l'une coupe l'autre. Deux sources, deux voix.
    const i = RACK.indexOf('window.addEventListener("hub:midi-note"');
    expect(RACK.slice(Math.max(0, i - 1200), i)).toContain("`hub:${msg.note}`");
    expect(RACK).toContain("`midi:${note}`");
  });

  it("le rack refuse une note qui n'en est pas une", () => {
    // Le message vient d'une autre fenetre : `pool[undefined]` traverse
    // jusqu'au calcul de frequence et rend NaN, qui ne leve pas — il rend la
    // voix muette.
    const i = RACK.indexOf('window.addEventListener("hub:midi-note"');
    expect(RACK.slice(Math.max(0, i - 1200), i)).toContain("Number.isFinite(msg.note)");
  });
});

describe("l'arpegiateur vit dans le rack MIDI", () => {
  it("utilise la logique pure, sans la reimplementer", () => {
    expect(PANNEAU).toContain('from "./core/midi/musique"');
    expect(PANNEAU).toContain("pasArpege(tenues,");
  });

  it("quantifie sur la gamme choisie", () => {
    // Sans cet appel, le selecteur de gamme serait decoratif — les notes
    // partiraient telles quelles et « pentatonique » ne changerait rien.
    expect(PANNEAU).toMatch(/\.map\(\(n\) => quantifier\(n, p\.tonique, p\.gamme\)\)/);
  });

  it("partage les divisions avec la synchro du delay", () => {
    // Une seconde liste de divisions divergerait a la premiere retouche.
    expect(PANNEAU).toContain('from "./core/audio/tempo"');
    expect(PANNEAU).toContain("dureeDivisionMs(p.bpm, p.division)");
  });

  it("envoie par broadcastNote, qui atteint machines ET studios", () => {
    // C'est tout l'interet de l'emplacement : `broadcastNote` ecrit sur les
    // sorties materielles ET poste vers chaque studio ouvert.
    expect(corps(PANNEAU, "function arpPas()")).toContain('broadcastNote("note-on", note)');
  });

  it("lit ses reglages dans un releve, pas dans la portee capturee", () => {
    // Une minuterie capture la portee de son tour de rendu. Sans releve,
    // changer le tempo ou le motif ne prendrait effet qu'au prochain rendu
    // declenche par autre chose — un reglage qui « ne repond pas ».
    expect(corps(PANNEAU, "function arpPas()")).toContain("arpParamsRef.current");
  });
});

describe("aucune note suspendue", () => {
  const dansArpPas = () => corps(PANNEAU, "function arpPas()");

  it("chaque pas relache le precedent", () => {
    // Le defaut classique de l'arpegiateur, et celui qui oblige a debrancher
    // la machine pour s'en sortir.
    expect(dansArpPas()).toContain("arpRelacherSonnantes()");
  });

  it("le releve de ce qui sonne est tenu a jour", () => {
    expect(dansArpPas()).toContain("arpSoundingRef.current = notes;");
  });

  it("relacher envoie bien un note-off par note", () => {
    expect(corps(PANNEAU, "function arpRelacherSonnantes()")).toContain('broadcastNote("note-off", note, 0)');
  });

  it("l'arret coupe la minuterie ET relache", () => {
    const bloc = corps(PANNEAU, "function arpArreter()");
    expect(bloc).toContain("clearTimeout(arpTimerRef.current)");
    expect(bloc).toContain("arpRelacherSonnantes()");
  });

  it("PANIC arrete aussi l'arpegiateur", () => {
    // Un PANIC qui laisse la minuterie tourner renverrait des notes juste
    // apres avoir tout coupe : le bouton d'urgence ne tiendrait pas.
    const bloc = corps(PANNEAU, "function panic()");
    expect(bloc).toContain("arpRunningRef.current = false");
    expect(bloc).toContain("clearTimeout(arpTimerRef.current)");
  });

  it("le demontage relache directement sur les sorties", () => {
    // Au demontage, `broadcastNote` depend d'un etat React qui n'est plus la.
    // On ecrit sur les ports, sans intermediaire.
    const i = PANNEAU.indexOf("// Démontage : couper la minuterie");
    expect(i).toBeGreaterThan(-1);
    const bloc = PANNEAU.slice(i, i + 800);
    expect(bloc).toContain("output.send([0x80, note, 0])");
    expect(bloc).toContain("}, []);");
  });
});

describe("le mode controleur alimente l'arpege", () => {
  it("le controleur choisit les notes au lieu de les relayer", () => {
    // Relayer en plus ferait sonner deux fois la meme touche : une fois en
    // direct, une fois par l'arpege.
    const bloc = corps(PANNEAU, "function relayControllerNote(");
    expect(bloc).toContain("arpEnabledRef.current");
    expect(bloc).toMatch(/tenues\.add\(note\)/);
    expect(bloc).toMatch(/tenues\.delete\(note\)/);
    // ...et sort avant le relais.
    expect(bloc.slice(0, bloc.indexOf("return;") + 7)).toContain("arpEnabledRef.current");
  });
});

describe("interface", () => {
  it("propose toutes les gammes et tous les motifs, sans liste en dur", () => {
    expect(PANNEAU).toContain("ORDRE_GAMMES.map((g) =>");
    expect(PANNEAU).toContain("ORDRE_MOTIFS.map((m) =>");
  });

  it("les touches se maintiennent au clic", () => {
    // Un arpegiateur sans maintien demanderait de garder trois doigts sur
    // l'ecran.
    expect(PANNEAU).toContain("arpBasculerNote(note)");
    expect(PANNEAU).toContain("function arpToutRelacher()");
  });

  it("les classes rendues ont une regle CSS", () => {
    for (const c of ["arp-panneau", "arp-tete", "arp-bouton", "arp-reglages", "arp-clavier", "arp-touche", "arp-pied"]) {
      expect(CSS, `.${c} sans regle`).toMatch(new RegExp(`\\.${c}[\\s,{:.]`));
    }
  });
});
