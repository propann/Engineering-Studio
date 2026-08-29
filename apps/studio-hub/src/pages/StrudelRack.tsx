"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BPM_MAX,
  BPM_MIN,
  brancher,
  contexte,
  reglerBpm,
  reglerDepart,
  reglerGain,
  reglerPanoramique,
  reverbePartagee,
  sAbonnerTransport,
  transport,
  voies,
  type Prise,
} from "@studio-hub/rack-bus";
import { readProfileName } from "../core/profile";
import {
  EXEMPLES,
  ecrireExtraits,
  enregistrerExtrait,
  lireExtraits,
  supprimerExtrait,
  trierExtraits,
  type Extrait,
} from "../core/strudel/extraits";
import {
  enregistrerMoteurs,
  MOTEURS_JOUABLES,
  reglagesMoteur,
  reglerMoteur,
  type ApiEnregistrement,
} from "../core/strudel/moteursStrudel";
import { CarteMoteur } from "../components/CarteMoteur";
import {
  ALIAS_SONS,
  SONS_DISTANTS_CONNUS,
  SONS_LOCAUX,
  SONS_ZZFX,
  sonsManquants,
} from "../core/strudel/sons";
import { LIMITE_DOC, RACCOURCIS, SECTIONS_DOC } from "../core/strudel/reference";
import { bpmVersCps } from "../core/strudel/tempo";
import {
  effetsMaitre,
  reappliquerEffetsMaitre,
  reglerEffetsMaitre,
  sAbonnerEffets,
} from "../core/audio/effetsMaitre";
import type { ParamsEffets } from "../core/audio/effets";
import { RackEffets } from "../racks/RackEffets";
import type { Division } from "@studio-hub/musique";
import {
  enregistrerProjet,
  lireFichier,
  modifie,
  moyenDisponible,
  nouveauProjet,
  ouvrirProjet,
  type Projet,
} from "../core/strudel/projets";
import {
  ajouterSortie,
  machinesDisponibles,
  panicMachines,
  retirerSorties,
  routeVersMachine,
  type Machine,
} from "../core/strudel/sortieMidi";
import { EditeurStrudel, type PoigneeEditeur } from "../components/EditeurStrudel";
import { OscilloscopePixel } from "../components/OscilloscopePixel";
import { AppShell } from "../ui";
import { chargerSamplesBibliotheque, type SampleLibraryResult } from "../core/audio/bibliotheque";
import { hasStoredPermission, loadDirectoryHandle, WORKSPACE_HANDLE_KEY } from "../core/storage/directoryHandleStore";
import "./strudel-rack.css";

/**
 * Le rack Strudel — du code qui joue.
 *
 * ## Ce que cette page est
 *
 * L'éditeur officiel de Strudel, monté dans le rack du Hub. Même éditeur
 * — CodeMirror, avec le surlignage des événements en direct —, mêmes
 * raccourcis, et une référence consultable à côté. Ce qui change, c'est le
 * branchement : le son ne va pas à la sortie du navigateur, il entre dans le
 * fond de panier comme n'importe quel autre module.
 *
 * ## Les quatre choses que ce rack tient
 *
 * **Le contexte audio est celui du Hub.** `setAudioContext(contexte())` avant
 * `initStrudel` : Strudel fabriquerait sinon le sien et s'y attacherait
 * définitivement. Rien ne le signalerait — le son sortirait, simplement à côté
 * du mixage.
 *
 * **La sortie passe par une voie de console.** Après l'initialisation, on
 * détourne le `destinationGain` de superdough vers une prise obtenue par
 * `brancher()`. Strudel gagne alors gain, panoramique, départ de réverbération,
 * muet et solo — comme les vingt moteurs. C'était le vrai sens de « intégré au
 * rack » : jusqu'ici la page utilisait le bon contexte mais court-circuitait la
 * console, et son volume était le seul du Hub à ne pas répondre.
 *
 * **Les échantillons viennent des deux sources prévues.** La bibliothèque
 * sonore du workspace est injectée sous des clés stables, puis la banque
 * distante officielle de Strudel est chargée par son API `samples`. Si le
 * réseau est absent, les sons locaux et les synthés restent disponibles.
 *
 * **Aucune écriture machine.** Le rack envoie des notes MIDI, qui disparaissent
 * une fois jouées. Il n'écrit ni patch, ni échantillon, ni dossier sur l'OP‑1
 * ou l'EP‑133. Les fichiers qu'il écrit sont des projets, dans un emplacement
 * que l'utilisateur désigne lui-même.
 *
 * ## Chargement à la demande
 *
 * Strudel pèse environ 1,5 Mo, CodeMirror et ses greffons davantage. Les deux
 * sont importés dynamiquement : le Hub ne transporte pas un éditeur de code
 * pour afficher sa page d'accueil.
 */

type Etat = "eteint" | "chargement" | "pret" | "joue";
type EtatSamples = "non-chargés" | "chargement" | "prêts" | "indisponibles";

/** Ce que `@strudel/web` expose, réduit à ce que le rack utilise. */
type ApiStrudel = {
  initStrudel: (options?: Record<string, unknown>) => unknown;
  evaluate: (code: string) => Promise<unknown>;
  hush: () => void;
  setAudioContext?: (ctx: AudioContext) => unknown;
  registerZZFXSounds?: () => unknown;
  registerSound?: (nom: string, declencheur: unknown, donnees?: unknown) => void;
  samples?: (sampleMap: Record<string, string> | string, baseUrl?: string) => Promise<unknown>;
  getSuperdoughAudioController?: () => {
    output?: { destinationGain?: GainNode | null };
  };
};

/** L'ordonnanceur de Strudel, tel que le surlignage l'utilise. */
type Repl = { scheduler?: unknown; setCps?: (v: number) => unknown };

export default function StrudelRack() {
  const [profileName, setProfileName] = useState("NOUVEAU MEMBRE");
  const [code, setCode] = useState(EXEMPLES[0].code);
  const [etat, setEtat] = useState<Etat>("eteint");
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [bpm, setBpm] = useState(transport().bpm);

  const [extraits, setExtraits] = useState<Extrait[]>([]);
  const [nom, setNom] = useState("");

  const [projet, setProjet] = useState<Projet | null>(null);
  const [poigneeFichier, setPoigneeFichier] = useState<FileSystemFileHandle | null>(null);
  const [moyen, setMoyen] = useState<"systeme-de-fichiers" | "telechargement">("telechargement");

  const [machines, setMachines] = useState<Machine[]>([]);
  /** Les moteurs du rack DSP ajoutés à la palette, une fois Strudel démarré. */
  const [moteursRack, setMoteursRack] = useState<string[]>([]);
  /**
   * Un compteur, pas les valeurs.
   *
   * Les reglages des moteurs vivent dans `moteursStrudel`, hors de React :
   * c'est superdough qui construit les voix, en dehors de tout arbre. On
   * redessine donc les cartes en incrementant ce compteur, plutot que de tenir
   * une copie des valeurs qui divergerait de celles qui jouent.
   */
  const [revisionCartes, setRevisionCartes] = useState(0);
  const [etatSamples, setEtatSamples] = useState<EtatSamples>("non-chargés");
  const [nombreSamplesLocaux, setNombreSamplesLocaux] = useState(0);
  const [sampleKeys, setSampleKeys] = useState<string[]>([]);
  const [samplesDistantsCharges, setSamplesDistantsCharges] = useState(false);
  const [canal, setCanal] = useState(1);

  const [voieId, setVoieId] = useState<string | null>(null);
  /**
   * Les effets du bus maitre.
   *
   * Ils ne sont pas a cette page : ils vivent dans `effetsMaitre.ts` et
   * s'appliquent a TOUT ce qui joue dans l'atelier. Ce panneau les pilote,
   * il ne les possede pas — regler un delai ici le garde en passant au rack DSP.
   */
  const [effets, setEffets] = useState<ParamsEffets>(effetsMaitre);
  const [delaiSync, setDelaiSync] = useState(false);
  const [delaiDivision, setDelaiDivision] = useState<Division>("1/8");
  const [gain, setGain] = useState(1);
  const [pano, setPano] = useState(0);
  const [reverb, setReverb] = useState(0);

  const [editeurPret, setEditeurPret] = useState<boolean | null>(null);

  const api = useRef<ApiStrudel | null>(null);
  const repl = useRef<Repl | null>(null);
  const dessinateur = useRef<{ start: (s: unknown) => void; stop: () => void; invalidate: (s?: unknown) => void } | null>(null);
  const poignee = useRef<PoigneeEditeur | null>(null);
  const prise = useRef<Prise | null>(null);
  const positions = useRef<unknown[]>([]);
  const entreeFichier = useRef<HTMLInputElement | null>(null);
  const samplesLocaux = useRef<SampleLibraryResult | null>(null);
  const sampleKeysVifs = useRef<string[]>([]);
  const samplesDistantsVifs = useRef(false);
  /** Le code le plus récent, lisible depuis un rappel sans le recréer. */
  const codeVif = useRef(code);
  codeVif.current = code;

  useEffect(() => sAbonnerEffets(setEffets), []);

  useEffect(() => {
    setProfileName(readProfileName());
    setExtraits(trierExtraits(lireExtraits()));
    setMoyen(moyenDisponible());
      void machinesDisponibles().then(setMachines);
  }, []);

  useEffect(() => {
    return () => {
      samplesLocaux.current?.release();
      samplesLocaux.current = null;
    };
  }, []);

  // Asservir l'horloge de Strudel au transport partagé du Hub.
  useEffect(() => {
    return sAbonnerTransport((t) => {
      setBpm(t.bpm);
      repl.current?.setCps?.(bpmVersCps(t.bpm));
    });
  }, []);

  /**
   * Charge et initialise Strudel une seule fois.
   *
   * L'ordre compte : le contexte du Hub doit être posé AVANT `initStrudel`,
   * sinon Strudel en fabrique un et s'y attache définitivement.
   */
  const demarrer = useCallback(async (): Promise<ApiStrudel | null> => {
    if (api.current) return api.current;
    setEtat("chargement");
    setErreur(null);
    try {
      const mod = (await import("@strudel/web")) as unknown as ApiStrudel;
      mod.setAudioContext?.(contexte());
      const pret = mod.initStrudel({
        /** Les deux banques utilisent le sampler officiel de Strudel. */
        prebake: async () => {
          let localCharge = false;
          let distantCharge = false;
          setEtatSamples("chargement");
          try {
            const workspace = await loadDirectoryHandle(WORKSPACE_HANDLE_KEY);
            if (workspace && (await hasStoredPermission(workspace, "read"))) {
              const local = await chargerSamplesBibliotheque(workspace);
              samplesLocaux.current = local;
              setNombreSamplesLocaux(local.loaded.length);
              const keys = local.loaded.map(({ key }) => key);
              sampleKeysVifs.current = keys;
              setSampleKeys(keys);
              if (Object.keys(local.sampleMap).length && mod.samples) {
                await mod.samples(local.sampleMap);
                localCharge = true;
              }
            }
          } catch {
            // Une permission absente ou un fichier manquant ne doit pas
            // empêcher les synthés Strudel de démarrer.
          }
          try {
            if (mod.samples) {
              await mod.samples("github:tidalcycles/dirt-samples");
              distantCharge = true;
              samplesDistantsVifs.current = true;
              setSamplesDistantsCharges(true);
            }
          } catch {
            // Le sampler local reste utilisable sans réseau.
          }
          setEtatSamples(localCharge || distantCharge ? "prêts" : "indisponibles");
        },
        /**
         * Relevé à chaque évaluation : les positions des fragments de
         * mini-notation dans le document. C'est ce qui permet de les
         * illuminer quand ils sonnent.
         */
        afterEval: (options: { meta?: { miniLocations?: unknown[] } }) => {
          positions.current = options?.meta?.miniLocations ?? [];
          poignee.current?.poserPositions(positions.current);
          if (repl.current?.scheduler) dessinateur.current?.invalidate(repl.current.scheduler);
        },
      });
      api.current = mod;

      /**
       * Les sons ZZFX ne sont pas enregistrés par défaut : `@strudel/web`
       * n'appelle que `registerSynthSounds`. Ce sont des générateurs, pas des
       * téléchargements — rien ne sort du navigateur en les ajoutant, et ils
       * élargissent nettement la palette hors ligne.
       */
      try {
        mod.registerZZFXSounds?.();
      } catch {
        /* la palette de base suffit si l'enregistrement échoue */
      }

      /**
       * Les vingt moteurs du rack DSP, ajoutés à la palette de Strudel.
       *
       * `note("c e g").sound("mi_plaits")` joue désormais le moteur du rack.
       * C'était le manque explicite de la feuille de route : « déclencher les
       * moteurs DSP internes depuis un motif » n'existait pas.
       *
       * Ce sont les mêmes oscillateurs que dans le rack — l'échantillonnage
       * est géré séparément par le sampler Strudel ci-dessus.
       */
      if (typeof mod.registerSound === "function") {
        const ajoutes = enregistrerMoteurs(
          mod as unknown as ApiEnregistrement,
          () => contexte(),
          () => reverbePartagee(),
        );
        setMoteursRack(ajoutes);
      }

      // `initStrudel` rend une promesse résolue sur le repl.
      repl.current = (await Promise.resolve(pret as Promise<Repl>)) ?? null;
      repl.current?.setCps?.(bpmVersCps(transport().bpm));

      brancherSurLaConsole(mod);
      // Les reglages relus du stockage n'ont encore rien insere, faute de
      // graphe ou le faire : le contexte vient d'ouvrir.
      reappliquerEffetsMaitre();
      await preparerSurlignage();

      setEtat("pret");
      return mod;
    } catch (e) {
      setEtat("eteint");
      setErreur(
        `Strudel n'a pas pu démarrer : ${e instanceof Error ? e.message : String(e)}`,
      );
      return null;
    }
    // Les deux fonctions ci-dessous sont stables : définies hors du rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Détourne la sortie de Strudel vers une voie de la console.
   *
   * superdough câble `channelMerger → destinationGain → ctx.destination`. Il
   * n'expose aucune API pour changer cette destination : on prend donc le
   * `destinationGain`, on le débranche, et on le rebranche sur la prise.
   *
   * Fait après `initStrudel`, jamais avant : le contrôleur n'existe pas tant
   * que le moteur n'a pas démarré.
   *
   * Si la structure interne de superdough change, on le voit ici et le rack
   * continue de sonner — en direct, hors console. Un échec silencieux qui
   * couperait le son serait pire qu'un mixage inopérant.
   */
  const brancherSurLaConsole = useCallback((mod: ApiStrudel) => {
    try {
      const sortie = mod.getSuperdoughAudioController?.().output?.destinationGain;
      if (!sortie) {
        setMessage(
          "Sortie branchée en direct : la console du rack ne pilotera pas ce volume.",
        );
        return;
      }
      const avant = new Set(voies().map((v) => v.id));
      const p = brancher("Strudel");
      prise.current = p;
      const nouvelle = voies().find((v) => !avant.has(v.id));
      setVoieId(nouvelle?.id ?? null);

      sortie.disconnect();
      sortie.connect(p.entree);
    } catch (e) {
      setMessage(
        `Sortie branchée en direct (${e instanceof Error ? e.message : String(e)}).`,
      );
    }
  }, []);

  /** Démarre la boucle qui illumine les événements pendant la lecture. */
  const preparerSurlignage = useCallback(async () => {
    if (dessinateur.current) return;
    try {
      const { Drawer } = await import("@strudel/draw");
      const d = new Drawer((haps: unknown[], temps: number) => {
        poignee.current?.surligner(temps, haps);
      }, [0, 0]);
      dessinateur.current = d as unknown as typeof dessinateur.current;
    } catch {
      // Le surlignage est du confort : son absence ne doit pas empêcher de
      // jouer, et l'annoncer comme une panne serait disproportionné.
    }
  }, []);

  const jouer = useCallback(async () => {
    const mod = await demarrer();
    if (!mod) return;
    setErreur(null);
    try {
      await mod.evaluate(codeVif.current);
      setEtat("joue");
      poignee.current?.clignoter();
      if (repl.current?.scheduler) dessinateur.current?.start(repl.current.scheduler);
      const absents = sonsManquants(codeVif.current, {
        samplesDistants: samplesDistantsVifs.current,
        samplesLocaux: sampleKeysVifs.current,
      });
      setMessage(
        absents.length
          ? `En cours. Sons introuvables hors ligne : ${absents.join(", ")}.`
          : "En cours. « Stop » coupe tout.",
      );
    } catch (e) {
      // Une erreur de syntaxe est le cas NORMAL d'un éditeur de code : on la
      // montre telle quelle, sans arrêter ce qui jouait déjà.
      setErreur(e instanceof Error ? e.message : String(e));
    }
  }, [demarrer, sampleKeys, samplesDistantsCharges]);

  /**
   * Le PANIC du rack.
   *
   * Coupe les deux chemins : `hush()` pour l'audio de Strudel, et les paquets
   * « all notes off » pour les machines. Le premier ignore ce qui est parti en
   * MIDI, le second ne connaît pas l'audio — il faut les deux.
   */
  const arreter = useCallback(() => {
    api.current?.hush();
    dessinateur.current?.stop();
    poignee.current?.surligner(0, []);
    setEtat(api.current ? "pret" : "eteint");
    setMessage("Arrêté.");
    void panicMachines();
  }, []);

  // Tout couper en quittant la page : sans cela, le motif continuerait de
  // jouer par-dessus l'écran suivant.
  useEffect(() => () => api.current?.hush(), []);

  /**
   * Débrancher la voie et couper les machines au démontage.
   *
   * Séparé du `hush` ci-dessus par volonté : chaque effet a une seule
   * responsabilité, et celui-ci touche à des ressources — une voie de console,
   * des ports MIDI — que le premier ne connaît pas.
   */
  useEffect(() => {
    return () => {
      dessinateur.current?.stop();
      prise.current?.detacher();
      prise.current = null;
      void panicMachines();
    };
  }, []);

  /* --- Extraits (brouillons locaux) ------------------------------------- */

  const enregistrer = useCallback(() => {
    const liste = trierExtraits(enregistrerExtrait(nom, code, extraits));
    setExtraits(liste);
    setMessage(
      ecrireExtraits(liste)
        ? `« ${liste.find((e) => e.code === code)?.nom ?? nom} » gardé dans ce navigateur.`
        : "Le navigateur a refusé d'écrire — extrait gardé pour cette session seulement.",
    );
    setNom("");
  }, [code, extraits, nom]);

  const oublier = useCallback((id: string) => {
    const liste = supprimerExtrait(id, extraits);
    setExtraits(liste);
    ecrireExtraits(liste);
    setMessage("Extrait retiré.");
  }, [extraits]);

  /* --- Projets (fichiers) ----------------------------------------------- */

  const chargerCode = useCallback((nouveau: string) => {
    setCode(nouveau);
    poignee.current?.remplacer(nouveau);
  }, []);

  const sauver = useCallback(async () => {
    const p = nouveauProjet(projet?.nom ?? nom ?? "Sans titre", codeVif.current, bpm);
    const r = await enregistrerProjet(p, poigneeFichier);
    if (!r.ok) {
      if (!r.annule) setErreur(r.erreur ?? "L'enregistrement a échoué.");
      return;
    }
    setProjet({ ...p, code: codeVif.current });
    setPoigneeFichier(r.poignee);
    setMessage(
      r.poignee
        ? `Enregistré dans « ${r.nomFichier} ».`
        : `« ${r.nomFichier} » envoyé dans les téléchargements — ce navigateur ne peut pas réécrire le fichier sur place.`,
    );
  }, [bpm, nom, poigneeFichier, projet]);

  const ouvrir = useCallback(async () => {
    if (moyen !== "systeme-de-fichiers") {
      entreeFichier.current?.click();
      return;
    }
    const r = await ouvrirProjet();
    if (!r.ok) {
      if (!r.annule) setErreur(r.erreur ?? "L'ouverture a échoué.");
      return;
    }
    chargerCode(r.projet.code);
    setProjet(r.projet);
    setPoigneeFichier(r.poignee);
    if (r.projet.bpm >= BPM_MIN && r.projet.bpm <= BPM_MAX) reglerBpm(r.projet.bpm);
    setMessage(
      r.brut
        ? `Code importé sous « ${r.projet.nom} ». Enregistre-le pour en faire un projet.`
        : `« ${r.projet.nom} » ouvert.`,
    );
  }, [chargerCode, moyen]);

  const surFichierChoisi = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      // Vider la valeur permet de rouvrir le MÊME fichier deux fois de suite :
      // sans cela, l'évènement `change` ne se déclenche pas la seconde fois.
      e.target.value = "";
      if (!f) return;
      const r = await lireFichier(f);
      if (!r.ok) {
        setErreur(r.erreur ?? "Fichier illisible.");
        return;
      }
      chargerCode(r.projet.code);
      setProjet(r.projet);
      setPoigneeFichier(null);
      if (r.projet.bpm >= BPM_MIN && r.projet.bpm <= BPM_MAX) reglerBpm(r.projet.bpm);
      setMessage(`« ${r.projet.nom} » ouvert.`);
    },
    [chargerCode],
  );

  /* --- Machines ---------------------------------------------------------- */

  const brancherMachine = useCallback(
    (m: Machine) => {
      chargerCode(ajouterSortie(codeVif.current, m, canal));
      setMessage(
        `Motif routé vers ${m.etiquette}, canal ${canal}. La machine joue ses propres sons.`,
      );
    },
    [canal, chargerCode],
  );

  const debrancherMachines = useCallback(() => {
    chargerCode(retirerSorties(codeVif.current));
    void panicMachines();
    setMessage("Routage MIDI retiré.");
  }, [chargerCode]);

  /* --- Console ----------------------------------------------------------- */

  useEffect(() => { if (voieId) reglerGain(voieId, gain); }, [gain, voieId]);
  useEffect(() => { if (voieId) reglerPanoramique(voieId, pano); }, [pano, voieId]);
  useEffect(() => { if (voieId) reglerDepart(voieId, reverb); }, [reverb, voieId]);

  /* --- Clavier ----------------------------------------------------------- */

  /**
   * Les raccourcis de page.
   *
   * `Ctrl+Entrée` et `Ctrl+.` sont câblés DANS CodeMirror, qui les consomme
   * avant d'arriver ici. On ne traite donc que ce qui doit marcher même quand
   * le focus est ailleurs — un clic dans le panneau latéral ne doit pas
   * priver de l'arrêt d'urgence.
   */
  const surTouche = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") { e.preventDefault(); arreter(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void jouer(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void sauver(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") { e.preventDefault(); void ouvrir(); }
    },
    [arreter, jouer, ouvrir, sauver],
  );

  const absents = useMemo(() => sonsManquants(code, {
    samplesDistants: samplesDistantsCharges,
    samplesLocaux: sampleKeys,
  }), [code, sampleKeys, samplesDistantsCharges]);
  const enAttente = modifie(projet, code);
  const titreProjet = projet?.nom ?? "Sans titre";

  return (
    <AppShell activePage="strudel-rack" profileName={profileName} className="strudel-console">
      {/* Pas de titre ni de paragraphe d'accueil : la page est un instrument,
          pas une brochure. Ce qu'elle fait se lit dans sa barre d'outils. */}
      <div className="sr-plan" onKeyDown={surTouche}>
        <header className="sr-barre">
          <div className="sr-groupe sr-groupe--transport">
            <span className={`sr-diode sr-diode--${etat}`} aria-hidden="true" />
            <span className="sr-etat" role="status">
              {etat === "joue" ? "EN LECTURE" : etat === "chargement" ? "CHARGEMENT" : etat === "pret" ? "PRÊT" : "ÉTEINT"}
            </span>
            <button
              type="button"
              className="sr-bouton sr-bouton--jouer"
              onClick={() => void jouer()}
              disabled={etat === "chargement"}
            >
              ▶ JOUER
            </button>
            {/* Jamais désactivé : c'est l'arrêt d'urgence du rack, il doit
                répondre y compris pendant le chargement. */}
            <button type="button" className="sr-bouton sr-bouton--stop" onClick={arreter}>
              ■ STOP
            </button>
          </div>

          <label className="sr-groupe sr-tempo" title="Tempo asservi au transport partagé du Hub">
            <span>BPM</span>
            <input
              type="number"
              min={BPM_MIN}
              max={BPM_MAX}
              value={bpm}
              onChange={(e) => {
                const v = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(v)) reglerBpm(v);
              }}
              aria-label="Tempo BPM asservi au Hub"
            />
          </label>

          <div className="sr-groupe sr-fichier">
            <span className="sr-projet" title={titreProjet}>
              {titreProjet}
              {enAttente && <b className="sr-modifie" aria-label="modifications non enregistrées">●</b>}
            </span>
            <button type="button" className="sr-bouton" onClick={() => void ouvrir()}>OUVRIR</button>
            <button type="button" className="sr-bouton" onClick={() => void sauver()}>ENREGISTRER</button>
            <input
              ref={entreeFichier}
              type="file"
              accept=".json,.js,.mjs,.txt"
              className="sr-fichier-cache"
              onChange={(e) => void surFichierChoisi(e)}
              aria-label="Ouvrir un projet Strudel"
            />
          </div>

          <span className="sr-barre-aide">CODE À GAUCHE · OUTILS TOUJOURS VISIBLES À DROITE</span>
        </header>

        <div className="sr-corps">
          <section className="sr-editeur" aria-label="Éditeur Strudel">
            <EditeurStrudel
              codeInitial={code}
              surChangement={setCode}
              surEvaluer={() => void jouer()}
              surArret={arreter}
              surPret={(p) => {
                poignee.current = p;
                setEditeurPret(p !== null);
                if (p && positions.current.length) p.poserPositions(positions.current);
              }}
            />
            {editeurPret === false && (
              <textarea
                className="sr-repli"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                aria-label="Code Strudel (éditeur de repli)"
              />
            )}
          </section>

          <aside className="sr-panneau" aria-label="Exemples et outils Strudel">
            <section className="sr-outil sr-outil--signal" aria-labelledby="sr-signal-titre">
              <div className="sr-outil-entete">
                <h2 id="sr-signal-titre" className="sr-titre">Signal du Hub</h2>
                <span className="sr-outil-etat">{etat === "joue" ? "EN DIRECT" : "EN ATTENTE"}</span>
              </div>
              {/* Le tracé de la sortie générale du rack, pas seulement de
                  Strudel : c'est l'analyseur du bus maître qu'il lit. */}
              <OscilloscopePixel actif={etat === "joue"} hauteur={88} />
              <p className="sr-aide sr-aide--court">
                Le signal de Strudel passe par le même bus audio que les moteurs DSP.
              </p>
            </section>

            <section className="sr-outil sr-outil--exemples" aria-labelledby="sr-exemples-titre">
              <PanneauExemples
                extraits={extraits}
                nom={nom}
                setNom={setNom}
                onCharger={chargerCode}
                onEnregistrer={enregistrer}
                onOublier={oublier}
              />
            </section>

            <section className="sr-outil" aria-label="Sons disponibles">
              <PanneauSons
                moteurs={moteursRack}
                etatSamples={etatSamples}
                nombreSamplesLocaux={nombreSamplesLocaux}
                samplesDistantsCharges={samplesDistantsCharges}
              />
            </section>

            <section className="sr-outil" aria-label="Réglages des moteurs">
              <PanneauMoteurs
                code={code}
                revision={revisionCartes}
                surReglage={(moteur, nom, valeur) => {
                  reglerMoteur(moteur, nom, valeur);
                  setRevisionCartes((n) => n + 1);
                }}
              />
            </section>

            <section className="sr-outil" aria-label="Machines MIDI">
              <PanneauMachines
                machines={machines}
                canal={canal}
                setCanal={setCanal}
                route={routeVersMachine(code)}
                onBrancher={brancherMachine}
                onDebrancher={debrancherMachines}
                onRafraichir={() => void machinesDisponibles().then(setMachines)}
              />
            </section>

            <section className="sr-outil" aria-label="Mixage">
              <PanneauMixage
                voieId={voieId}
                gain={gain} setGain={setGain}
                pano={pano} setPano={setPano}
                reverb={reverb} setReverb={setReverb}
              />
            </section>

            <section className="sr-outil" aria-labelledby="sr-effets-titre">
              <h2 id="sr-effets-titre" className="sr-titre">Effets du studio</h2>
              <p className="sr-aide">
                Sur le bus maître : tout ce qui joue dans l'atelier les traverse,
                Strudel comme les vingt moteurs. Les réglages suivent d'une page
                à l'autre et survivent au rechargement.
              </p>
              <RackEffets
                params={effets}
                onParam={(nom, valeur) => reglerEffetsMaitre({ [nom]: valeur })}
                delaySync={delaiSync}
                onDelaySync={setDelaiSync}
                delayDivision={delaiDivision}
                onDelayDivision={setDelaiDivision}
                bpmHote={bpm}
              />
            </section>

            <section className="sr-outil" aria-label="Aide Strudel">
              <PanneauAide />
            </section>
          </aside>
        </div>

        <footer className="sr-pied">
          {erreur ? (
            <p className="sr-erreur" role="alert">{erreur}</p>
          ) : (
            <p className="sr-message" role="status">{message ?? "Ctrl+Entrée pour jouer · Ctrl+. ou Échap pour tout couper"}</p>
          )}
          {absents.length > 0 && (
            <p className="sr-avertissement">
              Hors ligne, {absents.length > 1 ? "ces sons n'existent pas" : "ce son n'existe pas"} ici :{" "}
              <b>{absents.join(", ")}</b>
              {absents.some((a) => SONS_DISTANTS_CONNUS.includes(a)) &&
                " — ce sont des échantillons du Strudel officiel, hébergés en ligne. Le panneau Machines permet de jouer une vraie boîte à rythmes."}
            </p>
          )}
          {moyen === "telechargement" && (
            <p className="sr-note">
              Contexte non sécurisé : « Enregistrer » télécharge un fichier au lieu de
              réécrire celui qui est ouvert. Passe par localhost pour l'écriture en place.
            </p>
          )}
        </footer>
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------------ *
 * Les panneaux.
 *
 * Extraits en composants pour que la page reste lisible : le rack en compte
 * cinq, et les garder en ligne aurait donné un rendu de trois cents lignes où
 * l'on ne retrouve plus rien.
 * ------------------------------------------------------------------------ */

function PanneauExemples({
  extraits, nom, setNom, onCharger, onEnregistrer, onOublier,
}: {
  extraits: Extrait[];
  nom: string;
  setNom: (v: string) => void;
  onCharger: (code: string) => void;
  onEnregistrer: () => void;
  onOublier: (id: string) => void;
}) {
  return (
    <>
      <h2 id="sr-exemples-titre" className="sr-titre">Exemples</h2>
      <ul className="sr-liste">
        {EXEMPLES.map((e) => (
          <li key={e.nom}>
            <button type="button" onClick={() => onCharger(e.code)}>{e.nom}</button>
            <small>{e.aide}</small>
          </li>
        ))}
      </ul>

      <h2 className="sr-titre">Brouillons</h2>
      <p className="sr-aide">
        Gardés dans ce navigateur. Pour un fichier qu'on peut envoyer ou versionner,
        utilise ENREGISTRER.
      </p>
      <div className="sr-ajout">
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom du brouillon"
          aria-label="Nom du brouillon"
        />
        <button type="button" className="sr-bouton" onClick={onEnregistrer}>GARDER</button>
      </div>
      {extraits.length === 0 ? (
        <p className="sr-vide">Aucun brouillon.</p>
      ) : (
        <ul className="sr-liste">
          {extraits.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => onCharger(e.code)}>{e.nom}</button>
              <button
                type="button"
                className="sr-retirer"
                onClick={() => onOublier(e.id)}
                aria-label={`Retirer ${e.nom}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function PanneauSons({
  moteurs,
  etatSamples,
  nombreSamplesLocaux,
  samplesDistantsCharges,
}: {
  moteurs: string[];
  etatSamples: EtatSamples;
  nombreSamplesLocaux: number;
  samplesDistantsCharges: boolean;
}) {
  return (
    <>
      <h2 className="sr-titre">Sons & banques</h2>
      <p className="sr-aide">
        Synthés du moteur, samples de la Bibliothèque sonore et banque officielle
        Strudel utilisent le même sampler et la même sortie du Hub.
      </p>
      <p className="sr-note" role="status">
        Bibliothèque locale : {etatSamples === "chargement" ? "chargement…" : `${nombreSamplesLocaux} sample(s)`}
        {samplesDistantsCharges ? " · banque distante prête" : " · banque distante indisponible"}
      </p>
      {(["forme d'onde", "bruit", "percussion", "expérimental"] as const).map((famille) => {
        const liste = SONS_LOCAUX.filter((s) => s.famille === famille);
        if (!liste.length) return null;
        return (
          <div key={famille} className="sr-famille">
            <h3 className="sr-sous-titre">{famille}</h3>
            <ul className="sr-liste sr-liste--sons">
              {liste.map((s) => (
                <li key={s.nom}>
                  <code>{s.nom}</code>
                  <small>{s.aide}</small>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <div className="sr-famille">
        <h3 className="sr-sous-titre">zzfx</h3>
        <p className="sr-aide">{SONS_ZZFX.join(" · ")}</p>
      </div>
      <div className="sr-famille">
        <h3 className="sr-sous-titre">moteurs du rack</h3>
        <p className="sr-aide">
          Les vingt moteurs DSP, ajoutés à la palette au démarrage. Mêmes
          oscillateurs que dans le rack, rien n'est téléchargé.
          {moteurs.length === 0 && " Lance la lecture une fois pour les charger."}
        </p>
        <p className="sr-aide">{(moteurs.length ? moteurs : MOTEURS_JOUABLES).join(" · ")}</p>
      </div>
      <div className="sr-famille">
        <h3 className="sr-sous-titre">raccourcis</h3>
        <p className="sr-aide">
          {ALIAS_SONS.map((a) => `${a.alias} = ${a.vers}`).join(" · ")}
        </p>
      </div>
    </>
  );
}

/**
 * Les cartes des moteurs appeles par le motif.
 *
 * On n'affiche QUE ceux que le code utilise. Empiler vingt cartes ferait une
 * colonne de deux mille pixels ou l'on ne trouve rien ; en montrer zero
 * obligerait a choisir dans une liste ce que le motif dit deja.
 */
function PanneauMoteurs({
  code,
  revision,
  surReglage,
}: {
  code: string;
  revision: number;
  surReglage: (moteur: string, nom: string, valeur: number | string) => void;
}) {
  const appeles = useMemo(() => {
    const vus: string[] = [];
    for (const m of code.matchAll(/(?:\.sound|\bs)\(\s*["\'`]([^"\'`]*)["\'`]/g)) {
      for (const brut of m[1].split(/[\s,<>[\]()*!@?~|.]+/)) {
        const nom = brut.replace(/:\d+$/, "").trim();
        if (MOTEURS_JOUABLES.includes(nom as never) && !vus.includes(nom)) vus.push(nom);
      }
    }
    return vus;
  }, [code]);

  if (appeles.length === 0) {
    return (
      <>
        <h2 className="sr-titre">Moteurs du rack</h2>
        <p className="sr-aide">
          Aucun moteur du rack dans ce motif. Écris <code>.sound("mi_plaits")</code>
          {" "}— ou n'importe lequel de la liste Sons — et sa carte de réglages
          apparaîtra ici.
        </p>
      </>
    );
  }

  return (
    <>
      <h2 className="sr-titre">Moteurs du rack</h2>
      <p className="sr-aide">
        Les cartes des moteurs appelés par ce motif. Les réglages valent pour les
        notes suivantes ; ce que le code dit — <code>.cutoff(900)</code> — reste
        prioritaire sur le curseur.
      </p>
      {appeles.map((moteur) => (
        <CarteMoteur
          // La revision force le redessin : les valeurs vivent hors de React.
          key={`${moteur}-${revision}`}
          moteur={moteur}
          compacte
          valeurs={reglagesMoteur(moteur)}
          surReglage={(nom, valeur) => surReglage(moteur, nom, valeur)}
        />
      ))}
    </>
  );
}

function PanneauAide() {
  return (
    <>
      <h2 className="sr-titre">Raccourcis</h2>
      <ul className="sr-liste sr-liste--touches">
        {RACCOURCIS.map((r) => (
          <li key={r.touches}><kbd>{r.touches}</kbd><small>{r.effet}</small></li>
        ))}
      </ul>
      {SECTIONS_DOC.map((s) => (
        <details key={s.id} className="sr-section">
          <summary>{s.titre}</summary>
          <p className="sr-aide">{s.intro}</p>
          <ul className="sr-liste sr-liste--doc">
            {s.entrees.map((e) => (
              <li key={e.syntaxe}>
                <code>{e.syntaxe}</code>
                <small>{e.effet}</small>
                {e.exemple && <pre>{e.exemple}</pre>}
              </li>
            ))}
          </ul>
        </details>
      ))}
      <p className="sr-note">{LIMITE_DOC}</p>
    </>
  );
}

function PanneauMachines({
  machines, canal, setCanal, route, onBrancher, onDebrancher, onRafraichir,
}: {
  machines: Machine[];
  canal: number;
  setCanal: (v: number) => void;
  route: boolean;
  onBrancher: (m: Machine) => void;
  onDebrancher: () => void;
  onRafraichir: () => void;
}) {
  return (
    <>
      <h2 className="sr-titre">Machines</h2>
      <p className="sr-aide">
        Le motif part en MIDI, la machine joue ses propres sons. Rien n'est écrit
        dans sa mémoire : une note jouée ne laisse aucune trace.
      </p>
      <label className="sr-ajout">
        <span>CANAL</span>
        <input
          type="number" min={1} max={16} value={canal}
          onChange={(e) => {
            const v = Number.parseInt(e.target.value, 10);
            if (!Number.isNaN(v)) setCanal(Math.min(16, Math.max(1, v)));
          }}
          aria-label="Canal MIDI"
        />
      </label>
      {machines.length === 0 ? (
        <>
          <p className="sr-vide">Aucune sortie MIDI détectée.</p>
          <button type="button" className="sr-bouton" onClick={onRafraichir}>RECHERCHER</button>
        </>
      ) : (
        <ul className="sr-liste">
          {machines.map((m) => (
            <li key={m.nom}>
              <button type="button" onClick={() => onBrancher(m)}>
                {m.etiquette}
                {m.connue && <em className="sr-connue"> ({m.connue === "op1" ? "OP-1" : "EP-133"})</em>}
              </button>
              <small>{m.nom}</small>
            </li>
          ))}
        </ul>
      )}
      {route && (
        <button type="button" className="sr-bouton sr-bouton--stop" onClick={onDebrancher}>
          RETIRER LE ROUTAGE
        </button>
      )}
    </>
  );
}

function PanneauMixage({
  voieId, gain, setGain, pano, setPano, reverb, setReverb,
}: {
  voieId: string | null;
  gain: number; setGain: (v: number) => void;
  pano: number; setPano: (v: number) => void;
  reverb: number; setReverb: (v: number) => void;
}) {
  if (!voieId) {
    return (
      <>
        <h2 className="sr-titre">Console</h2>
        <p className="sr-vide">
          La voie n'est pas ouverte. Lance la lecture une fois : le rack branche
          Strudel sur la console au premier démarrage du moteur.
        </p>
      </>
    );
  }
  return (
    <>
      <h2 className="sr-titre">Console</h2>
      <p className="sr-aide">
        Strudel occupe une voie du fond de panier, comme les moteurs du rack DSP.
        Ces réglages sont ceux de la console, pas ceux du motif.
      </p>
      <Curseur nom="VOLUME" valeur={gain} min={0} max={2} pas={0.01} sur={setGain} />
      <Curseur nom="PANORAMIQUE" valeur={pano} min={-1} max={1} pas={0.01} sur={setPano} />
      <Curseur nom="RÉVERB" valeur={reverb} min={0} max={1} pas={0.01} sur={setReverb} />
      <p className="sr-note">Voie « Strudel » · {voieId}</p>
    </>
  );
}

function Curseur({
  nom, valeur, min, max, pas, sur,
}: {
  nom: string; valeur: number; min: number; max: number; pas: number;
  sur: (v: number) => void;
}) {
  return (
    <label className="sr-curseur">
      <span>{nom}</span>
      <input
        type="range" min={min} max={max} step={pas} value={valeur}
        onChange={(e) => sur(Number.parseFloat(e.target.value))}
        aria-label={nom}
      />
      <b>{valeur.toFixed(2)}</b>
    </label>
  );
}
