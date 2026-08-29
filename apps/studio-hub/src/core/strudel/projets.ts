/**
 * Les projets Strudel : les écrire sur le disque, les relire.
 *
 * ## Un projet n'est pas un extrait
 *
 * `extraits.ts` garde des bouts de code dans `localStorage` : pratique, mais
 * invisible depuis l'extérieur du navigateur, effacé par un nettoyage de
 * cache, et impossible à envoyer à quelqu'un. Un projet est un **fichier** :
 * il se sauvegarde, se rouvre, se copie sur une clé, se met dans un dépôt.
 *
 * Les deux coexistent. L'extrait est un brouillon, le projet est un livrable.
 *
 * ## Deux chemins, parce qu'un seul ne marche pas partout
 *
 * L'API File System Access — `showSaveFilePicker` — donne le vrai
 * comportement : « Enregistrer » réécrit le fichier ouvert, sans redemander où.
 * Elle exige un **contexte sécurisé**.
 *
 * Or l'atelier se sert en HTTP sur le réseau local : `http://192.168.2.59:3000`
 * n'est pas un contexte sécurisé, contrairement à `localhost`. Sur le poste de
 * développement l'API répond ; depuis un autre appareil du réseau, elle est
 * absente de `window` — sans erreur, sans avertissement.
 *
 * D'où le repli : téléchargement pour écrire, `<input type="file">` pour lire.
 * On perd la réécriture en place, on garde la sauvegarde. `moyenDisponible()`
 * dit lequel des deux est actif, pour que l'interface l'annonce au lieu de
 * proposer un bouton qui ne fera rien.
 *
 * ## Ce fichier n'écrit sur aucune machine
 *
 * Il ne connaît ni l'OP‑1 ni l'EP‑133, et ne touche jamais leur dossier. Le
 * sélecteur qu'il ouvre est celui de l'utilisateur, sur un fichier qu'il
 * désigne lui-même. C'est l'invariant que vérifie `StrudelRack.test.ts`.
 */

/** L'extension propre au rack. Un JSON, mais reconnaissable. */
export const EXTENSION = ".strudel.json";

/** Version du format. Permet de migrer sans perdre les anciens fichiers. */
export const VERSION_PROJET = 1;

export type Projet = {
  version: number;
  nom: string;
  code: string;
  /** Tempo au moment de la sauvegarde, pour rouvrir dans les mêmes conditions. */
  bpm: number;
  creeLe: string;
  modifieLe: string;
};

/** Ce que le rack sait faire ici, selon le navigateur et le contexte. */
export type MoyenFichier = "systeme-de-fichiers" | "telechargement";

/**
 * Lequel des deux chemins est disponible.
 *
 * On teste la présence des DEUX fonctions : Safari expose `showOpenFilePicker`
 * sans `showSaveFilePicker` sur certaines versions, et n'en détecter qu'une
 * donnerait un « Enregistrer » mort.
 */
export function moyenDisponible(
  fenetre: Partial<Window> = globalThis as unknown as Window,
): MoyenFichier {
  const secure = (fenetre as { isSecureContext?: boolean }).isSecureContext;
  const w = fenetre as unknown as Record<string, unknown>;
  if (
    secure &&
    typeof w.showSaveFilePicker === "function" &&
    typeof w.showOpenFilePicker === "function"
  ) {
    return "systeme-de-fichiers";
  }
  return "telechargement";
}

/**
 * Un nom de fichier sûr, dérivé du nom du projet.
 *
 * Les caractères interdits varient selon les systèmes ; on garde l'union la
 * plus stricte. Un nom vide donne « sans-titre » plutôt qu'un fichier appelé
 * `.strudel.json`, que la plupart des systèmes cachent.
 */
export function nomFichier(nom: string): string {
  const base = nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 _-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 60);
  return `${base || "sans-titre"}${EXTENSION}`;
}

/** Fabrique un projet neuf. L'heure est injectable pour les tests. */
export function nouveauProjet(
  nom: string,
  code: string,
  bpm: number,
  maintenant: () => string = () => new Date().toISOString(),
): Projet {
  const t = maintenant();
  return {
    version: VERSION_PROJET,
    nom: nom.trim() || "Sans titre",
    code,
    bpm,
    creeLe: t,
    modifieLe: t,
  };
}

/** Le texte à écrire. Indenté : un projet se relit et se compare dans git. */
export function serialiser(projet: Projet): string {
  return `${JSON.stringify(projet, null, 2)}\n`;
}

/**
 * Relit un fichier.
 *
 * Accepte aussi du **code nu** — un `.js` copié depuis strudel.cc n'est pas du
 * JSON, et refuser de l'ouvrir serait absurde alors que c'est exactement ce
 * qu'on veut coller. Dans ce cas le tempo est inconnu : on rend `null`, et
 * l'appelant garde le sien plutôt que d'imposer une valeur inventée.
 *
 * Ne lève jamais : un fichier abîmé rend un message, pas une page blanche.
 */
export function analyser(
  contenu: string,
  nomDeSecours = "Sans titre",
): { projet: Projet; brut: boolean } | { erreur: string } {
  const texte = contenu.trim();
  if (!texte) return { erreur: "Le fichier est vide." };

  // Un projet du rack commence par une accolade. Tout le reste est du code.
  if (texte.startsWith("{")) {
    let lu: unknown;
    try {
      lu = JSON.parse(texte);
    } catch {
      return { erreur: "Ce fichier ressemble à un projet, mais son JSON est illisible." };
    }
    const p = lu as Partial<Projet>;
    if (typeof p?.code !== "string") {
      return { erreur: "Ce JSON ne contient pas de champ « code »." };
    }
    if (typeof p.version === "number" && p.version > VERSION_PROJET) {
      return {
        erreur:
          `Ce projet est en version ${p.version}, le rack lit jusqu'à ${VERSION_PROJET}. ` +
          "Mets le Hub à jour avant de l'ouvrir.",
      };
    }
    const t = new Date().toISOString();
    return {
      brut: false,
      projet: {
        version: typeof p.version === "number" ? p.version : VERSION_PROJET,
        nom: typeof p.nom === "string" && p.nom.trim() ? p.nom : nomDeSecours,
        code: p.code,
        // Un bpm absurde dans le fichier ne doit pas dérégler le Hub entier.
        bpm: typeof p.bpm === "number" && Number.isFinite(p.bpm) ? p.bpm : 0,
        creeLe: typeof p.creeLe === "string" ? p.creeLe : t,
        modifieLe: typeof p.modifieLe === "string" ? p.modifieLe : t,
      },
    };
  }

  const t = new Date().toISOString();
  return {
    brut: true,
    projet: {
      version: VERSION_PROJET,
      nom: nomDeSecours,
      code: texte,
      bpm: 0,
      creeLe: t,
      modifieLe: t,
    },
  };
}

/** Le nom du projet déduit d'un nom de fichier, extensions retirées. */
export function nomDepuisFichier(fichier: string): string {
  return (
    fichier
      .replace(/\.strudel\.json$/i, "")
      .replace(/\.(json|js|txt|mjs)$/i, "")
      .replace(/[-_]+/g, " ")
      .trim() || "Sans titre"
  );
}

/**
 * Y a-t-il des modifications non enregistrées ?
 *
 * Comparer le code suffit : c'est la seule chose qu'on perd vraiment. Le tempo
 * vit dans le transport partagé du Hub et survit au rechargement de la page.
 */
export function modifie(projet: Projet | null, codeActuel: string): boolean {
  if (!projet) return codeActuel.trim().length > 0;
  return projet.code !== codeActuel;
}

/* -------------------------------------------------------------------------
 * Les entrées/sorties.
 *
 * Elles vivent ici, hors du composant, pour la raison qui a fait naître
 * `extraits.ts` : une logique écrite dans le JSX n'est vérifiable que par la
 * présence d'une chaîne dans un fichier, ce qui ne prouve rien de son
 * comportement.
 *
 * Aucune de ces fonctions ne connaît de machine. Le seul dossier qu'elles
 * touchent est celui que l'utilisateur désigne dans le sélecteur de son
 * système, sur un fichier qu'il nomme lui-même.
 * ---------------------------------------------------------------------- */

/** Le résultat d'une écriture. `annule` distingue un refus d'une panne. */
export type Ecriture =
  | { ok: true; nomFichier: string; poignee: FileSystemFileHandle | null }
  | { ok: false; annule: boolean; erreur?: string };

type FenetreFichiers = Window & {
  showSaveFilePicker?: (o: unknown) => Promise<FileSystemFileHandle>;
  showOpenFilePicker?: (o: unknown) => Promise<FileSystemFileHandle[]>;
};

/** Les types acceptés par les deux sélecteurs. */
const TYPES_FICHIER = [
  {
    description: "Projet Strudel",
    accept: { "application/json": [".strudel.json", ".json"] },
  },
  {
    description: "Code Strudel",
    accept: { "text/javascript": [".js", ".mjs", ".txt"] },
  },
];

/**
 * Écrit le projet.
 *
 * Avec une poignée existante, réécrit le fichier sans rien demander — c'est le
 * « Ctrl+S » attendu. Sans poignée, ouvre le sélecteur, ou retombe sur un
 * téléchargement quand l'API n'est pas là.
 */
export async function enregistrerProjet(
  projet: Projet,
  poigneeExistante: FileSystemFileHandle | null = null,
  fenetre: FenetreFichiers = globalThis as unknown as FenetreFichiers,
): Promise<Ecriture> {
  return ecrireFichier(serialiser(projet), nomFichier(projet.nom), poigneeExistante, fenetre);
}

/**
 * Écrit un contenu dans un fichier que l'utilisateur désigne.
 *
 * Extrait de `enregistrerProjet` le 2026-08-29, quand l'atelier de son a eu
 * besoin d'écrire ses propres fichiers. Deux copies de ce code auraient
 * diverge au premier navigateur récalcitrant — et c'est ici que vivent les
 * deux pièges : le repli hors contexte sécurisé, et l'`AbortError` qui n'est
 * pas une panne mais un geste.
 */
export async function ecrireFichier(
  contenu: string,
  nom: string,
  poigneeExistante: FileSystemFileHandle | null = null,
  fenetre: FenetreFichiers = globalThis as unknown as FenetreFichiers,
): Promise<Ecriture> {
  if (moyenDisponible(fenetre) === "systeme-de-fichiers") {
    try {
      const poignee =
        poigneeExistante ??
        (await fenetre.showSaveFilePicker!({
          suggestedName: nom,
          types: TYPES_FICHIER,
        }));
      const flux = await poignee.createWritable();
      await flux.write(contenu);
      await flux.close();
      return { ok: true, nomFichier: poignee.name ?? nom, poignee };
    } catch (e) {
      // `AbortError` est le geste normal de fermer le sélecteur : ce n'est pas
      // une panne, et l'annoncer comme telle serait mensonger.
      if (e instanceof DOMException && e.name === "AbortError") {
        return { ok: false, annule: true };
      }
      // Une poignée devenue invalide — fichier déplacé, permission expirée —
      // ne doit pas coûter le travail en cours : on retombe sur le
      // téléchargement plutôt que d'échouer.
      return telecharger(contenu, nom);
    }
  }

  return telecharger(contenu, nom);
}

/**
 * Le repli : provoquer un téléchargement.
 *
 * Fonctionne partout, y compris hors contexte sécurisé. On perd la réécriture
 * en place — chaque enregistrement crée un fichier de plus dans le dossier de
 * téléchargements — et l'interface le dit plutôt que de le cacher.
 */
function telecharger(contenu: string, nom: string): Ecriture {
  try {
    const blob = new Blob([contenu], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nom;
    a.rel = "noopener";
    document.body.append(a);
    a.click();
    a.remove();
    // Révoquer tout de suite couperait le téléchargement dans certains
    // navigateurs : on laisse une fenêtre courte.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return { ok: true, nomFichier: nom, poignee: null };
  } catch (e) {
    return {
      ok: false,
      annule: false,
      erreur: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Le résultat d'une lecture. */
export type Lecture =
  | { ok: true; projet: Projet; brut: boolean; poignee: FileSystemFileHandle | null }
  | { ok: false; annule: boolean; erreur?: string };

/**
 * Ouvre un projet via le sélecteur du système.
 *
 * Rend aussi la poignée quand elle existe : le prochain enregistrement
 * réécrira alors ce fichier au lieu d'en créer un autre.
 */
export async function ouvrirProjet(
  fenetre: FenetreFichiers = globalThis as unknown as FenetreFichiers,
): Promise<Lecture> {
  if (moyenDisponible(fenetre) !== "systeme-de-fichiers") {
    return { ok: false, annule: false, erreur: "hors-contexte-securise" };
  }
  try {
    const [poignee] = await fenetre.showOpenFilePicker!({
      types: TYPES_FICHIER,
      multiple: false,
    });
    const fichier = await poignee.getFile();
    const lu = analyser(await fichier.text(), nomDepuisFichier(fichier.name));
    if ("erreur" in lu) return { ok: false, annule: false, erreur: lu.erreur };
    // Un fichier de code nu n'est pas un projet : le réécrire en place le
    // transformerait en JSON sous les yeux de son auteur. On ne garde donc la
    // poignée que pour un vrai projet.
    return { ok: true, projet: lu.projet, brut: lu.brut, poignee: lu.brut ? null : poignee };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return { ok: false, annule: true };
    }
    return { ok: false, annule: false, erreur: e instanceof Error ? e.message : String(e) };
  }
}

/** Lit un fichier venu d'un `<input type="file">`. Le repli de `ouvrirProjet`. */
export async function lireFichier(fichier: File): Promise<Lecture> {
  try {
    const lu = analyser(await fichier.text(), nomDepuisFichier(fichier.name));
    if ("erreur" in lu) return { ok: false, annule: false, erreur: lu.erreur };
    return { ok: true, projet: lu.projet, brut: lu.brut, poignee: null };
  } catch (e) {
    return { ok: false, annule: false, erreur: e instanceof Error ? e.message : String(e) };
  }
}
