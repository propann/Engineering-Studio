import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/TopBar";
import { DEFAULT_PROFILE_NAME, readProfileName } from "../core/profile";

type PageId =
  | "landing" | "outils" | "profil" | "documentation" | "exercises"
  | "doc-op1" | "doc-ep133" | "studio-op1" | "studio-ep133"
  | "rhythm-hero" | "image-editor-op1" | "firmware-lab"
  | "advanced-image"
  | "sound-patch-creator" | "audio-plugin-rack" | "sound-library" | "sound-editor-hub"
  | "midi-settings" | "op1-settings" | "backup-lab" | "orphan-pages";

type Target = "OP-1" | "EP-133" | "Hub partagé" | "Aucun projet";
/**
 * Ce que la page touche VRAIMENT.
 *
 * La regle produit du 2026-08-26 : une fonction locale ou de demonstration ne
 * doit jamais laisser croire qu'elle agit sur la machine. Cette etiquette est
 * la pour que le registre le dise avant qu'on ouvre la page.
 *
 * **`machine` se merite.** Ce n'est pas « la page parle MIDI » mais « un
 * echange avec le materiel a ete constate », consigne dans
 * `docs/TESTS_PHYSIQUES.md`. Toute page dont l'effet materiel n'est pas
 * verifie de facon reproductible reste `non-verifie` — le doute se declare, il
 * ne s'arrondit pas vers le haut.
 *
 * Une detection automatique a ete essayee et jetee : chercher `sysex` ou
 * `output.send` dans le source classait la DOCUMENTATION EP-133 comme
 * agissant sur la machine, le mot etant dans son texte. La provenance est un
 * jugement produit, pas un fait de code.
 */
type Provenance = "machine" | "local" | "profil" | "demo" | "non-verifie";

/**
 * Ce que la page EST, structurellement.
 *
 * Question posee le 2026-08-26 : « il y a des pages de doc a la place des
 * vraies pages ». Mesuree sur les 21, la reponse est : une seule.
 *
 * - `outil` — fait le travail sur place ;
 * - `facade` — quelques lignes qui DELEGUENT a un composant reel. Une facade
 *   n'est pas une page vide : `MidiSettings` fait 28 lignes et monte tout le
 *   panneau MIDI. Compter ses boutons donnerait zero et la ferait passer pour
 *   une coquille ;
 * - `document` — presente du texte, et c'est tout.
 *
 * `document` n'est pas un reproche : `DocOP1`, `DocEP133` et `Documentation`
 * sont des pages de documentation, c'est leur metier. Le cas qui compte est
 * celui d'une page annoncee comme un outil et qui n'est que du texte —
 * `RhythmHero`, seule dans ce cas : 124 lignes, aucun composant importe, et la
 * promesse d'« exercices progressifs » qu'elle ne rend pas.
 */
type Nature = "outil" | "facade" | "document";

const NOMS_NATURE: Record<Nature, string> = {
  outil: "OUTIL",
  facade: "FAÇADE",
  document: "DOCUMENT",
};

const AIDES_NATURE: Record<Nature, string> = {
  outil: "Fait le travail sur place.",
  facade: "Quelques lignes qui montent un composant réel. Le travail est ailleurs, mais il existe.",
  document: "Présente du texte. Légitime pour une page de documentation ; à surveiller si elle est annoncée comme un outil.",
};

const NOMS_PROVENANCE: Record<Provenance, string> = {
  machine: "MACHINE",
  local: "LOCAL",
  profil: "PROFIL",
  demo: "DÉMO",
  "non-verifie": "NON VÉRIFIÉ",
};

const AIDES_PROVENANCE: Record<Provenance, string> = {
  machine: "Échange avec le matériel constaté et consigné dans TESTS_PHYSIQUES.md.",
  local: "Agit sur des fichiers du navigateur ou du dossier de travail. Ne touche pas la machine.",
  profil: "Métadonnées locales du personnage et des machines.",
  demo: "Interaction illustrative. Rien n'est écrit, ni en local ni sur la machine.",
  "non-verifie": "Effet matériel non validé de façon reproductible. À ne pas croire sur parole.",
};

type PageRecord = {
  id: PageId;
  label: string;
  description: string;
  target: Target;
  /**
   * Le fichier qui porte la page, relatif a `apps/studio-hub/src/`.
   *
   * Affiche pour qu'on sache ou aller lire sans fouiller. Un test le confronte
   * au `lazy(...)` de `App.tsx` : ecrit a la main, il pointerait tot ou tard
   * vers un fichier renomme.
   */
  source: string;
  provenance: Provenance;
  nature: Nature;
};

const PAGE_REGISTRY: PageRecord[] = [
  { id: "landing", label: "Accueil", description: "Point d’entrée général.", target: "Hub partagé", source: "pages/Landing.tsx", provenance: "local", nature: "outil" }
,
  { id: "outils", label: "Hub Outils", description: "Catalogue des outils.", target: "Hub partagé", source: "pages/ToolsHub.tsx", provenance: "local", nature: "outil" }
,
  { id: "profil", label: "Profil", description: "Identité, machines et dossiers locaux.", target: "Hub partagé", source: "pages/ProfileCreator.tsx", provenance: "profil", nature: "outil" }
,
  { id: "documentation", label: "Documentation", description: "Centre documentaire général.", target: "Hub partagé", source: "pages/Documentation.tsx", provenance: "local", nature: "document" }
,
  { id: "exercises", label: "Exercices OP-1", description: "Parcours d’apprentissage.", target: "OP-1", source: "pages/Exercises.tsx", provenance: "machine", nature: "facade" }
,
  { id: "doc-op1", label: "Documentation OP-1", description: "Guides et limites OP-1.", target: "OP-1", source: "pages/DocOP1.tsx", provenance: "local", nature: "document" }
,
  { id: "doc-ep133", label: "Documentation EP-133", description: "Guides et limites EP-133.", target: "EP-133", source: "pages/DocEP133.tsx", provenance: "local", nature: "document" }
,
  { id: "studio-op1", label: "OP-1 Studio", description: "Studio, patches, Tape et volume OP-1.", target: "OP-1", source: "pages/OP1StudioPage.tsx", provenance: "machine", nature: "facade" }
,
  { id: "studio-ep133", label: "EP-133 Studio", description: "Patterns, Songs et échanges EP-133.", target: "EP-133", source: "pages/EP133StudioPage.tsx", provenance: "machine", nature: "facade" }
,
  { id: "rhythm-hero", label: "Rhythm Hero", description: "Présentation du jeu d’entraînement EP-133 ; la partie jouable vit dans le Studio EP-133.", target: "EP-133", source: "pages/RhythmHero.tsx", provenance: "demo", nature: "document" }
,
  { id: "image-editor-op1", label: "Éditeur d’images OP-1", description: "Écrans OP-1 320 × 160.", target: "OP-1", source: "pages/ImageEditorOP1.tsx", provenance: "local", nature: "outil" }
,
  { id: "firmware-lab", label: "Firmware Lab", description: "Préparation locale des mods OP-1.", target: "OP-1", source: "pages/FirmwareLab.tsx", provenance: "non-verifie", nature: "outil" }
,
  { id: "advanced-image", label: "Éditeur image avancé", description: "Édition avancée des visuels.", target: "Hub partagé", source: "pages/AdvancedImageEditor.tsx", provenance: "demo", nature: "outil" }
,
  { id: "sound-patch-creator", label: "Créateur de patch", description: "Création de patchs OP-1.", target: "OP-1", source: "pages/SoundPatchCreator.tsx", provenance: "demo", nature: "outil" }
,
  { id: "audio-plugin-rack", label: "Audio Plugin Rack", description: "Rack audio applicatif partagé.", target: "Hub partagé", source: "pages/AudioPluginRack.tsx", provenance: "local", nature: "outil" }
,
  { id: "sound-library", label: "Bibliothèque sonore", description: "Catalogue, hashes, étiquettes et favoris.", target: "Hub partagé", source: "pages/SoundLibrary.tsx", provenance: "local", nature: "facade" }
,
  { id: "sound-editor-hub", label: "Éditeur sonore historique", description: "Onglet « Éditeur » de la Bibliothèque sonore, où il est déjà accessible. Sa route directe s'ouvre SANS barre de navigation : voir le rapport des doublons.", target: "Hub partagé", source: "pages/SoundEditorHub.tsx", provenance: "demo", nature: "outil" }
,
  { id: "midi-settings", label: "Réglages MIDI", description: "Synchronisation MIDI commune.", target: "Hub partagé", source: "pages/MidiSettings.tsx", provenance: "machine", nature: "facade" }
,
  { id: "op1-settings", label: "Réglages OP-1", description: "Configuration propre à l’OP-1.", target: "OP-1", source: "pages/OP1Settings.tsx", provenance: "machine", nature: "outil" }
,
  { id: "backup-lab", label: "Backup Lab", description: "Sauvegardes contrôlées des machines.", target: "Hub partagé", source: "pages/BackupLab.tsx", provenance: "non-verifie", nature: "facade" }
,
  { id: "orphan-pages", label: "Pages", description: "Registre et rangement des pages.", target: "Hub partagé", source: "pages/OrphanPages.tsx", provenance: "local", nature: "outil" }
,
];


const PAGE_LINKS: Record<string, string[]> = {
  "landing": ["logo"],
  "outils": ["TopBar · Hub Outils"],
  "profil": ["profil"],
  "documentation": ["TopBar · Docs", "Hub · Documentation"],
  "exercises": ["Hub · Apprendre"],
  "doc-op1": ["Hub · Documentation"],
  "doc-ep133": ["Hub · Documentation"],
  "studio-op1": ["TopBar · OP-1 Studio", "Hub · OP-1 Studio", "Hub · Tape"],
  "studio-ep133": ["TopBar · EP-133 Studio", "Hub · EP-133 Studio", "Hub · Pattern & Song"],
  // Sorti du groupe « Apprendre » le 2026-08-25 : la carte EP-133 ouvre
  // desormais le studio directement. Ce registre est le seul chemin qui
  // reste vers cette page.
  "rhythm-hero": ["Page manager"],
  "image-editor-op1": ["Hub · Éditeur d’image"],
  "firmware-lab": ["Hub · Firmware Lab"],
  "advanced-image": ["Page manager"],
  "sound-patch-creator": ["Page manager"],
  "audio-plugin-rack": ["Hub · Labo création sonore"],
  "sound-library": ["TopBar · Bibliothèque sonore", "Hub · Bibliothèque sonore"],
  "sound-editor-hub": ["Page manager"],
  "midi-settings": ["Hub · Réglages"],
  "op1-settings": ["Hub · Réglages"],
  "backup-lab": ["Hub · Sauvegarde"],
  "orphan-pages": ["TopBar · Pages"],
};

const ARCHIVED_KEY = "engineering-studio.page-registry.archived";
const REMOVED_KEY = "engineering-studio.page-registry.removed";

export default function OrphanPages() {
  const [filter, setFilter] = useState<"all" | "orphan" | "archived">("all");
  const [target, setTarget] = useState<"all" | Target>("all");
  const [recherche, setRecherche] = useState("");
  const [provenance, setProvenance] = useState<"all" | Provenance>("all");
  const [nature, setNature] = useState<"all" | Nature>("all");
  const [archived, setArchived] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);

  useEffect(() => {
    try {
      setArchived(JSON.parse(localStorage.getItem(ARCHIVED_KEY) || "[]"));
      setRemoved(JSON.parse(localStorage.getItem(REMOVED_KEY) || "[]"));
    } catch {
      setArchived([]);
      setRemoved([]);
    }
  }, []);

  const activePages = PAGE_REGISTRY.filter((page) => !removed.includes(page.id));
  const visiblePages = useMemo(() => activePages.filter((page) => {
    const isArchived = archived.includes(page.id);
    const isOrphan = (PAGE_LINKS[page.id] || []).length === 1 && (PAGE_LINKS[page.id] || [])[0] === "Page manager";
    // La recherche porte sur ce qu'on a sous les yeux ET sur le chemin source :
    // on cherche parfois une page dont on ne se rappelle que le nom de fichier.
    const q = recherche.trim().toLowerCase();
    const correspond = !q || [page.label, page.description, page.id, page.source]
      .some((champ) => champ.toLowerCase().includes(q));
    return (filter === "all" || (filter === "archived" ? isArchived : !isArchived && isOrphan)) &&
      (target === "all" || page.target === target) &&
      (provenance === "all" || page.provenance === provenance) &&
      (nature === "all" || page.nature === nature) &&
      correspond;
  }), [activePages, archived, filter, target, provenance, nature, recherche]);

  const persist = (key: string, values: string[]) => localStorage.setItem(key, JSON.stringify(values));
  const openPage = (page: PageRecord) => (window as any).navigateMaquette(page.id);
  const toggleArchived = (id: string) => {
    const next = archived.includes(id) ? archived.filter((item) => item !== id) : [...archived, id];
    setArchived(next);
    persist(ARCHIVED_KEY, next);
  };
  /**
   * Une page dont ce registre est le SEUL chemin d'accès.
   *
   * `PAGE_LINKS` recense les boutons qui mènent à chaque page. Quand il n'en
   * reste qu'un et que c'est celui-ci, retirer l'entrée ne « range » pas la
   * page : elle coupe la dernière porte, et le retrait est persisté dans
   * `localStorage`. La page devient alors inatteignable pour de bon — son code
   * est toujours là, mais plus rien ne l'ouvre. Seule la DERNIÈRE suppression
   * peut être annulée, donc deux retraits d'affilée en scellent un.
   */
  const estSeulAcces = (page: PageRecord) => {
    const liens = PAGE_LINKS[page.id] || [];
    return liens.length <= 1 && (liens.length === 0 || liens[0] === "Page manager");
  };

  const removeEntry = (page: PageRecord) => {
    if (estSeulAcces(page)) {
      window.alert(
        `« ${page.label} » n'est ouverte que depuis ce registre. La retirer la rendrait inatteignable.\n\n` +
        "Utilise plutôt « Archiver » : la page sort de la liste par défaut et reste rappelable par le filtre « Archivées »."
      );
      return;
    }
    if (!window.confirm(`Retirer « ${page.label} » du registre local ? Le code de la page ne sera pas supprimé.`)) return;
    const next = [...removed, page.id];
    setRemoved(next);
    persist(REMOVED_KEY, next);
  };
  /**
   * Propose le rattachement d'une page au Hub.
   *
   * Elle ne connecte rien — voir le commentaire du bouton. Elle nomme le
   * groupe qui convient d'apres la cible declaree, et rend la ligne exacte a
   * poser dans `ToolsHub.tsx`.
   */
  const proposerRattachement = (page: PageRecord) => {
    const groupe = page.target === "OP-1" ? "OP-1 Studio"
      : page.target === "EP-133" ? "EP-133 Studio"
      : page.target === "Hub partagé" ? "Outils partagés"
      : "Aucun groupe évident — à trancher";
    const ligne = `{ id: "${page.id}", page: "${page.id}", label: "${page.label}", groupe: "${groupe}" }`;
    window.alert(
      `« ${page.label} » n'a aucune porte hors de ce registre.\n\n` +
      `Groupe proposé : ${groupe}\n` +
      `Source : ${page.source}\n\n` +
      "Rattacher une page est un changement de code : ajoute son entrée dans\n" +
      "apps/studio-hub/src/pages/ToolsHub.tsx, par exemple\n\n" +
      `  ${ligne}\n\n` +
      "Cette fenêtre ne peut pas l'écrire à ta place, et ne fait donc rien de plus."
    );
  };

  const restoreEntry = (id: string) => {
    const next = removed.filter((item) => item !== id);
    setRemoved(next);
    persist(REMOVED_KEY, next);
  };

  /**
   * Les portes d'une page, le registre exclu.
   *
   * « Page manager » n'est pas une porte : c'est cette fenetre. La compter
   * ferait passer une page sans acces pour une page qui en a un, et c'est
   * exactement l'erreur qui rend une orpheline supprimable.
   */
  const portesDe = (page: PageRecord) => (PAGE_LINKS[page.id] || []).filter((l) => l !== "Page manager");

  const orphanCount = activePages.filter((page) => (PAGE_LINKS[page.id] || []).length === 1 && (PAGE_LINKS[page.id] || [])[0] === "Page manager").length;
  const archivedCount = activePages.filter((page) => archived.includes(page.id)).length;

  return (
    <main className="orphan-pages-page">
      <TopBar activePage="orphan-pages" profileName={readProfileName(DEFAULT_PROFILE_NAME)} />
      <div className="orphan-pages-shell">
        <header className="orphan-pages-hero">
          <div>
            <span className="orphan-pages-eyebrow">ENGINEERING STUDIO · REGISTRE</span>
            <h1>Pages <em>à organiser.</em></h1>
            <p>Chaque page déclarée par le Hub est listée ici avec ses boutons d’accès. Le classement est local et réversible : retirer une entrée ne supprime jamais le code.</p>
          </div>
          <div className="orphan-pages-count"><strong>{orphanCount}</strong><span>pages à connecter</span></div>
        </header>

        <section className="orphan-pages-summary" aria-label="Résumé des pages">
          {(["Aucun projet", "Hub partagé", "OP-1", "EP-133"] as Target[]).map((value) => (
            <button key={value} type="button" className={`orphan-pages-target-${value === "Aucun projet" ? "none" : value === "Hub partagé" ? "shared" : value === "OP-1" ? "op1" : "ep133"}`} onClick={() => setTarget(value)}>
              <span>{value}</span><strong>{activePages.filter((page) => page.target === value).length}</strong><small>pages</small>
            </button>
          ))}
        </section>

        <nav className="orphan-pages-filters" aria-label="Filtrer les pages">
          {([
            ["all", "Toutes"],
            ["orphan", `À connecter (${orphanCount})`],
            ["archived", `Archivées (${archivedCount})`],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" className={filter === value ? "actif" : ""} onClick={() => setFilter(value)}>{label}</button>
          ))}
          <button type="button" onClick={() => setTarget("all")}>Tous les rattachements</button>
        </nav>

        <div className="orphan-pages-chercher">
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Chercher un nom, une description ou un fichier…"
            aria-label="Chercher une page"
          />
          {/* Filtrer par ce que la page touche vraiment : c'est la question
              qu'on se pose avant d'ouvrir une page qu'on ne connait pas. */}
          <div className="orphan-pages-prov-filtres">
            <button type="button" className={provenance === "all" ? "actif" : ""} onClick={() => setProvenance("all")}>Toutes provenances</button>
            {(Object.keys(NOMS_PROVENANCE) as Provenance[]).map((value) => (
              <button
                key={value}
                type="button"
                className={`prov-${value} ${provenance === value ? "actif" : ""}`}
                onClick={() => setProvenance(value)}
                title={AIDES_PROVENANCE[value]}
              >
                {NOMS_PROVENANCE[value]} ({activePages.filter((page) => page.provenance === value).length})
              </button>
            ))}
          </div>
          <div className="orphan-pages-prov-filtres">
            <button type="button" className={nature === "all" ? "actif" : ""} onClick={() => setNature("all")}>Toutes natures</button>
            {(Object.keys(NOMS_NATURE) as Nature[]).map((value) => (
              <button
                key={value}
                type="button"
                className={`nat-${value} ${nature === value ? "actif" : ""}`}
                onClick={() => setNature(value)}
                title={AIDES_NATURE[value]}
              >
                {NOMS_NATURE[value]} ({activePages.filter((page) => page.nature === value).length})
              </button>
            ))}
          </div>
        </div>

        <section className="orphan-pages-list" aria-labelledby="orphan-pages-title">
          <div className="orphan-pages-section-heading">
            <div><span>REGISTRE DES PAGES</span><h2 id="orphan-pages-title">{visiblePages.length} page{visiblePages.length > 1 ? "s" : ""}</h2></div>
            <p>« Ouvrir » permet de vérifier la page dans le Hub. « Archiver » la masque de la vue courante. « Retirer » supprime uniquement son entrée locale.</p>
          </div>
          <div className="orphan-pages-grid">
            {visiblePages.map((page) => {
              const isArchived = archived.includes(page.id);
              return (
                <article key={page.id} className={`orphan-page-card ${isArchived ? "is-archived" : ""}`}>
                  <div className="orphan-page-card-top"><span className="orphan-page-id">{page.id}</span><span className="orphan-pages-badge">{page.target}</span></div>
                  <h3>{page.label}</h3>
                  <p>{page.description}</p>
                  {/* Ce que la page touche, avant qu'on l'ouvre. */}
                  <span className={`orphan-page-prov prov-${page.provenance}`} title={AIDES_PROVENANCE[page.provenance]}>
                    {NOMS_PROVENANCE[page.provenance]}
                  </span>
                  {/* Ce que la page EST : un outil, une facade qui delegue, ou
                      du texte. C'est ce qui permet de decider quoi garder sans
                      ouvrir les 21. */}
                  <span className={`orphan-page-nature nat-${page.nature}`} title={AIDES_NATURE[page.nature]}>
                    {NOMS_NATURE[page.nature]}
                  </span>
                  {/* Le nombre de PORTES, pas la liste seule : « 0 porte » se
                      lit d'un coup d'oeil la ou il fallait compter les libelles. */}
                  <small>
                    {portesDe(page).length
                      ? `${portesDe(page).length} porte${portesDe(page).length > 1 ? "s" : ""} : ${portesDe(page).join(" · ")}`
                      : "Aucune porte — ce registre est le seul accès"}
                  </small>
                  <code className="orphan-page-source">{page.source}</code>
                  <div className="orphan-page-actions">
                    <button type="button" onClick={() => openPage(page)}>Voir la page →</button>
                    {/* Rattacher une page au Hub, c'est ajouter une entree dans
                        `ToolsHub.tsx` — un changement de CODE, que rien a
                        l'execution ne peut faire. Un bouton « Connecter » qui
                        se contenterait de cocher une case ici serait une fausse
                        connexion : la page resterait tout aussi inatteignable,
                        et le registre affirmerait le contraire.

                        Il propose donc le rattachement et donne de quoi
                        l'ecrire, ce qui est la seule chose honnete a cet
                        endroit. */}
                    {!portesDe(page).length && (
                      <button type="button" onClick={() => proposerRattachement(page)}>Connecter au Hub…</button>
                    )}
                    <button type="button" onClick={() => toggleArchived(page.id)}>{isArchived ? "Restaurer" : "Archiver"}</button>
                    <button
                      type="button"
                      onClick={() => removeEntry(page)}
                      disabled={estSeulAcces(page)}
                      title={estSeulAcces(page)
                        ? "Seul chemin vers cette page : la retirer la rendrait inatteignable. Archive-la plutôt."
                        : "Retire l'entrée du registre local. Le code de la page reste."}
                    >
                      Retirer
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          {removed.length > 0 && (
            <div className="orphan-pages-removed">
              <strong>{removed.length} entrée{removed.length > 1 ? "s" : ""} retirée{removed.length > 1 ? "s" : ""}.</strong>
              <button type="button" onClick={() => restoreEntry(removed[removed.length - 1])}>Restaurer la dernière</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
