import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Branchement du delay sur le tempo du studio hote.
 *
 * Le plan annoncait ici « une victoire gratuite : le rack demarre et s'arrete
 * avec les studios ». C'etait faux : le rack n'a pas de transport — ni lecture,
 * ni arret, ni curseur. Il n'y a rien a demarrer.
 *
 * Ce qui depend reellement du tempo dans le rack, ce sont deux valeurs : le
 * temps de delay et la vitesse d'arpege. Le delay est branche ici ; l'arpege
 * attend le module 5, qui refera l'arpegiateur en entier.
 *
 * Ces tests lisent le source parce que le defaut vise n'est pas de type : un
 * abonnement retire, un recalage qui n'appelle pas `updateParam`, un curseur
 * qui reste actif — tout cela compile et se construit sans broncher.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RACK = readFileSync(path.join(DIR, "AudioPluginRack.tsx"), "utf-8");
const CSS = readFileSync(path.join(DIR, "audio-plugin-rack.css"), "utf-8");
// L'interface du delai vit dans le rack d'effets : chaque rack porte la sienne.
// Ces tests lisent donc deux sources — le rack de moteurs pour l'ecoute du
// tempo, le rack d'effets pour les commandes.
const EFFETS_UI = readFileSync(path.join(DIR, "..", "racks", "RackEffets.tsx"), "utf-8");

describe("le rack ecoute le tempo de l'hote", () => {
  it("lit bien le source du rack", () => {
    expect(RACK.length).toBeGreaterThan(100000);
  });

  it("s'abonne a hub:transport", () => {
    // Le studio hote rediffuse le transport du hub sur `window` ; embarque, le
    // rack est dans le meme document. Sans cet abonnement il reste a 120 quoi
    // que fasse le studio, et le bouton SYNC calerait sur un tempo invente.
    expect(RACK).toContain('window.addEventListener("hub:transport"');
  });

  it("se desabonne au demontage", () => {
    // Le rack se monte et se demonte a chaque ouverture de tiroir. Un
    // ecouteur laisse derriere s'accumulerait a chaque cycle.
    expect(RACK).toContain('window.removeEventListener("hub:transport"');
  });

  it("refuse un BPM qui n'en est pas un", () => {
    // Le message vient d'une autre fenetre par postMessage : rien ne garantit
    // sa forme. Un NaN se propagerait jusqu'a delayTime, ou il ne leve pas —
    // il rend le delay muet, ce qui se diagnostique tres mal.
    expect(RACK).toMatch(/Number\.isFinite\(msg\.bpm\)/);
  });

  it("recalcule le temps de delay quand le tempo change", () => {
    expect(RACK).toContain("dureeDivisionMs(bpmHote, delayDivision)");
  });

  it("passe par updateParam et non par le setter nu", () => {
    // `updateParam` reporte la valeur dans le patch courant. Avec
    // `setFxDelayTime` seul, l'ecran afficherait le bon temps mais un sample
    // rendu ensuite reprendrait l'ancien — divergence silencieuse entre ce
    // qu'on entend et ce qu'on exporte.
    expect(RACK).toMatch(/updateParam\("fxDelayTime", dureeDivisionMs\(/);
  });

  it("le recalage depend des trois valeurs qui le determinent", () => {
    // Une dependance manquante fige le delay au tempo recu en premier.
    const i = RACK.indexOf("dureeDivisionMs(bpmHote, delayDivision)");
    expect(RACK.slice(i, i + 200)).toContain("[delaySync, bpmHote, delayDivision]");
  });
});

describe("l'interface du delay synchronise", () => {
  it("desactive le curseur TEMPS quand SYNC est actif", () => {
    // Sinon on peut le bouger : la valeur saute, puis revient au prochain
    // recalage. Un controle qui ne tient pas ce qu'on lui donne.
    const i = EFFETS_UI.indexOf("TEMPS {params.fxDelayTime} ms");
    expect(i).toBeGreaterThan(-1);
    expect(EFFETS_UI.slice(i, i + 300)).toContain("disabled={delaySync}");
  });

  it("verrouille le choix de division tant que SYNC est inactif", () => {
    const i = EFFETS_UI.indexOf('className="fx-sync-div"');
    expect(i).toBeGreaterThan(-1);
    expect(EFFETS_UI.slice(i, i + 200)).toContain("disabled={!delaySync}");
  });

  it("affiche le tempo sur lequel il cale", () => {
    // Un « SYNC » allume sans chiffre laisse croire que ca marche alors que le
    // rack peut etre reste sur son 120 par defaut, faute de studio hote.
    expect(EFFETS_UI).toContain("`· ${bpmHote} BPM`");
  });

  it("propose toutes les divisions, sans liste ecrite en dur", () => {
    // Une seconde liste divergerait de ORDRE_DIVISIONS a la premiere retouche.
    expect(EFFETS_UI).toContain("ORDRE_DIVISIONS.map((d) => (");
  });

  it("les classes rendues ont une regle CSS", () => {
    // Le defaut classique du fichier : une classe posee dans le JSX que
    // personne ne definit. Ni le typecheck ni le build ne le voient.
    for (const c of ["fx-sync", "fx-sync-btn", "fx-sync-div"]) {
      expect(CSS).toMatch(new RegExp(`\\.${c}[\\s,{:.]`));
    }
  });
});

describe("cycle de vie de l'AudioContext", () => {
  const bloc = () => {
    const i = RACK.indexOf("// Ferme l'AudioContext au demontage.");
    expect(i).toBeGreaterThan(-1);
    return RACK.slice(i, i + 1800);
  };

  it("ferme le contexte au demontage", () => {
    // Le rack en creait un par montage sans jamais le fermer. En tiroir de
    // studio, chaque ouverture en ajoutait un — et Chrome en plafonne six par
    // document. Au septieme, plus aucun son et aucune erreur.
    expect(bloc()).toMatch(/ctx\.close\(\)/);
  });

  it("le fait dans un effet de demontage, pas dans celui du clavier", () => {
    // Le nettoyage du clavier depend de `clavierActif` : il se rejoue a chaque
    // bascule du tiroir. Y fermer le contexte le tuerait en pleine session.
    //
    // On lit le CODE, pas le commentaire qui le precede — celui-ci nomme
    // `clavierActif` pour expliquer justement pourquoi il n'y est pas. Un
    // premier jet de ce test partait du commentaire et tombait sur sa propre
    // prose.
    const i = RACK.indexOf("// Ferme l'AudioContext au demontage.");
    const debut = RACK.indexOf("useEffect(() => {", i);
    const fin = RACK.indexOf("}, []);", debut);
    expect(debut).toBeGreaterThan(-1);
    expect(fin).toBeGreaterThan(debut);
    // Le corps de l'effet ne mentionne pas clavierActif...
    expect(RACK.slice(debut, fin)).not.toContain("clavierActif");
    // ...et ses dependances sont bien vides : `[]` = demontage seul.
    expect(RACK.slice(fin, fin + 7)).toBe("}, []);");
    // Le contexte se ferme bien la, et pas ailleurs.
    expect(RACK.slice(debut, fin)).toContain("ctx.close()");
  });

  it("remet les references a zero, pas seulement le contexte", () => {
    // En mode strict React rejoue l'effet sur la MEME instance, donc avec les
    // memes refs. Un contexte ferme laisse dans audioCtxRef rendrait le
    // developpement muet, et le bus reste accroche a un contexte mort.
    const b = bloc();
    for (const ref of ["audioCtxRef", "masterBusRef", "analyserRef", "reverbRef", "reverbReturnRef"]) {
      expect(b, `${ref} non remise a zero`).toContain(`${ref}.current = null;`);
    }
  });

  it("ne ferme pas deux fois", () => {
    expect(bloc()).toMatch(/state === "closed"/);
  });

  it("ne laisse pas un rejet sans capture", () => {
    // `close()` rejette si le contexte est deja en fermeture.
    expect(bloc()).toMatch(/ctx\.close\(\)\.catch\(/);
  });
});
