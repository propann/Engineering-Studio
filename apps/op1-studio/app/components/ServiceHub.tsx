import type { ReactNode } from "react";
import sourcesCatalog from "../../data/content/sources.json";

type ServiceIcon = (props: { name: "archive" | "image" | "wave" | "book"; size?: number }) => ReactNode;
type LocalTool = "editor" | "sounds" | "firmware";

type CatalogSource = {
  id: string;
  name: string;
  kind: string;
  url: string | null;
  license: string;
  importMode: string;
  contentKinds: string[];
  notes?: string;
};

const sources = (sourcesCatalog.sources as CatalogSource[]).filter((source) => source.kind !== "local");

export function ServiceHub({ Icon, onOpenLocal }: { Icon: ServiceIcon; onOpenLocal: (tool: LocalTool) => void }) {
  return <div className="tool-body service-hub">
    <div className="page-heading">
      <div>
        <span className="eyebrow"><Icon name="book" size={16} /> OP-1 STUDIO / SERVICES</span>
        <h2>Portail de l’atelier</h2>
        <p>Accédez aux outils locaux et aux services de découverte sans téléchargement automatique ni compte partagé.</p>
      </div>
    </div>

    <section className="service-local-tools" aria-labelledby="service-local-title">
      <div className="mod-section-heading"><div><span className="section-label">OUTILS LOCAUX</span><strong id="service-local-title">Créer et préparer sur cet appareil</strong></div><small>Aucune donnée envoyée</small></div>
      <div className="service-tool-grid">
        <button type="button" className="service-tool-card" onClick={() => onOpenLocal("editor")}><Icon name="image" size={22} /><strong>Éditeur d’images</strong><small>Créer, inspecter et exporter des patches SVG 320×160.</small></button>
        <button type="button" className="service-tool-card" onClick={() => onOpenLocal("sounds")}><Icon name="wave" size={22} /><strong>Éditeur de patchs son</strong><small>Analyser WAV/AIFF, lire les métadonnées OP‑1 et préparer un AIFF local.</small></button>
        <button type="button" className="service-tool-card" onClick={() => onOpenLocal("firmware")}><Icon name="archive" size={22} /><strong>Préparation firmware</strong><small>Vérifier un fichier local et produire un plan contrôlé sans écriture automatique.</small></button>
      </div>
    </section>

    <section className="service-catalog" aria-labelledby="service-catalog-title">
      <div className="mod-section-heading"><div><span className="section-label">CATALOGUE DE SOURCES</span><strong id="service-catalog-title">Services externes référencés</strong></div><small>Import manuel uniquement</small></div>
      <div className="service-catalog-grid">
        {sources.map((source) => <article className="service-catalog-card" key={source.id}>
          <div><span className="service-kind">{source.kind === "official" ? "OFFICIEL" : source.kind === "community-service" ? "COMMUNAUTAIRE" : "OUTIL"}</span><h3>{source.name}</h3></div>
          <p>{source.notes ?? "Source référencée pour découverte et import explicite."}</p>
          <small>Contenu : {source.contentKinds.join(" · ")}<br />Licence : {source.license}</small>
          {source.url ? <a className="secondary-action service-open-link" href={source.url} target="_blank" rel="noreferrer">Ouvrir le service</a> : <span className="tool-note">Source locale uniquement</span>}
        </article>)}
      </div>
    </section>

    <p className="tool-note service-safety-note"><Icon name="book" size={14} /> Les services externes ne sont ni scrapés ni synchronisés automatiquement. Vérifiez la licence et l’origine de chaque fichier avant import dans la bibliothèque locale.</p>
  </div>;
}
