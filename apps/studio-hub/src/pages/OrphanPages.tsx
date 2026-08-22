import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/TopBar";
import { DEFAULT_PROFILE_NAME, readProfileName } from "../core/profile";

type PageId =
  | "landing" | "outils" | "profil" | "documentation" | "exercises"
  | "doc-op1" | "doc-ep133" | "studio-op1" | "studio-ep133"
  | "rhythm-hero" | "image-editor-op1" | "firmware-lab" | "firmware-gallery"
  | "firmware-compiler" | "theme-editor" | "theme-project" | "advanced-image"
  | "sound-patch-creator" | "audio-plugin-rack" | "sound-library"
  | "midi-settings" | "op1-settings" | "backup-lab" | "orphan-pages";

type Target = "OP-1" | "EP-133" | "Hub partagé" | "Aucun projet";
type PageRecord = {
  id: PageId;
  label: string;
  description: string;
  target: Target;
};

const PAGE_REGISTRY: PageRecord[] = [
  { id: "landing", label: "Accueil", description: "Point d’entrée général.", target: "Hub partagé" }
,
  { id: "outils", label: "Hub Outils", description: "Catalogue des outils.", target: "Hub partagé" }
,
  { id: "profil", label: "Profil", description: "Identité, machines et dossiers locaux.", target: "Hub partagé" }
,
  { id: "documentation", label: "Documentation", description: "Centre documentaire général.", target: "Hub partagé" }
,
  { id: "exercises", label: "Exercices OP-1", description: "Parcours d’apprentissage.", target: "OP-1" }
,
  { id: "doc-op1", label: "Documentation OP-1", description: "Guides et limites OP-1.", target: "OP-1" }
,
  { id: "doc-ep133", label: "Documentation EP-133", description: "Guides et limites EP-133.", target: "EP-133" }
,
  { id: "studio-op1", label: "OP-1 Studio", description: "Studio, patches, Tape et volume OP-1.", target: "OP-1" }
,
  { id: "studio-ep133", label: "EP-133 Studio", description: "Patterns, Songs et échanges EP-133.", target: "EP-133" }
,
  { id: "rhythm-hero", label: "Rhythm Hero", description: "Jeu d’entraînement EP-133.", target: "EP-133" }
,
  { id: "image-editor-op1", label: "Éditeur d’images OP-1", description: "Écrans OP-1 320 × 160.", target: "OP-1" }
,
  { id: "firmware-lab", label: "Firmware Lab", description: "Préparation locale des mods OP-1.", target: "OP-1" }
,
  { id: "firmware-gallery", label: "Galerie firmware", description: "Catalogue firmware et visuels OP-1.", target: "OP-1" }
,
  { id: "firmware-compiler", label: "Compilateur firmware", description: "Préparation des paquets firmware.", target: "OP-1" }
,
  { id: "theme-editor", label: "Éditeur de thème", description: "Personnalisation visuelle OP-1.", target: "OP-1" }
,
  { id: "theme-project", label: "Projet de thème", description: "Gestion des projets de thème.", target: "OP-1" }
,
  { id: "advanced-image", label: "Éditeur image avancé", description: "Édition avancée des visuels.", target: "Hub partagé" }
,
  { id: "sound-patch-creator", label: "Créateur de patch", description: "Création de patchs OP-1.", target: "OP-1" }
,
  { id: "audio-plugin-rack", label: "Audio Plugin Rack", description: "Rack audio applicatif partagé.", target: "Hub partagé" }
,
  { id: "sound-library", label: "Bibliothèque sonore", description: "Catalogue, hashes, étiquettes et favoris.", target: "Hub partagé" }
,
  { id: "midi-settings", label: "Réglages MIDI", description: "Synchronisation MIDI commune.", target: "Hub partagé" }
,
  { id: "op1-settings", label: "Réglages OP-1", description: "Configuration propre à l’OP-1.", target: "OP-1" }
,
  { id: "backup-lab", label: "Backup Lab", description: "Sauvegardes contrôlées des machines.", target: "Hub partagé" }
,
  { id: "orphan-pages", label: "Pages", description: "Registre et rangement des pages.", target: "Hub partagé" }
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
  "rhythm-hero": ["Hub · Apprendre"],
  "image-editor-op1": ["Hub · Éditeur d’image"],
  "firmware-lab": ["Hub · Galerie firmware"],
  "firmware-gallery": ["Hub · Galerie firmware"],
  "firmware-compiler": ["Page manager"],
  "theme-editor": ["Page manager"],
  "theme-project": ["Page manager"],
  "advanced-image": ["Page manager"],
  "sound-patch-creator": ["Page manager"],
  "audio-plugin-rack": ["Hub · Labo création sonore"],
  "sound-library": ["TopBar · Bibliothèque sonore", "Hub · Bibliothèque sonore"],
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
    return (filter === "all" || (filter === "archived" ? isArchived : !isArchived && isOrphan)) &&
      (target === "all" || page.target === target);
  }), [activePages, archived, filter, target]);

  const persist = (key: string, values: string[]) => localStorage.setItem(key, JSON.stringify(values));
  const openPage = (page: PageRecord) => (window as any).navigateMaquette(page.id);
  const toggleArchived = (id: string) => {
    const next = archived.includes(id) ? archived.filter((item) => item !== id) : [...archived, id];
    setArchived(next);
    persist(ARCHIVED_KEY, next);
  };
  const removeEntry = (page: PageRecord) => {
    if (!window.confirm(`Retirer « ${page.label} » du registre local ? Le code de la page ne sera pas supprimé.`)) return;
    const next = [...removed, page.id];
    setRemoved(next);
    persist(REMOVED_KEY, next);
  };
  const restoreEntry = (id: string) => {
    const next = removed.filter((item) => item !== id);
    setRemoved(next);
    persist(REMOVED_KEY, next);
  };

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
                  <small>{(PAGE_LINKS[page.id] || []).length ? `Boutons : ${(PAGE_LINKS[page.id] || []).join(" · ")}` : "Aucun bouton déclaré"}</small>
                  <div className="orphan-page-actions">
                    <button type="button" onClick={() => openPage(page)}>Voir la page →</button>
                    <button type="button" onClick={() => toggleArchived(page.id)}>{isArchived ? "Restaurer" : "Archiver"}</button>
                    <button type="button" onClick={() => removeEntry(page)}>Retirer</button>
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
