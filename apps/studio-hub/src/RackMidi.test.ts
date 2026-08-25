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
// L'interface du rack MIDI vit dans le paquet partage, comme celle du rack
// d'effets vit dans racks/RackEffets.tsx : chaque rack porte la sienne.
const SEQ_UI = readFileSync(
  path.join(DIR, "..", "..", "..", "packages", "musique", "Sequenceur.tsx"),
  "utf-8"
);
const ARP_UI = readFileSync(
  path.join(DIR, "..", "..", "..", "packages", "musique", "Arpegiateur.tsx"),
  "utf-8"
);

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
    expect(PANNEAU).toContain('from "@studio-hub/musique"');
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
    // Borne a l'EFFET, pas a une longueur fixe : ajouter le sequenceur a
    // repousse `output.send` hors d'une fenetre de 800 caracteres, et le test
    // est tombe sans qu'aucun defaut n'existe. Troisieme fois qu'une tranche
    // de longueur fixe se retourne contre moi.
    const i = PANNEAU.indexOf("// Démontage : couper la minuterie");
    expect(i).toBeGreaterThan(-1);
    const fin = PANNEAU.indexOf("}, []);", i);
    expect(fin, "fin de l'effet introuvable").toBeGreaterThan(i);
    const bloc = PANNEAU.slice(i, fin + 7);
    expect(bloc).toContain("output.send([0x80, note, 0])");
    expect(bloc).toContain("}, []);");
  });
});

describe("la longueur de note ne laisse aucune minuterie derriere elle", () => {
  /**
   * Le module n'avait qu'UNE minuterie, et c'etait ecrit dans son code comme
   * une decision : « les pas sont donc lies, sans deuxieme minuterie pour la
   * duree de note ». La longueur de note en ajoute une seconde par module.
   *
   * Une seconde minuterie, c'est une note qui peut rester tenue apres l'arret
   * — le defaut qui oblige a debrancher la machine. Ces tests verrouillent les
   * deux moyens de l'eviter : un SEUL endroit qui annule, et une relecture de
   * l'etat au declenchement.
   */

  it("le relachement annule la coupure, dans les deux modules", () => {
    // L'invariant central. `seqRelacher` et `arpRelacherSonnantes` sont
    // appeles par TOUS les chemins d'arret : mettre l'annulation ailleurs,
    // c'est se garantir qu'un chemin l'oubliera.
    expect(corps(PANNEAU, "function seqRelacher()")).toContain("clearTimeout(seqGateRef.current)");
    expect(corps(PANNEAU, "function arpRelacherSonnantes()")).toContain("clearTimeout(arpGateRef.current)");
  });

  it("l'arret passe bien par le relachement", () => {
    // Ce qui rend l'invariant precedent suffisant. Si un arret coupait la
    // minuterie de pas sans relacher, la coupure survivrait.
    expect(corps(PANNEAU, "function seqArreter()")).toContain("seqRelacher()");
    expect(corps(PANNEAU, "function arpArreter()")).toContain("arpRelacherSonnantes()");
  });

  it("l'arret sans note-off annule quand meme la coupure", () => {
    // `panic()` et `arpArreter()` coupent le sequenceur SANS le relacher note
    // par note — la rafale MIDI s'en charge pour l'un, l'autre l'arrete en
    // dommage collateral. Ils ne passent donc pas par `seqRelacher`, ou vit
    // l'annulation. Ce bloc etait ecrit deux fois et la minuterie de coupure
    // n'etait dans aucune des deux copies : elle aurait survecu au bouton
    // d'urgence. Une seule fonction desormais, et les deux l'appellent.
    expect(corps(PANNEAU, "function seqCouperSansRelacher()")).toContain("clearTimeout(seqGateRef.current)");
    expect(corps(PANNEAU, "function arpArreter()")).toContain("seqCouperSansRelacher()");
    expect(corps(PANNEAU, "function panic()")).toContain("seqCouperSansRelacher()");
  });

  it("PANIC annule aussi la coupure de l'arpege", () => {
    // Meme raison, cote arpege : `panic()` vide `arpSoundingRef` sans passer
    // par `arpRelacherSonnantes`.
    expect(corps(PANNEAU, "function panic()")).toContain("clearTimeout(arpGateRef.current)");
  });

  it("le demontage annule les deux, a la main", () => {
    // Il relache directement sur les ports, sans passer par les fonctions de
    // relachement : il doit donc annuler lui-meme.
    const i = PANNEAU.indexOf("// Démontage : couper la minuterie");
    const fin = PANNEAU.indexOf("}, []);", i);
    const bloc = PANNEAU.slice(i, fin + 7);
    expect(bloc).toContain("clearTimeout(arpGateRef.current)");
    expect(bloc).toContain("clearTimeout(seqGateRef.current)");
  });

  it("la coupure relit l'etat avant de couper", () => {
    // Entre la programmation et le declenchement, un arret a pu passer.
    // Couper sans verifier enverrait une note-off apres le silence — et sur un
    // autre chemin, la meme minuterie couperait la note SUIVANTE.
    expect(corps(PANNEAU, "function seqPas()")).toContain("if (!seqRunningRef.current) return;");
    expect(corps(PANNEAU, "function arpPas()")).toContain("if (!arpRunningRef.current) return;");
  });

  it("aucune minuterie n'est programmee quand on joue lie", () => {
    // A 100 %, le comportement doit rester EXACTEMENT celui d'avant, pas
    // « presque, a une minuterie pres ». `coupureGateMs` rend `null`, et les
    // deux moteurs ne programment rien dans ce cas.
    for (const fn of ["function seqPas()", "function arpPas()"]) {
      expect(corps(PANNEAU, fn), fn).toContain("if (coupure !== null) {");
    }
  });

  it("les deux moteurs lisent la longueur dans leurs parametres", () => {
    // Lue dans l'etat React plutot que dans la ref, elle serait celle du rendu
    // ou la minuterie a ete posee — pas celle du moment.
    expect(corps(PANNEAU, "function seqPas()")).toContain("coupureGateMs(attente, p.gate)");
    expect(corps(PANNEAU, "function arpPas()")).toContain("coupureGateMs(attente, p.gate)");
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
  it("le panneau delegue toute son interface au rack MIDI", () => {
    // Le panneau garde ce qui est vraiment a lui : l'horloge, les sorties,
    // l'envoi. Les commandes sont dans le paquet, posables par un studio.
    expect(PANNEAU).toMatch(/<Arpegiateur[\s/>]/);
    expect(PANNEAU).toContain("gamme={arpGamme}");
    expect(PANNEAU).toContain("onGamme={setArpGamme}");
    expect(PANNEAU).toContain("notesTenues={arpNotes}");
  });

  it("le panneau ne rend plus aucune commande d'arpege", () => {
    // L'invariant d'equilibre, cote rack MIDI. Sans lui la frontiere se
    // referme au premier « juste un curseur de plus ».
    expect(PANNEAU).not.toContain('className="arp-panneau"');
    expect(PANNEAU).not.toContain('className="arp-touche');
    expect(PANNEAU).not.toContain("ORDRE_MOTIFS.map(");
    expect(PANNEAU).not.toMatch(/<SelecteurGamme[\s/>]/);
  });

  it("le rack MIDI propose gammes et motifs sans liste en dur", () => {
    expect(ARP_UI).toContain("ORDRE_MOTIFS.map((m) =>");
    // Borne exigee : `toContain("<SelecteurGamme")` reste vrai pour
    // `<SelecteurGammeZ`. Un premier jet de ce test ne voyait pas le
    // renommage du composant.
    expect(ARP_UI).toMatch(/<SelecteurGamme[\s/>]/);
  });

  it("le rack MIDI n'a aucun etat interne", () => {
    // Deux verites pour un seul reglage seraient impossibles a diagnostiquer,
    // et le clavier tenu doit rester la ou l'envoi le lit.
    expect(ARP_UI).not.toContain("useState");
    expect(ARP_UI).not.toContain("useRef");
  });

  it("le rack MIDI ne touche ni au MIDI ni au son", () => {
    // Il regle. Le moteur d'arpege reste cote hote : c'est lui qui possede le
    // tempo et sait a qui envoyer.
    expect(ARP_UI).not.toContain("requestMIDIAccess");
    expect(ARP_UI).not.toContain("broadcastNote");
    expect(ARP_UI).not.toContain("setTimeout");
  });

  it("les touches se maintiennent au clic", () => {
    // Un arpegiateur sans maintien demanderait de garder trois doigts sur
    // l'ecran.
    expect(ARP_UI).toContain("onBasculerNote(note)");
    expect(PANNEAU).toContain("function arpToutRelacher()");
  });

  it("les classes rendues ont une regle CSS", () => {
    for (const c of ["arp-panneau", "arp-tete", "arp-bouton", "arp-reglages", "arp-clavier", "arp-touche", "arp-pied"]) {
      expect(CSS, `.${c} sans regle`).toMatch(new RegExp(`\\.${c}[\\s,{:.]`));
    }
  });
});

describe("le sequenceur, a cote de l'arpege", () => {
  /**
   * Les deux vivent dans le meme panneau parce qu'ils partagent l'horloge et
   * les sorties — rien d'autre. L'arpege deroule ce qu'on TIENT, la sequence
   * joue ce qu'on a ECRIT.
   */
  const corpsSeq = (entete: string) => {
    const i = PANNEAU.indexOf(entete);
    expect(i, `${entete} introuvable`).toBeGreaterThan(-1);
    const j = PANNEAU.indexOf("\n  function ", i + entete.length);
    return PANNEAU.slice(i, j < 0 ? PANNEAU.length : j);
  };

  it("utilise la logique pure, sans la reimplementer", () => {
    expect(PANNEAU).toContain("pasAJouer(p.sequence, p.direction");
    expect(PANNEAU).toContain('from "@studio-hub/musique"');
  });

  it("partage les divisions du delai et de l'arpege", () => {
    expect(corpsSeq("function seqPas()")).toContain("dureeDivisionMs(p.bpm, p.division)");
  });

  it("lit ses reglages dans un releve, pas dans la portee capturee", () => {
    // Une minuterie capture le tour de rendu qui l'a creee : sans releve,
    // changer de gamme en cours de lecture ne s'entendrait qu'au prochain
    // rendu declenche par autre chose.
    expect(corpsSeq("function seqPas()")).toContain("seqParamsRef.current");
  });

  it("chaque pas relache le precedent", () => {
    expect(corpsSeq("function seqPas()")).toContain("seqRelacher();");
  });

  it("l'arret coupe la minuterie ET relache", () => {
    const bloc = corpsSeq("function seqArreter()");
    expect(bloc).toContain("clearTimeout(seqTimerRef.current)");
    expect(bloc).toContain("seqRelacher();");
  });

  it("PANIC arrete aussi le sequenceur", () => {
    // Un PANIC qui laisse une minuterie tourner renverrait des notes juste
    // apres avoir tout coupe.
    //
    // Ce bloc etait ecrit deux fois — ici et dans `arpArreter` — et une
    // minuterie ajoutee plus tard n'est entree dans aucune des deux copies.
    // Il vit maintenant dans `seqCouperSansRelacher`, seul endroit a tenir a
    // jour ; ce test verifie donc l'appel ET ce que la fonction appelee fait
    // reellement, sans quoi il suffirait d'appeler une fonction vide.
    expect(corpsSeq("function panic()")).toContain("seqCouperSansRelacher()");
    const coupe = corpsSeq("function seqCouperSansRelacher()");
    expect(coupe).toContain("seqRunningRef.current = false");
    expect(coupe).toContain("clearTimeout(seqTimerRef.current)");
  });

  it("le demontage relache la note du sequenceur aussi", () => {
    // On verifie que la note ENTRE dans ce qu'on relache, pas que son nom
    // apparaisse : `seqSonnanteRef.current = null` suffisait a satisfaire un
    // premier jet, alors meme que la note n'etait plus coupee. Sixieme
    // variante du meme piege — chercher un nom la ou il faut chercher un
    // emploi.
    const i = PANNEAU.indexOf("// Démontage : couper la minuterie");
    const bloc = PANNEAU.slice(i, PANNEAU.indexOf("}, []);", i));
    expect(bloc).toMatch(/\[\.\.\.arpSoundingRef\.current, seqSonnanteRef\.current\]/);
    expect(bloc).toContain("for (const note of suspendues)");
  });

  it("l'interface n'a aucun etat interne", () => {
    // La sequence vit chez l'hote, la ou la minuterie la lit. Deux copies
    // divergeraient au premier pas joue.
    expect(SEQ_UI).not.toContain("useState");
    expect(SEQ_UI).not.toContain("useRef");
  });

  it("l'interface ne touche ni au MIDI ni a l'horloge", () => {
    expect(SEQ_UI).not.toContain("setTimeout");
    expect(SEQ_UI).not.toContain("broadcastNote");
    expect(SEQ_UI).not.toContain("requestMIDIAccess");
  });

  it("elle reutilise le selecteur de gamme au lieu d'un menu de plus", () => {
    expect(SEQ_UI).toMatch(/<SelecteurGamme[\s/>]/);
  });

  it("les classes rendues ont une regle CSS", () => {
    for (const c of ["seq", "seq__grille", "seq__pas", "seq__note", "seq__bascule", "seq__marche"]) {
      expect(CSS, `.${c} sans regle`).toMatch(new RegExp(`\\.${c}[\\s,{:.]`));
    }
  });
});
