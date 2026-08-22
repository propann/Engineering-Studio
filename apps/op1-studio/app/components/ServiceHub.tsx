import type { ReactNode } from "react";
import sourcesCatalog from "../../data/content/sources.json";

type ServiceIcon = (props: { name: "archive" | "image" | "wave" | "book" | "sparkles"; size?: number }) => ReactNode;
export type LocalTool = "editor" | "sounds" | "firmware" | "learn";

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
  return (
    <div className="tool-body service-hub">
      <div className="page-heading">
        <div>
          <span className="eyebrow"><Icon name="book" size={16} /> OP-1 STUDIO / SERVICES & HUB OUTILS</span>
          <h2>Portail de l’atelier & Hub Outils</h2>
          <p>Accédez aux modules d’apprentissage, outils locaux de création et services de découverte sans compte externe.</p>
        </div>
      </div>

      <section className="service-local-tools" aria-labelledby="service-local-title">
        <div className="mod-section-heading">
          <div>
            <span className="section-label">HUB OUTILS & APPRENTISSAGE</span>
            <strong id="service-local-title">Outils locaux et modules interactifs</strong>
          </div>
          <small>100% interactif & sécurisé sur cet appareil</small>
        </div>

        <div className="service-tool-grid">
          {/* Bouton Apprendre & Arcade Guitar Hero OP-1 */}
          <button
            type="button"
            className="service-tool-card"
            onClick={() => onOpenLocal("learn")}
            style={{
              borderColor: "rgba(255, 58, 93, 0.4)",
              background: "linear-gradient(135deg, rgba(255, 58, 93, 0.12) 0%, rgba(13, 17, 23, 0.95) 100%)",
            }}
          >
            <span style={{ fontSize: "24px" }}>🎓</span>
            <strong style={{ color: "#FF3A5D" }}>Apprendre & Arcade OP-1</strong>
            <small>Guitar Hero interactif, apprentissage des accords, finger drumming (mapping officiel 53-76) et fiche de personnage RPG sauvegardée.</small>
          </button>

          {/* Éditeur d'images */}
          <button type="button" className="service-tool-card" onClick={() => onOpenLocal("editor")}>
            <Icon name="image" size={22} />
            <strong>Éditeur d’images OLED</strong>
            <small>Créer, inspecter et exporter des patchs SVG 320×160.</small>
          </button>

          {/* Éditeur de patchs son */}
          <button type="button" className="service-tool-card" onClick={() => onOpenLocal("sounds")}>
            <Icon name="wave" size={22} />
            <strong>Éditeur de patchs son</strong>
            <small>Analyser WAV/AIFF, lire les métadonnées OP‑1 et préparer un AIFF local.</small>
          </button>

          {/* Préparation firmware */}
          <button type="button" className="service-tool-card" onClick={() => onOpenLocal("firmware")}>
            <Icon name="archive" size={22} />
            <strong>Préparation firmware</strong>
            <small>Vérifier un fichier local et produire un plan contrôlé sans écriture automatique.</small>
          </button>
        </div>
      </section>

      <section className="service-catalog" aria-labelledby="service-catalog-title">
        <div className="mod-section-heading">
          <div>
            <span className="section-label">CATALOGUE DE SOURCES</span>
            <strong id="service-catalog-title">Services externes référencés</strong>
          </div>
          <small>Import manuel uniquement</small>
        </div>
        <div className="service-catalog-grid">
          {sources.map((source) => (
            <article className="service-catalog-card" key={source.id}>
              <div>
                <span className="service-kind">{source.kind === "official" ? "OFFICIEL" : source.kind === "community-service" ? "COMMUNAUTAIRE" : "OUTIL"}</span>
                <h3>{source.name}</h3>
              </div>
              <p>{source.notes ?? "Source référencée pour découverte et import explicite."}</p>
              <small>Contenu : {source.contentKinds.join(" · ")}<br />Licence : {source.license}</small>
              {source.url ? (
                <a className="secondary-action service-open-link" href={source.url} target="_blank" rel="noreferrer">
                  Ouvrir le service
                </a>
              ) : (
                <span className="tool-note">Source locale uniquement</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <p className="tool-note service-safety-note">
        <Icon name="book" size={14} /> Les services externes ne sont ni scrapés ni synchronisés automatiquement. Vérifiez la licence et l’origine de chaque fichier avant import dans la bibliothèque locale.
      </p>
    </div>
  );
}
