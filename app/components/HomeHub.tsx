import type { ReactNode } from "react";

type HubIcon = (props: { name: "chip" | "archive" | "wave" | "tape" | "image" | "settings" | "book"; size?: number }) => ReactNode;

type HubModule = {
  id: string;
  title: string;
  description: string;
  requirement: "SANS MACHINE" | "OP-1 REQUIS";
  icon: Parameters<HubIcon>[0]["name"];
};

const modules: HubModule[] = [
  { id: "editor", title: "Firmware", description: "Préparer une mise à jour et sélectionner les mods locaux.", requirement: "SANS MACHINE", icon: "chip" },
  { id: "backups", title: "Sauvegardes", description: "Vérifier, organiser et préparer une copie de la machine.", requirement: "OP-1 REQUIS", icon: "archive" },
  { id: "sounds", title: "Sons", description: "Classer les samples et préparer des packs à transférer.", requirement: "SANS MACHINE", icon: "wave" },
  { id: "tape", title: "Studio", description: "Créer des pistes avec le clone local ou l’OP-1 en MIDI.", requirement: "SANS MACHINE", icon: "tape" },
  { id: "graphics", title: "Images", description: "Explorer les écrans du firmware et préparer des variantes.", requirement: "SANS MACHINE", icon: "image" },
  { id: "exercise", title: "Exercices", description: "Travailler les suites d’accords avec un retour MIDI.", requirement: "OP-1 REQUIS", icon: "settings" },
  { id: "docs", title: "Documentation", description: "Retrouver les règles et les procédures de l’atelier.", requirement: "SANS MACHINE", icon: "book" },
];

export function HomeHub({ Icon, onOpen }: { Icon: HubIcon; onOpen: (id: string) => void }) {
  return (
    <div className="content home-content">
      <div className="page-heading home-heading">
        <div>
          <span className="eyebrow"><Icon name="chip" size={16} /> OP-1 STUDIO / ACCUEIL</span>
          <h1>Votre atelier OP-1.</h1>
          <p>Choisissez un module pour préparer, créer et vérifier vos contenus.</p>
        </div>
      </div>
      <section className="home-module-grid" aria-label="Modules OP-1 Studio">
        {modules.map((module) => (
          <button type="button" className="home-module-card" key={module.id} onClick={() => onOpen(module.id)}>
            <span className="home-module-icon"><Icon name={module.icon} size={22} /></span>
            <span className="home-module-copy"><strong>{module.title}</strong><small>{module.description}</small></span>
            <span className={`home-module-requirement ${module.requirement === "OP-1 REQUIS" ? "is-required" : ""}`}>{module.requirement}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
