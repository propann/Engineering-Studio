"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { brancher, contexte, type Prise } from "@studio-hub/rack-bus";
import { readProfileName } from "../core/profile";
import { AppShell } from "../ui";
import { CarteMoteur } from "../components/CarteMoteur";
import { CATALOGUE } from "../core/audio/catalogueParams";
import { construireMoteur } from "../core/audio/moteurs";
import {
  ajouterCouche,
  analyserSon,
  cheminDe,
  couchesAudibles,
  deplacerCouche,
  dossierDe,
  modifierCouche,
  nomFichierSon,
  nouveauSon,
  paramsDeCouche,
  retirerCouche,
  serialiserSon,
  type Couche,
  type SonFabrique,
} from "../core/audio/couches";
import {
  crete,
  cretes,
  frequenceDeNoteMidi,
  rendreSon,
  type RenduSon,
} from "../core/audio/rendreCouches";
import { ecrireFichier, moyenDisponible } from "../core/strudel/projets";
import { reappliquerEffetsMaitre } from "../core/audio/effetsMaitre";
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

  const prise = useRef<Prise | null>(null);
  const entree = useRef<HTMLInputElement | null>(null);
  const sonVif = useRef(son);
  sonVif.current = son;

  useEffect(() => setProfileName(readProfileName()), []);

  useEffect(() => {
    return () => {
      prise.current?.detacher();
      prise.current = null;
    };
  }, []);

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
      setSon((s) => {
        const suivant = ajouterCouche(s, moteur);
        setSelection(suivant.couches[suivant.couches.length - 1].id);
        return suivant;
      });
      setMessage(null);
    },
    [],
  );

  const retirer = useCallback((id: string) => {
    setSon((s) => retirerCouche(s, id));
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
    const r = await ecrireFichier(serialiserSon(s), nomFichierSon(s.nom), poignee);
    if (!r.ok) {
      if (!r.annule) setErreur(r.erreur ?? "L'enregistrement a échoué.");
      return;
    }
    setPoignee(r.poignee);
    setErreur(null);
    setMessage(
      r.poignee
        ? `Enregistré dans « ${r.nomFichier} ». Rangement : ${cheminDe(s)}.`
        : `« ${r.nomFichier} » envoyé dans les téléchargements. Rangement conseillé : ${cheminDe(s)}.`,
    );
  }, [poignee]);

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

  const moyen = useMemo(() => moyenDisponible(), []);

  return (
    <AppShell activePage="atelier-son" profileName={profileName} className="atelier-son">
      <div className="as-plan">
        {/* ── L'onde, en haut ── */}
        <section className="as-onde" aria-label="Onde du son">
          <Onde rendu={rendu} calcule={calcule} />
          <div className="as-barre">
            <button type="button" className="as-bouton as-bouton--jouer" onClick={ecouter}>
              ▶ ÉCOUTER
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
            <span className="as-rangement" title="Dossier choisi d'après les couches et la note">
              📁 {dossierDe(son)}
            </span>
            <button type="button" className="as-bouton" onClick={() => void enregistrer()}>
              ENREGISTRER
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
                + AJOUTER
              </button>
            </div>

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
                    surDeplacement={(d) => setSon((s) => deplacerCouche(s, c.id, d))}
                    surChangement={(ch) => setSon((s) => modifierCouche(s, c.id, ch))}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* ── Les réglages de la couche choisie ── */}
          <section className="as-reglages" aria-label="Réglages de la couche">
            {couchesSelectionnee ? (
              <CarteMoteur
                moteur={couchesSelectionnee.moteur}
                valeurs={paramsDeCouche(couchesSelectionnee) as unknown as Record<string, unknown>}
                surReglage={(nom, valeur) =>
                  setSon((s) => modifierCouche(s, couchesSelectionnee.id, { params: { [nom]: valeur } }))
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
