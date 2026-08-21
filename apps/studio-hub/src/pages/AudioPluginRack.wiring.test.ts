import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Test structurel du cablage du rack.
 *
 * Il lit le source plutot que d'executer du code, ce qui est inhabituel mais
 * justifie ici par ce qui s'est deja produit : le fichier a ete pousse une
 * fois tronque, ampute de 478 lignes, avec les six briques DSP disparues et
 * les 33 parametres redevenus inertes. Rien ne l'avait signale — le typecheck
 * passait, le build aussi, et l'application se lancait sans erreur.
 *
 * L'invariant verifie ici est simple : tout parametre qui a un curseur dans
 * l'interface doit etre lu par le moteur audio. Sinon le curseur bouge, le
 * toast s'affiche, la note joue — et le son ne change pas. C'est exactement
 * l'etat dans lequel 39 % des controles se trouvaient.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = readFileSync(path.join(DIR, "AudioPluginRack.tsx"), "utf-8");

/**
 * Corps de construireVoix : la fonction qui fabrique reellement le son.
 *
 * Les moteurs vivaient dans playPluginNote jusqu'au 2026-08-21. Ils en ont ete
 * extraits pour que le meme code serve un contexte vivant et un contexte
 * hors ligne — c'est ce qui permet de rendre un fichier plus vite que le temps
 * reel, et de superposer plusieurs moteurs. Ce test avait signale le
 * deplacement en tombant : c'etait son role.
 */
function moteurAudio(): string {
  const debut = SOURCE.indexOf("const construireVoix");
  // Borne explicite plutot que « la fonction suivante » : la premiere version
  // bornait sur `const playPluginNote` et a casse des qu'une fonction s'est
  // glissee entre les deux — trois tests tombes pour un simple placement.
  const fin = SOURCE.indexOf("// ===== FIN DES MOTEURS =====");
  expect(debut, "construireVoix introuvable").toBeGreaterThan(-1);
  expect(fin, "borne FIN DES MOTEURS introuvable").toBeGreaterThan(debut);
  return SOURCE.slice(debut, fin);
}

/**
 * Meme corps, prive des appels a showToast.
 *
 * Necessaire : les toasts affichent la valeur des parametres, si bien qu'un
 * parametre devenu inerte pour le son continue d'y apparaitre. La premiere
 * version de ce test s'y laissait prendre — remplacer p.plBitcrush par une
 * constante dans le traitement ne la faisait pas broncher, puisque le toast
 * la mentionnait encore.
 */
function moteurSansAffichage(): string {
  return moteurAudio().replace(/showToast\([\s\S]*?\);/g, "");
}

/** Parametres declares en useState, hors etat purement visuel. */
function parametres(): string[] {
  const HORS_SUJET = new Set([
    "activeEngine",
    "selectedPatchId",
    "midiConnected",
    "midiDeviceName",
    "midiStatus",
    "lastMidi",
    "lastNote",
    "audioState",
    "activeKeyNote",
    "userPatches",
    "newPatchName",
    "showSaveModal",
    "toastMessage",
    // Filtre de la liste de patches : etat d'interface, sans effet sur le son
    // par construction. Son propre cablage est verrouille ailleurs, par
    // modules/audio-rack-01-patch-search/PatchSearchWiring.test.ts.
    "patchQuery",
    // Panneau de fabrication d'echantillons : cible, duree, dossier, etat du
    // rendu. Etat d'interface, sans effet sur le son PRODUIT — la cible decide
    // du format du fichier, pas du timbre. Leur propre cablage est verrouille
    // plus bas, par le bloc « fabrique d'echantillons ».
    "cibleExport",
    "dureeExport",
    "exportEnCours",
    "espaceNom",
  ]);
  return [...SOURCE.matchAll(/const \[(\w+), set\w+\] = useState/g)]
    .map((m) => m[1])
    .filter((n) => !HORS_SUJET.has(n));
}

describe("integrite du fichier", () => {
  it("ne contient pas de sortie d'outil collee dans le source", () => {
    // Le fichier a deja ete pousse avec « Warning: truncated output » en
    // premiere ligne. Ce n'est pas du TypeScript : le build cassait.
    expect(SOURCE).not.toMatch(/truncated output|Total output lines/);
  });

  it("commence par un import", () => {
    const premiere = SOURCE.split("\n").find((l) => l.trim().length > 0) ?? "";
    expect(premiere.trimStart()).toMatch(/^(import|\/\/|\/\*|"use client")/);
  });

  it("declare toujours les quinze moteurs", () => {
    const moteurs = [
      "mi_plaits", "mi_braids", "mi_rings", "mi_clouds", "mi_elements",
      "dexed_fm", "surge_xt", "zynaddsubfx", "helm", "fluidsynth",
      "amsynth", "amy_engine", "pl_synth", "open303", "faust_dsp",
    ];
    const corps = moteurAudio();
    for (const m of moteurs) {
      expect(corps, `moteur ${m} absent du moteur audio`).toContain(`"${m}"`);
    }
  });
});

describe("cablage des parametres", () => {
  it("lit chaque parametre declare dans le moteur audio", () => {
    // L'invariant central. Un parametre absent d'ici est un curseur qui ne
    // produit aucun son.
    const corps = moteurSansAffichage();
    const inertes = parametres().filter((p) => !corps.includes(`p.${p}`));
    expect(inertes, `parametres sans effet sur le son : ${inertes.join(", ")}`).toEqual([]);
  });

  it("en declare autant qu'attendu", () => {
    // Filet contre une troncature silencieuse : le fichier ampute n'en avait
    // plus que 50 sur 83.
    expect(parametres().length).toBeGreaterThanOrEqual(83);
  });
});

describe("briques DSP", () => {
  it("importe les six briques partagees", () => {
    // Elles ont disparu une fois avec la troncature. Leur absence rend
    // muets bitcrush, repliement, reverberation, LFO et boucles de retour.
    for (const b of [
      "buildBitcrushCurve",
      "buildSaturationCurve",
      "buildPulseWave",
      "buildImpulseResponse",
      "attachLfo",
      "buildFeedbackLoop",
    ]) {
      expect(SOURCE, `brique ${b} non importee`).toContain(b);
    }
  });

  it("branche la reverberation partagee sur plusieurs moteurs", () => {
    // Un seul convolveur sert fluidReverb, zynReverbSend, helmReverb et
    // cloudsReverb : moins de trois envois signale une regression.
    const envois = [...moteurAudio().matchAll(/sendToReverb\(/g)].length;
    expect(envois).toBeGreaterThanOrEqual(3);
  });
});

describe("fabrique d'echantillons", () => {
  /**
   * Le rack fabriquait un son qu'on ne pouvait qu'ecouter. Cette chaine — rendu
   * hors ligne, encodage, ecriture verifiee — est ce qui permet de le garder.
   *
   * Chaque maillon peut se debrancher sans que rien ne le signale : le bouton
   * resterait a l'ecran, le rendu tournerait, et le fichier serait faux ou
   * absent. D'ou ces verrous structurels.
   */
  it("rend hors ligne, pas en temps reel", () => {
    // Un pack de 60 notes en temps reel prendrait plusieurs minutes.
    expect(SOURCE).toContain("new OfflineAudioContext");
  });

  it("reutilise le moteur au lieu d'en redefinir un", () => {
    // Un second chemin audio divergerait du premier a la premiere evolution :
    // le sample ne sonnerait plus comme ce qu'on entend.
    expect(SOURCE).toMatch(/construireVoix\(offline/);
  });

  it("programme le relachement du rendu", () => {
    // Sans lui, l'enveloppe reste au sustain jusqu'au dernier echantillon et le
    // fichier se coupe net — un claquement a chaque lecture.
    //
    // Les DEUX appels comptent : le palier qui fixe le point de depart, puis la
    // rampe qui descend. Une premiere version ne cherchait que
    // `plan.debutRelachement`, present dans les deux — retirer le palier seul
    // ne la faisait pas broncher.
    const rendu = SOURCE.slice(
      SOURCE.indexOf("const rendreEchantillon"),
      SOURCE.indexOf("const empreinte")
    );
    expect(rendu).toMatch(/setValueAtTime\([^)]*SUSTAIN/);
    expect(rendu).toMatch(/exponentialRampToValueAtTime\(0\.0001/);
  });

  it("dimensionne le tampon par planifierRendu", () => {
    // Le calcul est teste a part, dans core/audio/rendu.test.ts. Ce qui compte
    // ici est qu'on s'en serve plutot que de recalculer a la main.
    expect(SOURCE).toContain("planifierRendu(");
  });

  it("encode selon le format de la cible, pas un format fixe", () => {
    // L'OP-1 lit de l'AIFF ; lui ecrire du WAV produit un fichier qu'elle
    // ignore, sans message.
    // Pinter le CHOIX d'encodeur, pas la simple presence de la condition :
    // `spec.format === "aiff"` sert aussi a nommer l'extension du fichier, si
    // bien qu'une premiere version de ce test restait verte alors que le
    // sabotage avait fige l'encodeur. Deux occurrences, une seule qui compte.
    expect(SOURCE).toMatch(/spec\.format === "aiff"\s*\?\s*encodeAiffPcm16/);
    expect(SOURCE).toMatch(/:\s*encodeWavPcm16\(/);
  });

  it("RELIT le fichier ecrit et compare les empreintes", () => {
    // Le verrou central. Un write() qui rend la main ne garantit pas que les
    // octets sont sur le support : c'est le seul endroit ou une ecriture
    // tronquee est detectable. Meme precaution que copyFile du coffre, validee
    // sur l'OP-1 le 2026-08-21.
    const corps = SOURCE.slice(SOURCE.indexOf("const exporterEchantillon"));
    expect(corps).toContain("fichier.getFile()");
    expect(corps).toMatch(/Vérification impossible après écriture/);
  });

  it("range le pack dans un sous-dossier par patch", () => {
    // 49 fichiers a plat rendraient l'espace de travail inutilisable des le
    // deuxieme pack.
    const pack = SOURCE.slice(SOURCE.indexOf("const exporterPack"));
    expect(pack).toMatch(/getDirectoryHandle\(nomDossier, \{ create: true \}\)/);
  });

  it("verifie chaque fichier du pack, pas seulement le dernier", () => {
    // Un lot interrompu doit s'arreter au fautif. Sans relecture dans la
    // boucle, 49 ecritures ratees passeraient pour un succes.
    // Borner sur la DECLARATION, pas sur le nom : un commentaire du rack cite
    // `const playPluginNote` bien avant, et un indexOf naif rendait une tranche
    // vide — donc un test vert qui ne lisait rien du tout.
    const pack = SOURCE.slice(
      SOURCE.indexOf("const exporterPack"),
      SOURCE.indexOf("const playPluginNote = (")
    );
    expect(pack.length, "tranche du pack vide").toBeGreaterThan(500);
    const boucle = pack.slice(pack.indexOf("for (let note"));
    expect(boucle).toContain("fichier.getFile()");
    expect(boucle).toMatch(/Vérification impossible après écriture/);
  });

  it("dit combien de fichiers etaient deja ecrits quand un lot echoue", () => {
    // « ca a plante » sur 49 fichiers ne dit pas s'il faut tout refaire ou
    // completer. Le compte le dit.
    const pack = SOURCE.slice(SOURCE.indexOf("const exporterPack"));
    expect(pack).toMatch(/\$\{ecrits\} déjà écrits/);
  });

  it("borne la duree par les specs de la machine", () => {
    expect(SOURCE).toContain("dureeAdmise(");
  });

  it("ne demande la permission que depuis un clic", () => {
    // requestStoredPermission appele depuis un effet echoue silencieusement :
    // sans activation utilisateur, le navigateur resout « prompt » sans rien
    // afficher. L'effet de reprise doit se contenter d'interroger.
    const effet = SOURCE.slice(SOURCE.indexOf("Reprise silencieuse au chargement"));
    const finEffet = effet.slice(0, effet.indexOf("}, []);"));
    expect(finEffet).toContain("hasStoredPermission");
    expect(finEffet).not.toContain("requestStoredPermission");
  });
});

describe("independance du contexte audio", () => {
  /**
   * `construireVoix` doit rester utilisable avec N'IMPORTE QUEL contexte audio.
   *
   * C'est ce qui permet de rendre un fichier avec un OfflineAudioContext, plus
   * vite que le temps reel — un pack de 60 notes se fabriquerait sinon en
   * autant de secondes qu'il dure. Et c'est aussi ce qui permettra de
   * superposer plusieurs moteurs sur une meme note.
   *
   * Toute reference au contexte vivant reintroduite ici referme les deux
   * portes d'un coup, sans que rien d'autre ne le signale : le code
   * continuerait de jouer correctement en direct.
   */
  it("ne va pas chercher le contexte lui-meme", () => {
    expect(moteurAudio()).not.toContain("getAudioContext()");
  });

  it("ne connecte rien au bus maitre", () => {
    // La destination est le choix de l'appelant : le bus pour jouer, la
    // destination hors ligne pour rendre un fichier.
    expect(moteurAudio()).not.toContain("masterBusRef");
  });

  it("ne touche a aucune reference de l'interface", () => {
    // diagRef et voicesRef n'existent pas pendant un rendu hors ligne.
    for (const r of ["diagRef", "voicesRef", "toastRef"]) {
      expect(moteurAudio(), `${r} present dans construireVoix`).not.toContain(r);
    }
  });

  it("ne programme aucune minuterie navigateur", () => {
    // window.setTimeout n'a aucun sens pendant un rendu hors ligne : le rendu
    // se termine bien avant que la minuterie ne se declenche.
    expect(moteurAudio()).not.toContain("window.setTimeout");
  });

  it("lit les parametres par son argument, pas par la reference du composant", () => {
    // `typeof paramsRef.current` en annotation de type est admis : il ne
    // produit aucun acces a l'execution. Un `paramsRef.current` dans le corps,
    // lui, lierait la fonction au composant et casserait le rendu hors ligne.
    //
    // On compte plutot qu'on ne filtre : la premiere version de ce test
    // utilisait une regex qui attrapait justement l'annotation de la signature,
    // et echouait sur du code correct. Compter est ici plus sur que motiver.
    const occurrences = [...moteurAudio().matchAll(/paramsRef/g)].length;
    expect(occurrences, "seule l'annotation de type est admise").toBe(1);
  });

  it("rend l'enveloppe et les horizons a l'appelant", () => {
    // Sans ce retour, l'appelant ne peut ni brancher la voix ni programmer son
    // relachement — la fonction serait extraite sans etre utilisable.
    const corps = moteurAudio();
    for (const champ of ["env", "sources", "naturalEnd", "audibleEnd"]) {
      expect(corps, `${champ} absent du retour`).toContain(champ);
    }
  });
});

describe("garde-fous du moteur", () => {
  it("distingue la fin des sources de la fin du son percu", () => {
    // Caler l'enveloppe sur le dernier arret de source etranglait Rings a
    // 20 ms : sa source est une impulsion, tout le son vient de la boucle.
    const corps = moteurAudio();
    expect(corps).toContain("audibleEnd");
    expect(corps).toContain("holdUntil");
  });

  it("passe par une enveloppe plutot qu'un gain constant", () => {
    // Un gain pose en constante puis coupe net produit un clic a chaque note.
    expect(moteurAudio()).toMatch(/exponentialRampToValueAtTime/);
  });

  it("n'utilise aucun cast qui desarme le typage", () => {
    // « as unknown as AudioNode » avait masque une interop impossible : le
    // moteur levait a chaque note, l'erreur partait dans un log, silence
    // total sans que rien ne le signale.
    expect(SOURCE).not.toContain("as unknown as");
  });
});
