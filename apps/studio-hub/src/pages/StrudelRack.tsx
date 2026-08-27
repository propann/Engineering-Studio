"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { contexte } from "@studio-hub/rack-bus";
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
import { AppShell, Button, PageHeader, StatusBadge } from "../ui";

/**
 * Le rack Strudel — du code qui joue.
 *
 * Strudel est un langage de motifs : on écrit une ligne, elle boucle. C'est
 * un rack séparé, sans aucun lien avec le parcours de création OP-1, comme la
 * feuille de route l'exige.
 *
 * ## Ce qui est tenu, et pourquoi
 *
 * **Le contexte audio est celui du Hub.** `setAudioContext(contexte())` avant
 * l'initialisation : Strudel utiliserait sinon le sien, et sortirait à côté du
 * mixage et du transport au lieu d'y passer. C'est tout l'intérêt du fond de
 * panier.
 *
 * **Aucun échantillon distant.** Strudel n'en charge pas par défaut, et on ne
 * lui en ajoute pas : l'atelier promet que rien ne part sur un serveur. Les
 * synthés intégrés fonctionnent hors ligne, ils suffisent. Un test interdit
 * aux exemples fournis d'appeler `samples()`.
 *
 * **Aucune écriture machine.** Ce rack ne touche ni l'OP-1 ni l'EP-133. Il ne
 * lit aucun dossier et n'en écrit aucun.
 *
 * **Arrêt immédiat.** `hush()` coupe tout, et le bouton reste atteignable
 * pendant l'exécution — c'est le PANIC du rack.
 *
 * ## Chargement à la demande
 *
 * Le paquet pèse environ 1,5 Mo. L'importer d'office alourdirait le Hub entier
 * pour une page qu'on n'ouvre pas à chaque fois : il n'est cherché qu'au
 * premier démarrage, sur un geste de l'utilisateur — ce que la politique de
 * lecture automatique des navigateurs exige de toute façon.
 */

type Etat = "eteint" | "chargement" | "pret" | "joue";

/** Ce que `@strudel/web` expose, réduit à ce qu'on utilise. */
type ApiStrudel = {
  initStrudel: (options?: Record<string, unknown>) => void;
  evaluate: (code: string) => Promise<unknown>;
  hush: () => void;
  setAudioContext?: (ctx: AudioContext) => unknown;
};

export default function StrudelRack() {
  const [profileName, setProfileName] = useState("NOUVEAU MEMBRE");
  const [code, setCode] = useState(EXEMPLES[0].code);
  const [etat, setEtat] = useState<Etat>("eteint");
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [extraits, setExtraits] = useState<Extrait[]>([]);
  const [nom, setNom] = useState("");
  const api = useRef<ApiStrudel | null>(null);

  useEffect(() => {
    setProfileName(readProfileName());
    setExtraits(trierExtraits(lireExtraits()));
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
      mod.initStrudel();
      api.current = mod;
      setEtat("pret");
      return mod;
    } catch (e) {
      setEtat("eteint");
      setErreur(
        `Strudel n'a pas pu démarrer : ${e instanceof Error ? e.message : String(e)}`,
      );
      return null;
    }
  }, []);

  const jouer = useCallback(async () => {
    const mod = await demarrer();
    if (!mod) return;
    setErreur(null);
    try {
      await mod.evaluate(code);
      setEtat("joue");
      setMessage("En cours. « Arrêter » coupe tout.");
    } catch (e) {
      // Une erreur de syntaxe est le cas NORMAL d'un éditeur de code : on la
      // montre telle quelle, sans arrêter ce qui jouait déjà.
      setErreur(e instanceof Error ? e.message : String(e));
    }
  }, [code, demarrer]);

  const arreter = useCallback(() => {
    api.current?.hush();
    setEtat(api.current ? "pret" : "eteint");
    setMessage("Arrêté.");
  }, []);

  // Tout couper en quittant la page : sans cela, le motif continuerait de
  // jouer par-dessus l'écran suivant.
  useEffect(() => () => api.current?.hush(), []);

  const enregistrer = useCallback(() => {
    const liste = trierExtraits(enregistrerExtrait(nom, code, extraits));
    setExtraits(liste);
    setMessage(
      ecrireExtraits(liste)
        ? `« ${liste.find((e) => e.code === code)?.nom ?? nom} » enregistré localement.`
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

  const surTouche = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void jouer(); }
    if (e.key === "Escape") { e.preventDefault(); arreter(); }
  };

  return (
    <AppShell activePage="strudel-rack" profileName={profileName} className="strudel-page">
      <PageHeader
        eyebrow="RACK · LANGAGE DE MOTIFS"
        title={<>Strudel.<br /><em>Le code qui joue.</em></>}
        description="Écris une ligne, elle boucle. Rack séparé, branché sur le moteur audio du Hub — aucune machine n'est touchée."
        status={
          <StatusBadge tone={etat === "joue" ? "ready" : etat === "chargement" ? "test" : "offline"}>
            {etat === "joue" ? "En cours" : etat === "chargement" ? "Chargement…" : etat === "pret" ? "Prêt" : "Éteint"}
          </StatusBadge>
        }
      />

      <section className="strudel-atelier" aria-label="Éditeur Strudel">
        <div className="strudel-editeur">
          <label className="strudel-champ">
            <span>CODE</span>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={surTouche}
              spellCheck={false}
              rows={12}
              aria-label="Code Strudel"
            />
          </label>

          <div className="strudel-commandes">
            <Button variant="primary" onClick={() => void jouer()} disabled={etat === "chargement"}>
              {etat === "chargement" ? "Chargement…" : "Jouer"}
            </Button>
            {/* Toujours atteignable, y compris pendant le chargement : c'est
                l'arrêt d'urgence de ce rack. */}
            <Button variant="danger" onClick={arreter}>Arrêter</Button>
            <span className="strudel-raccourcis">Ctrl+Entrée pour jouer · Échap pour arrêter</span>
          </div>

          {erreur && <p className="strudel-erreur" role="alert">{erreur}</p>}
          {!erreur && message && <p className="strudel-message" role="status">{message}</p>}
        </div>

        <aside className="strudel-carnet" aria-label="Exemples et extraits">
          <h2>Exemples</h2>
          <ul className="strudel-liste">
            {EXEMPLES.map((e) => (
              <li key={e.nom}>
                <button type="button" onClick={() => setCode(e.code)}>{e.nom}</button>
                <small>{e.aide}</small>
              </li>
            ))}
          </ul>

          <h2>Mes extraits</h2>
          <div className="strudel-enregistrer">
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom de l'extrait"
              aria-label="Nom de l'extrait à enregistrer"
            />
            <Button variant="secondary" onClick={enregistrer}>Enregistrer</Button>
          </div>

          {extraits.length === 0 ? (
            <p className="strudel-vide">
              Aucun extrait gardé. Ce que tu enregistres reste dans ce navigateur,
              et n'en sort pas.
            </p>
          ) : (
            <ul className="strudel-liste">
              {extraits.map((e) => (
                <li key={e.id}>
                  <button type="button" onClick={() => setCode(e.code)}>{e.nom}</button>
                  <button
                    type="button"
                    className="strudel-oublier"
                    onClick={() => oublier(e.id)}
                    aria-label={`Retirer ${e.nom}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>
    </AppShell>
  );
}
