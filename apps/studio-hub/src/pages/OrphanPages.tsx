import { TopBar } from "../components/TopBar";
import { DEFAULT_PROFILE_NAME, readProfileName } from "../core/profile";

type ProjectTarget = "OP-1" | "EP-133" | "Hub partagé" | "Aucun projet";

type StudioPage = {
  id: string;
  label: string;
  description: string;
  target: ProjectTarget;
};

const STUDIO_PAGES: StudioPage[] = [
  { id: "landing", label: "Accueil", description: "Point d’entrée général de l’atelier.", target: "Aucun projet" },
  { id: "outils", label: "Hub Outils", description: "Catalogue des outils disponibles dans l’atelier.", target: "Hub partagé" },
  { id: "profil", label: "Profil", description: "Identité, machines et dossiers locaux.", target: "Aucun projet" },
  { id: "documentation", label: "Documentation", description: "Centre documentaire général.", target: "Aucun projet" },
  { id: "exercises", label: "Exercices", description: "Parcours d’apprentissage général.", target: "Aucun projet" },
  { id: "doc-op1", label: "Documentation OP-1", description: "Guides dédiés à l’OP-1.", target: "OP-1" },
  { id: "doc-ep133", label: "Documentation EP-133", description: "Guides dédiés à l’EP-133.", target: "EP-133" },
  { id: "studio-op1", label: "OP-1 Studio", description: "Studio principal et gestion des projets OP-1.", target: "OP-1" },
  { id: "studio-ep133", label: "EP-133 Studio", description: "Studio principal et gestion des projets EP-133.", target: "EP-133" },
  { id: "rhythm-hero", label: "Rhythm Hero", description: "Jeu d’entraînement accessible depuis Hub Outils → Apprendre.", target: "Hub partagé" },
  { id: "image-editor-op1", label: "Éditeur d’images OP-1", description: "Création et préparation des écrans OP-1.", target: "OP-1" },
  { id: "firmware-lab", label: "Firmware Lab", description: "Atelier firmware et assets OP-1.", target: "OP-1" },
  { id: "firmware-gallery", label: "Galerie firmware", description: "Galerie des firmwares et visuels OP-1.", target: "OP-1" },
  { id: "firmware-compiler", label: "Compilateur firmware", description: "Préparation des paquets firmware OP-1.", target: "OP-1" },
  { id: "theme-editor", label: "Éditeur de thème", description: "Personnalisation visuelle de l’atelier OP-1.", target: "OP-1" },
  { id: "theme-project", label: "Projet de thème", description: "Gestion des projets de thème OP-1.", target: "OP-1" },
  { id: "advanced-image", label: "Éditeur image avancé", description: "Édition avancée des visuels de l’atelier.", target: "Hub partagé" },
  { id: "sound-editor", label: "Éditeur sonore", description: "Bibliothèque et édition des sons.", target: "Hub partagé" },
  { id: "sound-patch-creator", label: "Créateur de patch", description: "Création de patchs sonores.", target: "OP-1" },
  { id: "audio-plugin-rack", label: "Audio Plugin Rack", description: "Rack audio partagé.", target: "Hub partagé" },
  { id: "midi-settings", label: "Réglages MIDI", description: "Synchronisation MIDI des machines.", target: "Hub partagé" },
  { id: "op1-settings", label: "Réglages OP-1", description: "Configuration de la connexion OP-1.", target: "OP-1" },
  { id: "backup-lab", label: "Backup Lab", description: "Sauvegarde locale des deux machines.", target: "Hub partagé" },
  { id: "sound-library", label: "Bibliothèque sonore", description: "Catalogue commun : import, empreinte SHA-256, étiquettes et favoris.", target: "Hub partagé" },
  { id: "orphan-pages", label: "Recensement des pages", description: "Cette page : l’inventaire de toutes les pages et leur cible.", target: "Hub partagé" },
];

const TARGET_CLASS: Record<ProjectTarget, string> = {
  "OP-1": "orphan-pages-target-op1",
  "EP-133": "orphan-pages-target-ep133",
  "Hub partagé": "orphan-pages-target-shared",
  "Aucun projet": "orphan-pages-target-none",
};

export default function OrphanPages() {
  const orphanPages = STUDIO_PAGES.filter((page) => page.target === "Aucun projet");
  const groupedTargets = ["Aucun projet", "Hub partagé", "OP-1", "EP-133"] as const;

  return (
    <main className="orphan-pages-page">
      <TopBar activePage="orphan-pages" profileName={readProfileName(DEFAULT_PROFILE_NAME)} />
      <div className="orphan-pages-shell">
        <header className="orphan-pages-hero">
          <div>
            <span className="orphan-pages-eyebrow">ENGINEERING STUDIO · INVENTAIRE</span>
            <h1>Pages <em>orphelines.</em></h1>
            <p>Une page est dite orpheline lorsqu’elle n’est rattachée à aucun projet OP-1 ou EP-133. Cet inventaire rend les rattachements visibles et maintenables.</p>
          </div>
          <div className="orphan-pages-count"><strong>{orphanPages.length}</strong><span>pages sans projet</span></div>
        </header>

        <section className="orphan-pages-summary" aria-label="Résumé des rattachements">
          {groupedTargets.map((target) => {
            const count = STUDIO_PAGES.filter((page) => page.target === target).length;
            return <div key={target} className={TARGET_CLASS[target]}><span>{target}</span><strong>{count}</strong><small>{count === 1 ? "page" : "pages"}</small></div>;
          })}
        </section>

        <section className="orphan-pages-list" aria-labelledby="orphan-pages-title">
          <div className="orphan-pages-section-heading"><div><span>REGISTRE DES PAGES</span><h2 id="orphan-pages-title">Rattachements actuels</h2></div><p>La liste est centralisée ici pour faciliter le prochain classement par projet.</p></div>
          <div className="orphan-pages-grid">
            {STUDIO_PAGES.map((page) => (
              <article key={page.id} className={`orphan-page-card ${page.target === "Aucun projet" ? "is-orphan" : ""}`}>
                <div className="orphan-page-card-top"><span className="orphan-page-id">{page.id}</span><span className={`orphan-pages-badge ${TARGET_CLASS[page.target]}`}>{page.target}</span></div>
                <h3>{page.label}</h3>
                <p>{page.description}</p>
                {page.target === "Aucun projet" && <button type="button" onClick={() => (window as any).navigateMaquette("outils")}>Choisir un projet →</button>}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
