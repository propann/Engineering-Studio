"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { brancher, contexte, type Prise } from "@studio-hub/rack-bus";
import { readProfileName } from "../core/profile";
import { AppShell } from "../ui";
import { CarteMoteur } from "../components/CarteMoteur";
import { CATALOGUE, nomDe } from "../core/audio/catalogueParams";
import { construireMoteur } from "../core/audio/moteurs";
import {
  ajouterCouche,
  ajouterEchantillon,
  analyserSon,
  bornesSaines,
  cheminDe,
  couchesAudibles,
  deplacerCouche,
  dossierDe,
  FAMILLES,
  modifierCouche,
  nomFichierSon,
  nouveauSon,
  paramsDeCouche,
  retirerCouche,
  encoderEchantillons,
  serialiserSon,
  type Couche,
  type SonFabrique,
} from "../core/audio/couches";
import {
  crete,
  cretes,
  frequenceDeNoteMidi,
  normaliser,
  poserEchantillon,
  rendreSon,
  type RenduSon,
} from "../core/audio/rendreCouches";
import { ecrireFichier, moyenDisponible } from "../core/strudel/projets";
import { encodeAiffPcm16, encodeWavPcm16 } from "@studio-hub/audio-formats";
import { encodeOp1PatchAiff } from "@studio-hub/audio-formats";
import { metadonneesOp1 } from "../core/audio/patchOp1";
import { dureeAdmise, SPECS_CIBLES, type CibleMachine } from "@studio-hub/audio-formats";
import { reappliquerEffetsMaitre } from "../core/audio/effetsMaitre";
import { espaceDeTravail, rangerEchantillon, rangerSon } from "../core/audio/rangerSon";
import { prendreSonEnAttente } from "../core/audio/sonEnAttente";
import {
  annuler,
  empiler,
  historiqueVide,
  peutAnnuler,
  peutRefaire,
  refaire,
  type Historique,
} from "../core/audio/historique";
import "./atelier-son.css";

/**
 * L'atelier de création de son.
 *
 * ## Ce qu'il fait
 *
 * On empile des moteurs, on règle chacun, on voit l'onde de chaque couche dans
 * sa couleur, et on enregistre. Le rangement est automatique : le son part
 * dans `nappes/`, `basses/` ou `rythmes/` selon ce qu'il est.
 *
 * ## Ce qu'il n'invente pas
 *
 * Tout vient d'ailleurs. Les moteurs sont ceux du rack, les cartes de réglages
 * celles du catalogue, les effets ceux du bus maître, la sortie une voie de la
 * console. L'atelier n'est qu'un assemblage — c'est pour ça qu'il tient en une
 * page, alors que le rack en fait quatre mille.
 *
 * ## L'onde est un rendu, pas une écoute
 *
 * Elle est calculée hors ligne, à chaque changement, en quelques dizaines de
 * millisecondes. Un analyseur branché sur la sortie ne montrerait que ce qui
 * passe MAINTENANT : on ne verrait rien tant qu'on n'appuie pas, et rien de la
 * couche qu'on règle si une autre couvre tout.
 */

/** Attente avant de relancer le rendu, en millisecondes. */
const ATTENTE_RENDU = 220;

export default function AtelierSon() {
  const [profileName, setProfileName] = useState("NOUVEAU MEMBRE");
  const [son, setSon] = useState<SonFabrique>(() => nouveauSon("Sans titre"));
  const [selection, setSelection] = useState<string | null>(null);
  const [rendu, setRendu] = useState<RenduSon | null>(null);
  const [calcule, setCalcule] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [poignee, setPoignee] = useState<FileSystemFileHandle | null>(null);
  const [moteurAAjouter, setMoteurAAjouter] = useState<string>("mi_plaits");
  const [cible, setCible] = useState<CibleMachine>("op1_synth");
  const [balise, setBalise] = useState("");

  const prise = useRef<Prise | null>(null);
  const entree = useRef<HTMLInputElement | null>(null);
  const audio = useRef<HTMLInputElement | null>(null);
  const sonVif = useRef(son);
  sonVif.current = son;

  useEffect(() => setProfileName(readProfileName()), []);

  /**
   * Adopte le son qu'une autre page a depose, s'il y en a un.
   *
   * La Bibliotheque sonore s'en sert pour rouvrir un `.son.json` ici. Le depot
   * se VIDE a la prise : sans cela, revenir a l'atelier rouvrirait le meme son
   * et ecraserait le travail en cours.
   */
  useEffect(() => {
    const attente = prendreSonEnAttente();
    if (!attente) return;
    setSon(attente.son);
    setSelection(attente.son.couches[0]?.id ?? null);
    setMessage(`« ${attente.son.nom} » ouvert depuis ${attente.provenance}.`);
  }, []);

  /**
   * L'espace de travail est-il connecte ?
   *
   * Affiche a cote du dossier de rangement : sans cette indication, on ne sait
   * qu'apres avoir clique si le son sera range tout seul ou s'il faudra
   * naviguer. La difference compte quand on en fabrique dix.
   */
  const [espaceConnecte, setEspaceConnecte] = useState(false);
  const [histoire, setHistoire] = useState<Historique>(historiqueVide);
  useEffect(() => {
    void espaceDeTravail().then((e) => setEspaceConnecte(e !== null));
  }, []);

  useEffect(() => {
    return () => {
      prise.current?.detacher();
      prise.current = null;
    };
  }, []);

  /**
   * Modifie le son EN GARDANT de quoi revenir.
   *
   * `geste` nomme ce qu'on fait — « gain:abc », « ajout », « retrait ». Deux
   * appels de suite avec le meme nom, rapproches, ne font qu'un pas :
   * c'est ainsi qu'annuler apres avoir tire un curseur revient AVANT le geste
   * et non au pixel precedent.
   *
   * Les chargements — ouvrir un fichier, prendre un son depose — passent
   * volontairement par `setSon` directement : ils remplacent tout, et pouvoir
   * les annuler ferait revenir a un etat que l'utilisateur a explicitement
   * quitte.
   */
  const modifier = useCallback(
    (geste: string, transformer: (s: SonFabrique) => SonFabrique) => {
      setSon((avant) => {
        const apres = transformer(avant);
        if (apres === avant) return avant;
        setHistoire((h) => empiler(h, avant, geste));
        return apres;
      });
    },
    [],
  );

  const annulerUnPas = useCallback(() => {
    setSon((courant) => {
      const r = annuler(histoire, courant);
      if (!r) return courant;
      setHistoire(r.historique);
      setSelection((sel) => (r.son.couches.some((c) => c.id === sel) ? sel : r.son.couches[0]?.id ?? null));
      return r.son;
    });
  }, [histoire]);

  const refaireUnPas = useCallback(() => {
    setSon((courant) => {
      const r = refaire(histoire, courant);
      if (!r) return courant;
      setHistoire(r.historique);
      setSelection((sel) => (r.son.couches.some((c) => c.id === sel) ? sel : r.son.couches[0]?.id ?? null));
      return r.son;
    });
  }, [histoire]);

  /* --- L'onde ------------------------------------------------------------ */

  /**
   * Le rendu suit les changements, avec un délai.
   *
   * Sans lui, tirer un curseur relancerait un rendu par pixel parcouru —
   * quelques dizaines par seconde, chacun construisant tout le graphe. Le
   * délai laisse le geste se terminer.
   */
  useEffect(() => {
    if (son.couches.length === 0) {
      setRendu(null);
      return;
    }
    setCalcule(true);
    let annule = false;
    const minuteur = setTimeout(() => {
      void rendreSon(son, 2)
        .then((r) => {
          if (annule) return;
          setRendu(r);
          setCalcule(false);
        })
        .catch(() => {
          if (!annule) setCalcule(false);
        });
    }, ATTENTE_RENDU);
    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
  }, [son]);

  /* --- L'écoute ---------------------------------------------------------- */

  const ecouter = useCallback(() => {
    try {
      const ctx = contexte();
      if (ctx.state === "suspended") void ctx.resume();
      if (!prise.current) prise.current = brancher("Atelier de son");
      reappliquerEffetsMaitre();

      const now = ctx.currentTime;
      const freq = frequenceDeNoteMidi(sonVif.current.note);
      for (const couche of couchesAudibles(sonVif.current)) {
        const sortie = ctx.createGain();
        // Enveloppe minimale : sans elle, chaque écoute commence et finit par
        // un clic, et l'on croirait à un défaut du moteur.
        sortie.gain.setValueAtTime(0.0001, now);
        sortie.gain.exponentialRampToValueAtTime(couche.gain, now + 0.005);
        sortie.gain.exponentialRampToValueAtTime(0.0001, now + 2);
        sortie.connect(prise.current.entree);

        // Un echantillon se pose, il ne se construit pas : meme code que le
        // rendu hors ligne, pour que l'ecoute et l'onde soient d'accord.
        if (couche.type === "echantillon") {
          poserEchantillon(ctx, couche, sortie, now);
          continue;
        }

        construireMoteur(
          ctx,
          paramsDeCouche(couche),
          freq,
          now,
          {
            trk: (n) => n,
            noteStop: (n, quand) => {
              try {
                n.stop(quand);
              } catch {
                /* deja arretee */
              }
            },
            holdUntil: () => {},
            reverb: null,
          },
          sortie,
        );
      }
      setErreur(null);
    } catch (e) {
      setErreur(`L'écoute a échoué : ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);

  /* --- Les couches -------------------------------------------------------- */

  const ajouter = useCallback(
    (moteur: string) => {
      modifier("ajout", (s) => {
        const suivant = ajouterCouche(s, moteur);
        setSelection(suivant.couches[suivant.couches.length - 1].id);
        return suivant;
      });
      setMessage(null);
    },
    [],
  );

  const retirer = useCallback((id: string) => {
    modifier("retrait", (s) => retirerCouche(s, id));
    setSelection((sel) => (sel === id ? null : sel));
  }, []);

  const couchesSelectionnee = useMemo(
    () => son.couches.find((c) => c.id === selection) ?? null,
    [selection, son.couches],
  );

  /* --- Enregistrer -------------------------------------------------------- */

  const enregistrer = useCallback(async () => {
    const s = sonVif.current;
    if (s.couches.length === 0) {
      setErreur("Ajoute au moins une couche avant d'enregistrer.");
      return;
    }
    /**
     * L'espace de travail d'abord : c'est ce qui rend le rangement AUTOMATIQUE.
     *
     * Sans lui, « rangement automatique » ne nommait qu'une suggestion — le
     * son partait dans un selecteur de fichier, et c'etait a l'utilisateur de
     * naviguer jusqu'au bon dossier a chaque fois.
     */
    const range = await rangerSon(s);
    if (range.ok) {
      setErreur(null);
      setMessage(`Rangé dans ${range.chemin} — visible dans la Bibliothèque sonore.`);
      return;
    }

    const r = await ecrireFichier(serialiserSon(s), nomFichierSon(s.nom), poignee);
    if (!r.ok) {
      if (!r.annule) setErreur(r.erreur ?? "L'enregistrement a échoué.");
      return;
    }
    setPoignee(r.poignee);
    setErreur(null);
    // On dit pourquoi ce n'est PAS range tout seul, plutot que de laisser
    // croire que ca l'est.
    const raison =
      range.raison === "pas-d-espace"
        ? " Aucun espace de travail connecté : le rangement reste manuel."
        : ` Rangement automatique impossible (${range.message ?? range.raison}).`;
    setMessage(
      (r.poignee
        ? `Enregistré dans « ${r.nomFichier} ». Rangement conseillé : ${cheminDe(s)}.`
        : `« ${r.nomFichier} » envoyé dans les téléchargements. Rangement conseillé : ${cheminDe(s)}.`) +
        raison,
    );
  }, [poignee]);

  /**
   * Envoie le son vers une machine, au format qu'elle attend.
   *
   * Le rendu est refait A LA FREQUENCE DE LA CIBLE — l'EP-133 lit en 26,25 kHz
   * sur ses emplacements LO — et non reechantillonne apres coup : un rendu a
   * 44,1 kHz puis decime aurait un repliement que le rendu direct n'a pas.
   *
   * L'OP-1 lit de l'AIFF, l'EP-133 du WAV. La table des cibles porte les deux,
   * ainsi que les durees maximales, et `dureeAdmise` borne.
   */
  const exporter = useCallback(async (cible: CibleMachine) => {
    const s = sonVif.current;
    if (s.couches.length === 0) {
      setErreur("Ajoute au moins une couche avant d'exporter.");
      return;
    }
    const spec = SPECS_CIBLES[cible];
    const duree = dureeAdmise(cible, 2);
    setMessage(`Rendu ${spec.libelle}…`);
    try {
      const r = await rendreSon(s, duree, spec.frequence);
      if (!r) {
        setErreur("Le rendu hors ligne n'est pas disponible dans ce navigateur.");
        return;
      }
      // La somme des couches peut depasser la butee : on divise plutot que de
      // laisser l'encodage ecreter, ce qui deformerait l'onde.
      const { signal, gain } = normaliser(r.somme);
      let octets =
        spec.format === "aiff"
          ? encodeAiffPcm16(signal, spec.canaux, spec.frequence)
          : encodeWavPcm16(signal, spec.canaux, spec.frequence);

      /**
       * L'OP-1 attend ses metadonnees DANS l'AIFF.
       *
       * La reference materielle du depot le dit : « Patches `.aif` avec
       * metadonnees JSON encodees dans le chunk standard AIFF `APPL` tag
       * `OP-1` ». Un fichier JSON pose a cote — ce que faisait le createur de
       * patch — n'est lu par personne : la machine n'ouvre que l'AIFF.
       *
       * Sans ce chunk, l'OP-1 charge quand meme le son, mais comme un
       * echantillon anonyme : pas de nom de patch, pas de frequence de
       * reference, donc une transposition calee sur un do arbitraire.
       */
      if (cible === "op1_synth" || cible === "op1_drum") {
        try {
          octets = encodeOp1PatchAiff(
            octets,
            cible === "op1_drum" ? "drum" : "synth",
            metadonneesOp1(s, cible === "op1_drum" ? "drum" : "synth"),
          );
        } catch (e) {
          // Le chunk est un PLUS : un refus de validation ne doit pas priver
          // du son. On exporte l'AIFF nu et on le dit.
          setMessage(
            `Métadonnées OP-1 non écrites (${e instanceof Error ? e.message : String(e)}) — le son reste exportable.`,
          );
        }
      }

      const nom = `${nomFichierSon(s.nom).replace(/\.son\.json$/, "")}.${
        spec.format === "aiff" ? "aif" : "wav"
      }`;
      const dansEspace = await rangerEchantillon(s, nom, octets);
      if (dansEspace.ok) {
        setErreur(null);
        setMessage(
          `${dansEspace.chemin} — ${(octets.byteLength / 1024).toFixed(0)} ko, ${spec.libelle}` +
            (gain < 1 ? ` · niveau réduit de ${(20 * Math.log10(gain)).toFixed(1)} dB` : "") +
            (spec.dossier ? ` · à copier dans ${spec.dossier} de la machine` : ""),
        );
        return;
      }

      const ecrit = await ecrireFichier(octets, nom);
      if (!ecrit.ok) {
        if (!ecrit.annule) setErreur(ecrit.erreur ?? "L'export a échoué.");
        return;
      }
      setErreur(null);
      setMessage(
        `${ecrit.nomFichier} — ${(octets.byteLength / 1024).toFixed(0)} ko, ${spec.libelle}` +
          (gain < 1 ? ` · niveau réduit de ${(20 * Math.log10(gain)).toFixed(1)} dB pour éviter l'écrêtage` : "") +
          (spec.dossier ? ` · à poser dans ${spec.dossier}` : ""),
      );
    } catch (e) {
      setErreur(`L'export a échoué : ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);

  const ouvrir = useCallback(async (fichier: File) => {
    const lu = analyserSon(await fichier.text());
    if ("erreur" in lu) {
      setErreur(lu.erreur);
      return;
    }
    setSon(lu.son);
    setSelection(lu.son.couches[0]?.id ?? null);
    setPoignee(null);
    setErreur(null);
    setMessage(`« ${lu.son.nom} » ouvert.`);
  }, []);

  /**
   * Charge un fichier audio et en fait une couche.
   *
   * `decodeAudioData` accepte tout ce que le navigateur sait lire — WAV, AIFF,
   * MP3, FLAC selon les cas — ce qui evite d'ecrire un decodeur par format.
   * On ne garde que le premier canal : l'atelier fabrique des sons mono, et
   * c'est ce que les deux machines attendent.
   */
  const chargerAudio = useCallback(async (fichier: File) => {
    try {
      const ctx = contexte();
      const tampon = await ctx.decodeAudioData(await fichier.arrayBuffer());
      const brut = tampon.getChannelData(0);
      // Deux secondes suffisent pour une couche : au-dela on fabrique un
      // morceau, pas un son, et le fichier enregistre deviendrait enorme.
      const max = Math.floor(tampon.sampleRate * 2);
      const coupe = brut.length > max ? brut.slice(0, max) : brut;
      setSon((s) =>
        ajouterEchantillon(s, {
          fichier: fichier.name,
          donnees: encoderEchantillons(coupe),
          taux: tampon.sampleRate,
          accord: 0,
        }),
      );
      setErreur(null);
      setMessage(
        brut.length > max
          ? `« ${fichier.name} » ajouté, coupé à 2 secondes.`
          : `« ${fichier.name} » ajouté.`,
      );
    } catch (e) {
      setErreur(
        `« ${fichier.name} » n'a pas pu être lu : ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }, []);

  /**
   * Le glisser-deposer accepte les deux : un son de l'atelier, ou un fichier
   * audio a superposer. On tranche sur l'extension plutot que sur le type MIME,
   * que les navigateurs remplissent mal pour les fichiers AIFF.
   */
  const [survol, setSurvol] = useState(false);
  const surDepot = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setSurvol(false);
      for (const fichier of Array.from(e.dataTransfer.files)) {
        if (/\.json$/i.test(fichier.name)) await ouvrir(fichier);
        else await chargerAudio(fichier);
      }
    },
    [chargerAudio, ouvrir],
  );

  /**
   * Fabrique un jeu de sons pour une machine, en une fois.
   *
   * Un moteur par son, choisi dans la famille demandee, avec la note et les
   * balises qui vont avec. Ce n'est pas de la composition : c'est le travail
   * ingrat qu'on refait a chaque fois qu'on remplit une machine vide, et qui
   * decourage d'essayer.
   *
   * Chaque son passe par le MEME chemin d'export que le bouton : meme rendu,
   * meme encodage, meme verification. Un raccourci ici produirait des fichiers
   * subtilement differents de ceux qu'on fabrique a la main.
   */
  const fabriquerJeu = useCallback(
    async (famille: string, cibleJeu: CibleMachine) => {
      const moteurs = FAMILLES.find((f) => f.dossier === famille)?.moteurs ?? [];
      if (moteurs.length === 0) return;
      const spec = SPECS_CIBLES[cibleJeu];
      const duree = dureeAdmise(cibleJeu, 2);
      let ecrits = 0;
      for (const moteur of moteurs) {
        // Une note par famille : les basses en bas du clavier, les nappes au
        // milieu. Rendre tout en do3 donnerait des basses inaudibles.
        const note = famille === "basses" ? 36 : famille === "rythmes" ? 36 : 60;
        let s = nouveauSon(`${famille}-${nomDe(moteur)}`);
        s = { ...ajouterCouche(s, moteur), note, etiquettes: [famille, "auto"] };
        try {
          const r = await rendreSon(s, duree, spec.frequence);
          if (!r) break;
          const { signal } = normaliser(r.somme);
          const octets =
            spec.format === "aiff"
              ? encodeAiffPcm16(signal, spec.canaux, spec.frequence)
              : encodeWavPcm16(signal, spec.canaux, spec.frequence);
          const nom = `${nomFichierSon(s.nom).replace(/\.son\.json$/, "")}.${
            spec.format === "aiff" ? "aif" : "wav"
          }`;
          // Dans l'espace si possible : un jeu de sept fichiers via le
          // selecteur demanderait sept validations a la suite.
          const range = await rangerEchantillon(s, nom, octets);
          if (range.ok) {
            ecrits += 1;
            continue;
          }
          const ecrit = await ecrireFichier(octets, nom);
          if (ecrit.ok) ecrits += 1;
          else if (ecrit.annule) break; // l'utilisateur a ferme le selecteur
        } catch {
          // Un moteur qui refuse de se rendre ne doit pas interrompre le jeu.
        }
      }
      setErreur(null);
      setMessage(
        ecrits > 0
          ? `${ecrits} son${ecrits > 1 ? "s" : ""} fabriqué${ecrits > 1 ? "s" : ""} pour ${spec.libelle}, balisés « ${famille} » et « auto ».`
          : "Aucun son fabriqué.",
      );
    },
    [],
  );

  /**
   * Modifie l'echantillon d'une couche.
   *
   * Les bornes passent par `bornesSaines` a l'ecriture ET a la relecture : une
   * fin avant le debut donnerait une duree negative, que
   * `createBufferSource` accepte sans broncher en ne jouant rien — ce qu'on
   * prendrait pour un echantillon muet.
   */
  const majEchantillon = useCallback(
    (couche: Couche, changements: Partial<NonNullable<Couche["echantillon"]>>) => {
      const base = { ...couche.echantillon!, ...changements };
      modifier(`${Object.keys(changements)[0]}:${couche.id}`, (s) =>
        modifierCouche(s, couche.id, {
          echantillon: { ...base, ...bornesSaines(base.debut, base.fin) },
        }),
      );
    },
    [modifier],
  );

  /**
   * Ctrl+Z et Ctrl+Maj+Z, sur la fenetre.
   *
   * Sur la fenetre et non sur le plan : un curseur ou un champ de saisie a le
   * focus la plupart du temps, et un gestionnaire pose sur un conteneur ne
   * verrait rien. On laisse passer quand le focus est dans une SAISIE DE
   * TEXTE — le nom du son, une balise — ou Ctrl+Z doit annuler la frappe, pas
   * la couche precedente.
   */
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      const actif = document.activeElement as HTMLElement | null;
      const dansUneSaisie =
        actif instanceof HTMLInputElement
          ? actif.type === "text" || actif.type === "number"
          : actif instanceof HTMLTextAreaElement;
      if (dansUneSaisie) return;
      e.preventDefault();
      if (e.shiftKey) refaireUnPas();
      else annulerUnPas();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [annulerUnPas, refaireUnPas]);

  const moyen = useMemo(() => moyenDisponible(), []);

  return (
    <AppShell activePage="atelier-son" profileName={profileName} className="atelier-son">
      <div
        className={`as-plan${survol ? " as-plan--survol" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => void surDepot(e)}
      >
        {/* ── L'onde, en haut ── */}
        <section className="as-onde" aria-label="Onde du son">
          <Onde rendu={rendu} calcule={calcule} />
          <div className="as-barre">
            <button type="button" className="as-bouton as-bouton--jouer" onClick={ecouter}>
              ▶ ÉCOUTER
            </button>
            <button
              type="button"
              className="as-bouton"
              onClick={annulerUnPas}
              disabled={!peutAnnuler(histoire)}
              title="Annuler (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              type="button"
              className="as-bouton"
              onClick={refaireUnPas}
              disabled={!peutRefaire(histoire)}
              title="Refaire (Ctrl+Maj+Z)"
            >
              ↷
            </button>
            <label className="as-champ">
              <span>NOM</span>
              <input
                value={son.nom}
                onChange={(e) => setSon((s) => ({ ...s, nom: e.target.value }))}
                aria-label="Nom du son"
              />
            </label>
            <label className="as-champ as-champ--court">
              <span>NOTE</span>
              <input
                type="number"
                min={0}
                max={127}
                value={son.note}
                onChange={(e) => {
                  const v = Number.parseInt(e.target.value, 10);
                  if (!Number.isNaN(v)) setSon((s) => ({ ...s, note: Math.min(127, Math.max(0, v)) }));
                }}
                aria-label="Note de référence"
              />
            </label>
            <span
              className={`as-rangement${espaceConnecte ? "" : " as-rangement--manuel"}`}
              title={
                espaceConnecte
                  ? `Rangé automatiquement dans shared/sounds/prepared/${dossierDe(son)}`
                  : "Aucun espace de travail connecté : le rangement restera manuel"
              }
            >
              📁 {dossierDe(son)}
              {!espaceConnecte && " (manuel)"}
            </span>
            <button type="button" className="as-bouton" onClick={() => void enregistrer()}>
              ENREGISTRER
            </button>
            <label className="as-champ">
              <span>VERS</span>
              <select
                value={cible}
                onChange={(e) => setCible(e.target.value as CibleMachine)}
                aria-label="Machine de destination"
              >
                {Object.entries(SPECS_CIBLES).map(([id, spec]) => (
                  <option key={id} value={id}>{spec.libelle}</option>
                ))}
              </select>
            </label>
            <button type="button" className="as-bouton" onClick={() => void exporter(cible)}>
              EXPORTER
            </button>
            <button type="button" className="as-bouton" onClick={() => entree.current?.click()}>
              OUVRIR
            </button>
            <input
              ref={entree}
              type="file"
              accept=".json"
              className="as-fichier-cache"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void ouvrir(f);
              }}
              aria-label="Ouvrir un son"
            />
          </div>
          <div className="as-balises">
            <span className="as-balises-titre">BALISES</span>
            {son.etiquettes.length === 0 && (
              <span className="as-vide">aucune — elles servent à retrouver le son, et à forcer son rangement</span>
            )}
            {son.etiquettes.map((e) => (
              <button
                key={e}
                type="button"
                className="as-balise"
                onClick={() =>
                  setSon((s) => ({ ...s, etiquettes: s.etiquettes.filter((x) => x !== e) }))
                }
                title={`Retirer « ${e} »`}
              >
                {e} ✕
              </button>
            ))}
            <input
              className="as-balise-saisie"
              value={balise}
              placeholder="+ balise"
              onChange={(ev) => setBalise(ev.target.value)}
              onKeyDown={(ev) => {
                if (ev.key !== "Enter") return;
                ev.preventDefault();
                const propre = balise.trim().toLowerCase().slice(0, 30);
                if (!propre) return;
                setSon((s) =>
                  s.etiquettes.includes(propre)
                    ? s
                    : { ...s, etiquettes: [...s.etiquettes, propre] },
                );
                setBalise("");
              }}
              aria-label="Ajouter une balise"
            />
          </div>
        </section>

        <div className="as-corps">
          {/* ── Les couches ── */}
          <section className="as-couches" aria-label="Couches du son">
            <h2 className="as-titre">Couches ({son.couches.length})</h2>

            <div className="as-ajout">
              <select
                value={moteurAAjouter}
                onChange={(e) => setMoteurAAjouter(e.target.value)}
                aria-label="Moteur à ajouter"
              >
                {Object.entries(CATALOGUE).map(([id, fiche]) => (
                  <option key={id} value={id}>{fiche.nom}</option>
                ))}
              </select>
              <button type="button" className="as-bouton" onClick={() => ajouter(moteurAAjouter)}>
                + MOTEUR
              </button>
              <button type="button" className="as-bouton" onClick={() => audio.current?.click()}>
                + SAMPLE
              </button>
              <input
                ref={audio}
                type="file"
                accept="audio/*,.wav,.aif,.aiff,.mp3,.flac"
                multiple
                className="as-fichier-cache"
                onChange={(e) => {
                  const fichiers = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  for (const f of fichiers) void chargerAudio(f);
                }}
                aria-label="Ajouter un échantillon"
              />
            </div>

            <details className="as-auto">
              <summary>Créer un jeu automatiquement</summary>
              <p className="as-vide">
                Un son par moteur de la famille, rendu et encodé pour la machine
                choisie en haut. Les balises sont posées.
              </p>
              <div className="as-auto-familles">
                {FAMILLES.map((f) => (
                  <button
                    key={f.dossier}
                    type="button"
                    className="as-bouton"
                    onClick={() => void fabriquerJeu(f.dossier, cible)}
                  >
                    {f.dossier} ({f.moteurs.length})
                  </button>
                ))}
              </div>
            </details>

            {son.couches.length === 0 ? (
              <p className="as-vide">
                Aucune couche. Choisis un moteur et ajoute-le : son onde apparaîtra
                en haut, dans sa couleur.
              </p>
            ) : (
              <ul className="as-liste">
                {son.couches.map((c, i) => (
                  <LigneCouche
                    key={c.id}
                    couche={c}
                    active={c.id === selection}
                    premier={i === 0}
                    dernier={i === son.couches.length - 1}
                    surSelection={() => setSelection(c.id)}
                    surRetrait={() => retirer(c.id)}
                    surDeplacement={(d) => modifier("ordre", (s) => deplacerCouche(s, c.id, d))}
                    surChangement={(ch) =>
                      // Le geste porte l'identifiant ET le champ : tirer le gain
                      // d'une couche puis celui d'une autre fait deux pas.
                      modifier(`${Object.keys(ch)[0]}:${c.id}`, (s) => modifierCouche(s, c.id, ch))
                    }
                  />
                ))}
              </ul>
            )}
          </section>

          {/* ── Les réglages de la couche choisie ── */}
          <section className="as-reglages" aria-label="Réglages de la couche">
            {couchesSelectionnee?.type === "echantillon" ? (
              <div className="as-carte-sample">
                <h3 className="as-titre">
                  <b className="as-pastille" style={{ background: couchesSelectionnee.couleur }} />
                  {couchesSelectionnee.nom}
                </h3>
                <p className="as-vide">
                  Échantillon · {couchesSelectionnee.echantillon?.taux ?? 0} Hz ·{" "}
                  {couchesSelectionnee.echantillon?.fichier}
                </p>
                {/* L'accord est le seul reglage d'un echantillon : il n'a pas de
                    moteur a piloter. Transposer change AUSSI la duree, comme sur
                    tout echantillonneur — monter d'une octave raccourcit le son. */}
                <ReglageEchantillon
                  libelle="ACCORD"
                  valeur={couchesSelectionnee.echantillon?.accord ?? 0}
                  min={-24}
                  max={24}
                  unite="demi-tons"
                  sur={(v) => majEchantillon(couchesSelectionnee, { accord: v })}
                />
                {/* La decoupe en POURCENTAGE : le son est reechantillonne au taux
                    du contexte a l'import, qui change d'une machine a l'autre.
                    Des bornes en millisecondes designeraient un autre endroit du
                    son sur un ordinateur en 48 kHz que sur un en 44,1. */}
                <ReglageEchantillon
                  libelle="DÉBUT"
                  valeur={Math.round((couchesSelectionnee.echantillon?.debut ?? 0) * 100)}
                  min={0}
                  max={100}
                  unite="%"
                  sur={(v) => majEchantillon(couchesSelectionnee, { debut: v / 100 })}
                />
                <ReglageEchantillon
                  libelle="FIN"
                  valeur={Math.round((couchesSelectionnee.echantillon?.fin ?? 1) * 100)}
                  min={0}
                  max={100}
                  unite="%"
                  sur={(v) => majEchantillon(couchesSelectionnee, { fin: v / 100 })}
                />
              </div>
            ) : couchesSelectionnee ? (
              <CarteMoteur
                moteur={couchesSelectionnee.moteur}
                valeurs={paramsDeCouche(couchesSelectionnee) as unknown as Record<string, unknown>}
                surReglage={(nom, valeur) =>
                  modifier(`${nom}:${couchesSelectionnee.id}`, (s) =>
                    modifierCouche(s, couchesSelectionnee.id, { params: { [nom]: valeur } }),
                  )
                }
                titre={
                  <span>
                    <b className="as-pastille" style={{ background: couchesSelectionnee.couleur }} />
                    {couchesSelectionnee.nom}
                  </span>
                }
              />
            ) : (
              <p className="as-vide">
                Choisis une couche à gauche pour régler son moteur.
              </p>
            )}
          </section>
        </div>

        <footer className="as-pied">
          {erreur ? (
            <p className="as-erreur" role="alert">{erreur}</p>
          ) : (
            <p className="as-message" role="status">
              {message ?? "Empile des moteurs, règle-les, écoute. Le rangement est automatique."}
            </p>
          )}
          {moyen === "telechargement" && (
            <p className="as-note">
              Contexte non sécurisé : « Enregistrer » télécharge un fichier au lieu
              de réécrire celui qui est ouvert. Passe par localhost pour l'écriture
              en place.
            </p>
          )}
        </footer>
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------------ */

/**
 * Le tracé : une courbe par couche dans sa couleur, la somme en blanc.
 *
 * Les couches sont dessinées en remplissage translucide, la somme en trait.
 * L'inverse — la somme remplie — masquerait les couches qu'elle contient, ce
 * qui est précisément ce qu'on veut voir.
 */
function Onde({ rendu, calcule }: { rendu: RenduSon | null; calcule: boolean }) {
  const toile = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = toile.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const r = canvas.getBoundingClientRect();
    const d = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(r.width * d));
    canvas.height = Math.max(1, Math.floor(r.height * d));
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);

    const milieu = r.height / 2;
    ctx.strokeStyle = "rgba(255,255,255,.12)";
    ctx.beginPath();
    ctx.moveTo(0, milieu);
    ctx.lineTo(r.width, milieu);
    ctx.stroke();

    if (!rendu || rendu.couches.length === 0) return;

    /**
     * Une seule échelle pour toutes les courbes, celle de la somme.
     *
     * Normaliser chaque couche séparément les ferait toutes remplir la
     * hauteur : une couche à peine audible paraîtrait aussi forte que celle
     * qui domine, et l'onde ne dirait plus rien de l'équilibre.
     */
    const echelle = Math.max(0.05, crete(rendu.somme));
    const largeur = Math.floor(r.width);

    for (const couche of rendu.couches) {
      const { min, max } = cretes(couche.echantillons, largeur);
      ctx.fillStyle = couche.couleur;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      for (let x = 0; x < largeur; x += 1) {
        const haut = milieu - (max[x] / echelle) * milieu;
        const bas = milieu - (min[x] / echelle) * milieu;
        ctx.rect(x, Math.min(haut, bas), 1, Math.max(1, Math.abs(bas - haut)));
      }
      ctx.fill();
    }

    /**
     * La somme est tracée en ENVELOPPE, pas en colonnes pleines.
     *
     * Une colonne verticale par pixel, même à 85 % d'opacité, forme un aplat
     * blanc qui recouvre entièrement les couches colorées dessous — constaté à
     * l'écran : on ne voyait plus une seule couleur. On ne dessine donc que les
     * deux bords, haut et bas, en un trait fin.
     */
    ctx.globalAlpha = 1;
    const { min, max } = cretes(rendu.somme, largeur);
    ctx.strokeStyle = "rgba(255,255,255,.6)";
    ctx.lineWidth = 1;
    for (const bord of [max, min]) {
      ctx.beginPath();
      for (let x = 0; x < largeur; x += 1) {
        const y = milieu - (bord[x] / echelle) * milieu;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }, [rendu]);

  return (
    <div className="as-toile">
      <canvas ref={toile} aria-hidden="true" />
      {calcule && <span className="as-calcul">calcul…</span>}
      {!rendu && !calcule && <span className="as-calcul">aucune couche</span>}
    </div>
  );
}

/** Une ligne de la pile : couleur, nom, gain, muet, ordre, retrait. */
function LigneCouche({
  couche,
  active,
  premier,
  dernier,
  surSelection,
  surRetrait,
  surDeplacement,
  surChangement,
}: {
  couche: Couche;
  active: boolean;
  premier: boolean;
  dernier: boolean;
  surSelection: () => void;
  surRetrait: () => void;
  surDeplacement: (delta: number) => void;
  surChangement: (changements: Partial<Omit<Couche, "id">>) => void;
}) {
  return (
    <li
      className={`as-couche${active ? " as-couche--active" : ""}`}
      // La couleur vient du modele, jamais du rang : c'est ce qui permet de
      // relier la ligne a sa courbe dans l'onde apres un reordonnancement.
      style={active ? undefined : { borderLeftColor: couche.couleur }}
    >
      <button
        type="button"
        className="as-choisir"
        onClick={surSelection}
        aria-pressed={active}
      >
        <b className="as-pastille" style={{ background: couche.couleur }} />
        <span className="as-nom">{couche.nom}</span>
      </button>

      <label className="as-gain">
        <span className="as-invisible">Volume de {couche.nom}</span>
        <input
          type="range"
          min={0}
          max={200}
          value={Math.round(couche.gain * 100)}
          onChange={(e) => surChangement({ gain: Number(e.target.value) / 100 })}
          aria-label={`Volume de ${couche.nom}`}
        />
      </label>

      <button
        type="button"
        className={`as-icone${couche.muette ? " as-icone--actif" : ""}`}
        onClick={() => surChangement({ muette: !couche.muette })}
        aria-pressed={couche.muette}
        title={couche.muette ? "Réactiver" : "Rendre muette"}
      >
        {couche.muette ? "🔇" : "🔊"}
      </button>
      <button type="button" className="as-icone" onClick={() => surDeplacement(-1)} disabled={premier} title="Monter">▲</button>
      <button type="button" className="as-icone" onClick={() => surDeplacement(1)} disabled={dernier} title="Descendre">▼</button>
      <button
        type="button"
        className="as-icone as-icone--retirer"
        onClick={surRetrait}
        title={`Retirer ${couche.nom}`}
        aria-label={`Retirer ${couche.nom}`}
      >
        ✕
      </button>
    </li>
  );
}

/** Un curseur de la carte d'echantillon. Meme forme que ceux des moteurs. */
function ReglageEchantillon({
  libelle,
  valeur,
  min,
  max,
  unite,
  sur,
}: {
  libelle: string;
  valeur: number;
  min: number;
  max: number;
  unite: string;
  sur: (valeur: number) => void;
}) {
  return (
    <label className="as-accord">
      <span>
        {libelle}
        <b>
          {valeur} {unite}
        </b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={valeur}
        onChange={(e) => sur(Number(e.target.value))}
        aria-label={libelle}
      />
    </label>
  );
}
