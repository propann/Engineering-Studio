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
const EFFETS = readFileSync(path.join(DIR, "..", "core", "audio", "effets.ts"), "utf-8");
const ENVELOPPE = readFileSync(path.join(DIR, "..", "core", "audio", "enveloppe.ts"), "utf-8");
const LFO = readFileSync(path.join(DIR, "..", "core", "audio", "lfo.ts"), "utf-8");
/**
 * Les moteurs 16 a 20, sortis du composant le 2026-08-29.
 *
 * Meme raison que pour effets.ts, enveloppe.ts et lfo.ts : le code qui LIT les
 * parametres a demenage, et un test qui ne lirait que AudioPluginRack.tsx
 * declarerait inertes vingt-trois reglages parfaitement cables. C'est la
 * troisieme fois que ce test suit une extraction ; il est concu pour.
 */
const MOTEURS = readFileSync(path.join(DIR, "..", "core", "audio", "moteurs.ts"), "utf-8");

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
    // Emplacement de module du Labo : quel panneau s'affiche sous les
    // moteurs. Aucun moteur ne le lit, et c'est correct — il ne decide
    // de rien dans le son. Son cablage est verrouille par
    // racks/ModulesLabo.test.ts.
    "moduleLabo",
    // Synchronisation du delay sur le tempo du studio hote. Ces trois-la ne
    // sont lus par aucun moteur, et c'est correct : ils ne font que calculer
    // `fxDelayTime`, qui lui EST cable. Les inscrire ici plutot que de les
    // faire lire par le moteur evite d'ajouter un chemin mort dans les 741
    // lignes de construireVoix. Leur cablage est verrouille par
    // pages/SyncTempo.test.ts.
    "bpmHote",
    "delaySync",
    "delayDivision",
    // Panneau de fabrication d'echantillons : cible, duree, dossier, etat du
    // rendu. Etat d'interface, sans effet sur le son PRODUIT — la cible decide
    // du format du fichier, pas du timbre. Leur propre cablage est verrouille
    // plus bas, par le bloc « fabrique d'echantillons ».
    "cibleExport",
    "dureeExport",
    "exportEnCours",
    "espaceNom",
    // Moteurs superposes : orchestration, pas timbre. Chaque couche est une
    // voix construite par le meme moteur avec un activeEngine different — les
    // parametres qui font le son, eux, restent ceux de la liste ci-dessus.
    "couches",
    // Favoris et etiquettes : classement de la bibliotheque, pas timbre. Ils
    // ne touchent pas au son PRODUIT — seulement a l'ordre dans lequel on
    // trouve les patches qui, eux, le decident.
    "metas",
    "favorisSeuls",
    "selectedRackTab",
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
    // Le corps du moteur PLUS les modules qui lisent des parametres : le rack
    // d'effets et l'enveloppe. Depuis l'extraction de la
    // chaine, les parametres fx sont lus dans core/audio/effets.ts. Les
    // exempter en bloc aurait desarme le garde-fou pour douze parametres ;
    // etendre ce qu'il lit le garde entier — un parametre lu nulle part
    // echoue toujours.
    const corps = moteurSansAffichage() + EFFETS + ENVELOPPE + LFO + MOTEURS;
    // Les gains d'egaliseur ne se lisent plus `p.fxEqLow` mais `p[bande.reglage]`,
    // la bande venant de `BANDES_EQ`. Le nom du parametre reste ecrit une fois
    // et une seule — dans la table — donc il reste cherchable ; l'accepter la
    // garde le garde-fou entier, tandis qu'exempter les parametres fxEq en bloc
    // l'aurait desarme pour trois curseurs.
    //
    // L'indirection elle-meme est verifiee juste en dessous : sans cette ligne,
    // une table dont plus personne ne lit le champ `reglage` passerait pour
    // cablee.
    expect(EFFETS, "les bandes ne sont plus lues par leur champ `reglage`").toContain("p[bande.reglage]");
    const lu = (p: string) => corps.includes(`p.${p}`) || corps.includes(`reglage: "${p}"`);
    const inertes = parametres().filter((p) => !lu(p));
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

describe("favoris et etiquettes", () => {
  /**
   * Les 91 patches d'usine sont des CONSTANTES du source : on ne peut pas y
   * ecrire un favori. Les metadonnees vivent donc a part et sont fusionnees a
   * l'affichage. La logique est testee dans core/patchMeta.test.ts ; ce qui
   * est verrouille ici est son branchement.
   */
  it("fusionne les metadonnees avant de filtrer", () => {
    // PatchSearchEngine lit `tags` et `isFavorite`. Filtrer avant de fusionner
    // chercherait dans des patches encore vierges : la recherche par etiquette
    // ne trouverait jamais rien, et le filtre favoris serait toujours vide.
    // Ce qui compte n'est pas l'ORDRE des lignes — les echanger ne change rien,
    // elles sont independantes — mais ce que le moteur RECOIT. Une premiere
    // version comparait des positions et restait verte au sabotage.
    const filtre = SOURCE.slice(SOURCE.indexOf("const filtrerPatches"));
    const corps = filtre.slice(0, filtre.indexOf("};"));
    expect(corps).toContain("fusionnerMetas(liste, metas)");
    expect(corps, "le moteur doit recevoir la liste fusionnee").toContain(
      "new PatchSearchEngine(avecMetas)"
    );
    expect(corps, "et jamais la liste brute").not.toMatch(/new PatchSearchEngine\(liste\)/);
    expect(corps, "le retour rapide aussi").toContain("return avecMetas");
  });

  it("persiste a chaque modification", () => {
    // Un favori perdu au rechargement serait pire que pas de favori du tout.
    const maj = SOURCE.slice(SOURCE.indexOf("const majMetas"));
    expect(maj.slice(0, maj.indexOf("};"))).toContain("ecrireMetas");
  });

  it("relit les metadonnees au demarrage", () => {
    expect(SOURCE).toMatch(/useState<MetasPatches>\(\(\) => lireMetas\(\)\)/);
  });

  it("passe le filtre favoris au moteur de recherche", () => {
    // `getFavorites` existait deja dans PatchSearchEngine, inutilisee.
    expect(SOURCE).toMatch(/favorisSeuls \? \{ favorites: true \}/);
  });

  it("n'a plus de type PatchPreset local", () => {
    // Le rack en declarait un sous-ensemble strict, sans tags ni isFavorite :
    // deux definitions du meme objet, dont une amputee. C'est ce qui empechait
    // d'afficher un favori sans changer de type.
    expect(SOURCE).not.toMatch(/^interface PatchPreset \{/m);
    expect(SOURCE).toMatch(/import type \{ PatchPreset \} from/);
  });
});

describe("ondes des couches", () => {
  /**
   * Une trace par patch superpose, pour VOIR ce que chaque couche apporte.
   * Sommer les couches en une seule onde donnerait un trace correct mais
   * inutile : on ne saurait plus ce que chacune fait.
   */
  it("garde des analyseurs persistants entre les notes", () => {
    // Une voix vit le temps d'une note. Un analyseur cree avec elle ne
    // montrerait rien entre deux frappes.
    expect(SOURCE).toContain("analyseursCouchesRef");
    expect(SOURCE).toMatch(/const analyseursPourCouches = \(/);
  });

  it("ne branche les analyseurs QU'EN direct", () => {
    // Brancher un noeud d'un contexte hors ligne sur un analyseur du contexte
    // vivant leve. Le rendu ne doit donc rien recevoir.
    expect(SOURCE).toMatch(/if \(analyseurs\) \{/);
    expect(SOURCE).not.toMatch(/construireCouches\(offline[^)]*analyseurs/);
  });

  it("trace une couche par patch, pas une somme", () => {
    const scope = SOURCE.slice(SOURCE.indexOf("Une trace par couche superposee"));
    expect(scope).toMatch(/for \(let couche = combien - 1; couche >= 0; couche--\)/);
  });

  it("dessine le patch actif PAR-DESSUS les couches", () => {
    // D'ou la boucle decroissante : trace en dernier, il reste lisible quand
    // les ondes se recouvrent.
    const scope = SOURCE.slice(SOURCE.indexOf("Une trace par couche superposee"));
    expect(scope).toContain("couche--");
  });

  it("ne trace pas une couche muette", () => {
    // Une ligne plate par couche encombrerait sans rien apprendre.
    const scope = SOURCE.slice(SOURCE.indexOf("Une trace par couche superposee"));
    expect(scope).toContain("if (peak < 2) continue");
  });

  it("retablit l'opacite apres les couches translucides", () => {
    // Sans ce retour a 1, la grille et tout ce qui suit heriteraient de
    // l'opacite de la derniere couche tracee.
    const scope = SOURCE.slice(SOURCE.indexOf("Une trace par couche superposee"));
    expect(scope).toContain("ctx.globalAlpha = 1;");
  });
});

describe("rack embarquable dans un studio", () => {
  /**
   * Le rack est une page qui revendique la fenetre entiere. Chacun des points
   * ci-dessous casserait le studio hote d'une facon qui ne se voit pas en
   * developpement, puisque le rack seul continuerait de fonctionner.
   */
  it("masque sa TopBar en tiroir", () => {
    // Elle appelle window.navigateMaquette : un clic dedans demonterait le
    // studio. Et on aurait deux barres empilees, dont une proposant de partir.
    expect(SOURCE).toContain("hideTopBar={enTiroir}");
  });

  it("branche onClose, qui ne servait a rien", () => {
    // Deconstruit depuis toujours, jamais utilise : le rack n'avait aucun
    // moyen de se fermer, alors que le hub lui passait la fonction.
    expect(SOURCE).toMatch(/onClick=\{onClose\}/);
  });

  it("cesse de revendiquer la fenetre", () => {
    expect(SOURCE).toMatch(/enTiroir \? "en-tiroir" : ""/);
  });

  it("n'attache le clavier QUE s'il est actif", () => {
    // Les ecouteurs sont poses sur `window` : un tiroir ferme jouerait des
    // notes sous les doigts de quelqu'un qui travaille dans le studio.
    const bloc = SOURCE.slice(SOURCE.indexOf('window.addEventListener("keydown"') - 400);
    expect(bloc.slice(0, 600)).toContain("if (clavierActif) {");
  });

  it("ignore les touches modifiees", () => {
    // L'EP-133 utilise Ctrl+D et Ctrl+Q ; `d` et `q` sont dans le mapping
    // piano. Sans ce test, Ctrl+D duplique la selection ET joue un mi.
    expect(SOURCE).toContain("if (e.ctrlKey || e.metaKey || e.altKey) return;");
  });

  it("ne joue pas pendant qu'on tape dans un champ riche", () => {
    expect(SOURCE).toContain("t.isContentEditable");
  });

  it("rejoue l'effet quand le clavier est active ou coupe", () => {
    // Avec `[]`, ouvrir le tiroir n'attacherait jamais les ecouteurs.
    expect(SOURCE).toContain("}, [clavierActif]);");
  });

  it("mesure la latence avec l'horodatage du repartiteur", () => {
    // Passe `undefined` un temps : le segment « file d'attente » retombait a 0
    // sans que rien ne le signale, les deux autres restant justes.
    expect(SOURCE).toContain("mesurerLatence(tEntree, horodatage)");
  });
});

describe("effets globaux", () => {
  /**
   * Places APRES les moteurs, donc appliques a la superposition entiere.
   *
   * L'invariant qui compte : ils traversent le jeu ET le rendu hors ligne. Si
   * la chaine n'existait que pour l'ecoute, le fichier fabrique sonnerait
   * autrement que ce qu'on entend — et rien ne le signalerait, puisque les deux
   * chemins fonctionneraient parfaitement chacun de leur cote.
   */
  it("s'applique au jeu", () => {
    expect(SOURCE).toMatch(/construireEffets\(ctx, p, now\)/);
  });

  it("s'applique AUSSI au rendu hors ligne", () => {
    expect(SOURCE).toMatch(/construireEffets\(offline, p, 0\)/);
  });

  it("s'intercale entre la voix et la destination", () => {
    // Branche en derivation plutot qu'en serie, la chaine ne recevrait rien.
    expect(SOURCE).toContain("env.connect(effets.entree)");
    expect(SOURCE).toContain("effets.sortie.connect(masterBusRef.current!)");
    expect(SOURCE).toContain("effets.sortie.connect(offline.destination)");
  });

  it("le LFO global est bien branche dans la voix", () => {
    // Meme piege que pour l'enveloppe : le garde-fou « aucun parametre
    // inerte » lit desormais la source du module LFO, donc `lfoRate` y
    // parait utilise meme si le moteur ne l'appelle plus. Ce test verifie le
    // LIEN, pas la presence du nom.
    const corps = moteurAudio();
    expect(corps).toContain("lfoActif(p)");
    expect(corps).toContain("vitesseLfoHz(p, p.bpmHote)");
    // Insere entre le gain et l'enveloppe : c'est le point par lequel les
    // seize moteurs passent tous.
    expect(corps).toContain("apresGain.connect(env)");
    expect(corps).not.toContain("masterGain.connect(env)");
  });

  it("resout l'enveloppe depuis les parametres, sans constantes en dur", () => {
    // Ce test manquait, et son absence etait un trou reel : le garde-fou
    // « aucun parametre inerte » lit desormais la source du module
    // d'enveloppe, donc `envAttack` y paraissait utilise meme apres avoir
    // remis des constantes en dur dans le moteur. Un sabotage l'a montre —
    // remplacer resoudreEnveloppe par les quatre valeurs d'origine ne faisait
    // tomber aucun test.
    expect(SOURCE).toContain("resoudreEnveloppe(p)");
    const corps = moteurAudio();
    expect(corps).not.toMatch(/const ATTACK = 0\.\d+/);
    expect(corps).not.toMatch(/const SUSTAIN = 0\.\d+/);
  });

  it("delegue au rack d'effets plutot que de refaire la chaine", () => {
    // La chaine vivait au milieu de ce fichier de 3900 lignes : la separation
    // des trois racks n'existait que dans l'interface. Elle est maintenant
    // dans le code, et ses invariants — reinjection bornee, temps de delai
    // borne, voie directe — sont testes pour de vrai sur des fonctions pures
    // par core/audio/effets.test.ts, au lieu d'etre lus dans le source.
    expect(SOURCE).toContain('from "../core/audio/effets"');
    // La largeur du contexte est passee PAR le rack, qui connait sa
    // destination — la chaine, elle, doit l'ignorer pour rester identique au
    // jeu et au rendu. Un test de effets.test.ts lui interdit d'aller la lire ;
    // celui-ci verifie l'autre moitie du contrat, que quelqu'un la lui donne.
    expect(SOURCE).toContain("construireChaineEffets(ctx, p, now, ctx.destination.channelCount)");
  });

  it("l'adaptation ne reintroduit aucune construction de noeud", () => {
    // Le risque de la delegation : qu'on rajoute « juste un filtre » ici, hors
    // du rack d'effets, et que le rendu hors ligne ne l'ait pas.
    const i = SOURCE.indexOf("const construireEffets = (");
    const bloc = SOURCE.slice(i, SOURCE.indexOf("construireChaineEffets(ctx, p, now", i));
    expect(bloc).not.toMatch(/ctx\.create/);
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
    //
    // Le rendu passe par construireCouches depuis la superposition. Ce qui
    // compte n'est pas QUELLE fonction est appelee, mais que la chaine remonte
    // toujours a construireVoix — d'ou les deux assertions.
    expect(SOURCE, "le rendu doit deleguer").toMatch(/construireCouches\(offline/);
    expect(SOURCE, "les couches doivent passer par construireVoix").toMatch(
      /construireVoix\(ctx, jeu, freq, now\)/
    );
  });

  it("joue et rend par le MEME chemin", () => {
    // Si le jeu passait par les couches et le rendu par une voix seule, le
    // fichier ne sonnerait pas comme ce qu'on entend — et rien ne le dirait.
    // Trois sites, nommes plutot que comptes : compter m'a fait ecrire 4 en
    // incluant la declaration, qui s'ecrit `construireCouches = (` et
    // n'est donc pas attrapee par la meme regex.
    expect(SOURCE, "le jeu").toMatch(/construireCouches\(ctx,/);
    expect(SOURCE, "la sonde de duree").toMatch(/construireCouches\(sonde,/);
    expect(SOURCE, "le rendu").toMatch(/construireCouches\(offline,/);
  });

  it("compense le niveau quand des patches se superposent", () => {
    // Quatre couches a plein volume saturent des la deuxieme. La racine du
    // nombre de couches, et non le nombre : des sources non correlees
    // s'additionnent en puissance, pas en amplitude.
    expect(SOURCE).toMatch(/Math\.sqrt\(Math\.max\(1, jeux\.length\)\)/);
  });

  it("applique les reglages PROPRES a chaque patch superpose", () => {
    // Superposer une basse Plaits et une nappe Rings doit donner les deux
    // timbres. Empiler le meme jeu de parametres avec un moteur different
    // donnerait le bon moteur mais les mauvais reglages — un son qui ne
    // ressemble a aucun des deux patches choisis.
    expect(SOURCE).toContain("...p, ...patch.params, activeEngine: patch.engine");
  });

  it("ignore un patch supprime entre-temps", () => {
    // La liste des couches vit dans l'etat ; un patch personnel efface entre
    // deux notes laisserait un identifiant orphelin.
    const emp = SOURCE.slice(SOURCE.indexOf("const couchesEmpilees"));
    expect(emp.slice(0, emp.indexOf("};"))).toContain("if (!patch) continue");
  });

  it("garde l'horizon sonore le plus tardif de toutes les couches", () => {
    // Prendre le premier couperait les moteurs a longue resonance : Rings
    // s'excite sur 20 ms mais sonne bien plus longtemps.
    const couches = SOURCE.slice(SOURCE.indexOf("const construireCouches"));
    expect(couches).toMatch(/audibleEnd = Math\.max\(audibleEnd, voix\.audibleEnd\)/);
  });

  it("isole l'echec d'une couche", () => {
    // Une couche muette vaut mieux qu'un empilement entierement silencieux.
    const couches = SOURCE.slice(
      SOURCE.indexOf("const construireCouches"),
      SOURCE.indexOf("const rendreEchantillon")
    );
    expect(couches).toMatch(/catch \(e\)/);
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
    expect(rendu).toMatch(/rampeVers\(voix\.env\.gain, 0,/);
    // Et la MEME forme de rampe qu'au jeu. Un rendu fige en exponentiel
    // pendant que le jeu monte en droite donnerait un fichier qui ne sonne pas
    // comme ce qu'on entend — sans que rien ne le signale.
    expect(rendu).toMatch(/rampeVers\([^)]*formeRampe\(p\)\)/);
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
    // On distingue l'ANNOTATION de l'ACCES, plutot que de compter.
    //
    // Deux versions precedentes se sont trompees : une regex attrapait
    // l'annotation de la signature et echouait sur du code correct ; puis un
    // comptage a 1 a casse des qu'une seconde fonction du meme bloc a recu la
    // meme annotation, parfaitement legitime.
    //
    // Ce qui compte : `typeof paramsRef.current` en annotation ne produit aucun
    // acces a l'execution. Un `paramsRef.current` nu, si.
    const corps = moteurAudio().replace(/typeof paramsRef\.current/g, "");
    expect(corps, "acces a paramsRef dans le moteur").not.toContain("paramsRef");
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
