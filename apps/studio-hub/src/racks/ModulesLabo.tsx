import { Suspense, lazy } from "react";

/**
 * Les modules du Labo.
 *
 * Le Labo réunit ce qui servait à fabriquer du son dans deux pages séparées :
 * les moteurs logiciels d'un côté, la création de patches pour les machines de
 * l'autre. Un seul endroit, et un emplacement de module qu'on remplit selon ce
 * qu'on fait.
 *
 * Les modules sont chargés **à la demande**. Le Labo est déjà le plus gros
 * morceau de l'application ; y importer d'office l'éditeur de patch machine et
 * la bibliothèque alourdirait son chargement pour des panneaux qu'on n'ouvre
 * pas à chaque fois.
 */
const PatchMachine = lazy(() => import("../pages/SoundPatchCreator"));
const Bibliotheque = lazy(() => import("./ModuleBibliotheque"));
const EditeurSample = lazy(() => import("../pages/SoundEditorHub"));

export type ModuleLabo = "aucun" | "patch-machine" | "bibliotheque" | "sample";

/** Ce que chaque module apporte, dit en une ligne. */
export const MODULES: { id: ModuleLabo; nom: string; aide: string }[] = [
  { id: "aucun", nom: "— Aucun module —", aide: "Rien sous les moteurs" },
  {
    id: "patch-machine",
    nom: "🎛️ Patch machine",
    aide: "Moteurs natifs de l'OP-1 et réglages de pads EP-133 — ce que la machine sait jouer elle-même",
  },
  {
    id: "sample",
    nom: "✂️ Édition de sample",
    aide: "Découpe, fondus et écoute — le banc d'écoute des sons des deux machines",
  },
  {
    id: "bibliotheque",
    nom: "📚 Bibliothèque sonore",
    aide: "Les sons de ton atelier : import, empreinte, étiquettes, favoris",
  },
];

export type ProprietesModulesLabo = {
  module: ModuleLabo;
  onModule: (module: ModuleLabo) => void;
};

/**
 * Le sélecteur seul. Contrôlé, comme `RackEffets` et `SelecteurGamme` : il
 * reçoit ce qu'il affiche et rend ce qu'on choisit.
 */
export function SelecteurModule({ module, onModule }: ProprietesModulesLabo) {
  const courant = MODULES.find((m) => m.id === module);
  return (
    <div className="labo-modules">
      <label className="labo-modules-champ">
        <span>MODULE</span>
        <select
          value={module}
          onChange={(e) => onModule(e.target.value as ModuleLabo)}
          aria-label="Module du Labo"
        >
          {MODULES.map((m) => (
            <option key={m.id} value={m.id}>{m.nom}</option>
          ))}
        </select>
      </label>
      <span className="labo-modules-aide">{courant?.aide}</span>
    </div>
  );
}

/**
 * L'emplacement. Ne rend rien quand aucun module n'est choisi — un cadre vide
 * prendrait la place des moteurs sans rien apporter.
 */
export function EmplacementModule({ module }: { module: ModuleLabo }) {
  if (module === "aucun") return null;
  return (
    <div className="labo-emplacement">
      <Suspense fallback={<div className="labo-chargement">Chargement du module…</div>}>
        {module === "patch-machine" && <PatchMachine enModule />}
        {module === "sample" && <EditeurSample />}
        {module === "bibliotheque" && <Bibliotheque />}
      </Suspense>
    </div>
  );
}
