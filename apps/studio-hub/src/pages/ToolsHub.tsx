"use client";
import { useState, useEffect } from "react";
import { readProfileName } from "../core/profile";
import { AppShell, Card, PageHeader, StatusBadge } from "../ui";
import "./outils.css";

const Link = ({href, className, ...props}: {href: string; className: string; [key: string]: any}) => {
  const handleClick = (e: any) => {
    e.preventDefault();
    if (href === "/") (window as any).navigateMaquette("landing");
  };
  return <a href={"#" + href} onClick={handleClick} className={className} {...props}/>;
};

/**
 * Un outil du rack principal.
 *
 * Le rack rendait DEUX systemes en parallele : ce tableau, et neuf cartes
 * ecrites a la main dans le JSX. Ils produisaient exactement le meme balisage,
 * mais l'un lisait des donnees et l'autre avait les valeurs recopiees — d'ou
 * un filtre de quatorze exclusions pour eviter les doublons, des onglets de
 * section impossibles a rebrancher, et une carte capable de contredire les
 * metadonnees de son propre outil. C'est arrive : celle du rack audio annoncait
 * deux moteurs qui n'existaient pas.
 *
 * Une seule source, desormais. Le regroupement devient une DONNEE (`groupe`)
 * au lieu d'un filtre tenu a la main.
 */
type Groupe = "reglages" | "documentation" | "formation" | "son";

/** Ce que fait un clic. Explicite, parce que les neuf cartes ne faisaient pas toutes la meme chose. */
type Action =
  | { type: "page"; page: string }
  /** Ouvre le panneau qui liste les membres de ce groupe. */
  | { type: "groupe"; groupe: Groupe }
  /** Fait defiler jusqu'a une ancre de la page. */
  | { type: "ancre"; ancre: string }
  /** Ouvre l'editeur sonore, qui n'est pas une page mais un panneau. */
  /** Dernier recours : une fiche descriptive. Un outil qui en depend n'est pas encore branche. */
  | { type: "fiche" };

type Tool = {
  id: string;
  code: string;
  category: string;
  title: string;
  text: string;
  accent: string;
  visual: string;
  status: string;
  action: Action;
  section: Section;
  /** Membre d'un groupe : s'affiche dans son panneau, pas comme carte. */
  groupe?: Groupe;
  /** Liseré de couleur en haut de la carte. */
  couleur?: string;
  /** Photo de machine : la seule chose que les cartes en dur savaient faire en plus. */
  image?: { src: string; alt: string; tag: string; bouton: string; boutonClasse: string };
  /** Le statut affiche le nombre de membres de ce groupe. */
  compteurDe?: Groupe;
  /** Nettoie l'URL avant de naviguer (le studio EP-133 lit `?hubTool=`). */
  nettoieUrl?: boolean;
  /** Ecrit `?hubTool=<id>` avant de naviguer. */
  passeHubTool?: boolean;
  /**
   * Ecrit `?hubTool=<valeur>` — quand la vue visee ne porte pas le nom de la
   * carte.
   *
   * `passeHubTool` envoie l'identifiant de l'outil, ce qui marche tant que les
   * deux coincident. « Exercices EP-133 » vise la vue `game` du studio : sans
   * ce champ, elle enverrait `?hubTool=rhythm`, que le studio ne reconnait pas
   * — et retomberait sur son comportement par defaut, c'est-a-dire l'editeur.
   */
  hubTool?: string;
};

type Section = "hub" | "op1" | "ep133" | "all";

const STUDIO_URLS={op1:import.meta.env.VITE_OP1_URL||"#",ep133:import.meta.env.VITE_EP133_URL||"#",hub:import.meta.env.VITE_HUB_URL||"#"};

const tools: Tool[] = [
  // ── Machines ──────────────────────────────────────────────────────────
  {
    id: "studio-op1", code: "OP-1", category: "MACHINE", title: "🎹 OP-1 Studio",
    text: "Tous les outils pour créer, éditer et gérer vos projets OP-1 (Synth, Tape, Drum & Backup).",
    accent: "op1-studio-card", visual: "wave", status: "OUVRIR STUDIO OP-1 →",
    action: { type: "page", page: "studio-op1" }, section: "op1", nettoieUrl: true,
    image: { src: "/media/op1.jpeg", alt: "OP-1 Machine", tag: "OP-1", bouton: "OUVRIR STUDIO OP-1 →", boutonClasse: "op1-btn" },
  },
  {
    id: "studio-ep133", code: "K.O. II", category: "MACHINE", title: "🥁 EP-133 Studio",
    text: "Tous les outils pour composer, performer et contrôler votre EP-133.",
    accent: "ep133-studio-card", visual: "wave", status: "OUVRIR STUDIO EP-133 →",
    action: { type: "page", page: "studio-ep133" }, section: "ep133", nettoieUrl: true,
    image: { src: "/media/ep133.jpeg", alt: "EP-133 K.O. II Machine", tag: "K.O. II", bouton: "OUVRIR STUDIO EP-133 →", boutonClasse: "ep133-btn primary" },
  },

  // ── Cartes principales ────────────────────────────────────────────────
  {
    id: "vault", code: "SAVE-ALL", category: "COFFRE", title: "💾 Sauvegarde",
    text: "Snapshots OP-1 et EP-133, vérification SHA-256 et restauration contrôlée.",
    accent: "save-card", visual: "grid", status: "OUVRIR →",
    action: { type: "page", page: "backup-lab" }, section: "hub",
  },
  {
    id: "labo", code: "LABO-SON", category: "CRÉATION SONORE", title: "🧪 Labo — création de son",
    text: "Tout pour fabriquer un son : quinze moteurs superposables, effets, enveloppe, patches OP-1 et EP-133, bibliothèque et fabrication d’échantillons.",
    accent: "audio-plugin-card", visual: "wave", status: "OUVRIR →",
    action: { type: "page", page: "audio-plugin-rack" }, section: "hub", couleur: "#d9ff43",
  },
  {
    id: "son", code: "SOUND", category: "AUDIO", title: "🎵 Bibliothèque sonore",
    text: "Catalogue, préparation, favoris, doublons et accès aux workflows OP-1 / EP-133.",
    accent: "sound-card", visual: "wave", status: "OUVRIR →",
    action: { type: "page", page: "sound-library" }, section: "hub",
  },  {
    id: "reglages", code: "CONFIG", category: "CONFIGURATION", title: "⚙️ Réglages",
    text: "Synchronisation MIDI et arpégiateur, tests de machine, diagnostic système.",
    accent: "settings-card", visual: "sync", status: "OPTIONS",
    action: { type: "groupe", groupe: "reglages" }, section: "hub", compteurDe: "reglages",
  },
  {
    id: "docs", code: "DOC-ALL", category: "RÉFÉRENCES", title: "📖 Documentation",
    text: "Guides OP-1, EP-133, exercices et jeux d’entraînement — tout en un seul endroit.",
    accent: "docs-card", visual: "pixels", status: "RESSOURCES",
    action: { type: "ancre", ancre: "hub-documentation" }, section: "hub", compteurDe: "documentation",
  },
  {
    id: "apprendre", code: "LEARN-ALL", category: "FORMATION", title: "📚 Apprendre",
    text: "Exercices OP-1, Rhythm Hero et jeux d’entraînement pour progresser.",
    accent: "learn-card", visual: "pads", status: "PROGRAMMES",
    action: { type: "groupe", groupe: "formation" }, section: "hub", compteurDe: "formation",
  },
  {
    id: "image", code: "PX-320", category: "CRÉATION", title: "Éditeur d’image",
    text: "Écrans et thèmes OP-1 au format exact 320 × 160.",
    accent: "purple", visual: "pixels", status: "OUVRIR →",
    action: { type: "page", page: "image-editor-op1" }, section: "hub",
  },
  {
    id: "firmware", code: "FW-243", category: "OP-1", title: "Firmware Lab",
    text: "Catalogue, vérification et préparation locale des mods OP-1.",
    accent: "yellow", visual: "chip", status: "OUVRIR →",
    action: { type: "page", page: "firmware-lab" }, section: "op1",
  },
  // « Éditeur de samples » (OP-1) et « Sons & transferts EP-133 » vivaient ici,
  // rangés dans un groupe « son ». `cartes()` filtrant `!t.groupe`, un membre de
  // groupe ne s'affiche pas dans la grille : il n'est atteignable que par la
  // carte qui ouvre son groupe. Or rien n'ouvre « son » — ni panneau de groupe,
  // ni étagère. Les deux étaient donc invisibles, et menaient de toute façon à
  // `sound-library`, comme la carte « Bibliothèque sonore » juste au-dessus.
  // L'éditeur vit maintenant dans l'onglet « Éditeur & préparation » de cette
  // page. RackPrincipal.test.ts dérive l'invariant et attrapera le prochain.

  // ── Membres du groupe « Réglages » ────────────────────────────────────
  {
    id: "midi", code: "24-PPQN", category: "TRANSPORT", title: "Synchronisation MIDI",
    text: "Tempo, Start, Stop, notes virtuelles, arpégiateur, 30 gammes, contrôleur OP-1 et PANIC.",
    accent: "cyan", visual: "grid", status: "OUVRIR →",
    action: { type: "page", page: "midi-settings" }, section: "hub", groupe: "reglages",
  },
  {
    id: "op-settings", code: "GRID", category: "CONFIGURATION", title: "Réglages OP-1",
    text: "Le clavier joué et son mode config : assigner chaque contrôle par la machine.",
    accent: "yellow", visual: "grid", status: "OUVRIR →",
    action: { type: "page", page: "op1-settings" }, section: "hub", groupe: "reglages",
  },
  {
    id: "machine-test", code: "SYSEX-01", category: "DIAGNOSTIC", title: "Test machine EP-133",
    text: "Observer MIDI/SysEx, groupes actifs et communication aller-retour.",
    accent: "orange", visual: "chip", status: "OUVRIR →",
    action: { type: "page", page: "studio-ep133" }, section: "ep133", groupe: "reglages", passeHubTool: true,
  },

  // ── Membres du groupe « Apprendre » ───────────────────────────────────
  {
    id: "op1-exercise", code: "KEY-01", category: "TRAINING LAB", title: "Exercices OP-1",
    text: "24 touches · notes alignées · aucun changement d’octave.",
    accent: "yellow", visual: "grid", status: "S’ENTRAÎNER →",
    action: { type: "page", page: "exercises" }, section: "op1", groupe: "formation",
    image: { src: "/media/op1.jpeg", alt: "Teenage Engineering OP-1", tag: "OP-1", bouton: "S’ENTRAÎNER →", boutonClasse: "op1-btn" },
  },
  {
    id: "rhythm", code: "PAD-12", category: "TRAINING LAB", title: "Exercices EP-133",
    text: "12 pads · patterns animés · entraînement Rhythm Hero.",
    accent: "orange", visual: "grid", status: "S’ENTRAÎNER →",
    // Vise la vue JEU du studio, pas son editeur. Sans `hubTool`, cette carte
    // et « EP-133 Studio » atterrissaient au meme endroit : deux portes, une
    // seule destination, et le jeu invisible sous l'editeur.
    action: { type: "page", page: "studio-ep133" }, section: "ep133", groupe: "formation", hubTool: "game",
    image: { src: "/media/ep133.jpeg", alt: "Teenage Engineering EP-133 K.O. II", tag: "EP-133 K.O. II", bouton: "S’ENTRAÎNER →", boutonClasse: "ep133-btn" },
  },

  // ── Membres du groupe « Documentation » ───────────────────────────────
  {
    id: "op1-docs", code: "DOC-OP1", category: "DOCUMENTATION", title: "Documentation OP-1",
    text: "Procédures, formats, connexions et limites vérifiées.",
    accent: "yellow", visual: "pixels", status: "LIRE →",
    action: { type: "page", page: "doc-op1" }, section: "op1", groupe: "documentation",
  },
  {
    id: "ep-docs", code: "DOC-KOII", category: "DOCUMENTATION", title: "Documentation EP-133",
    text: "Guides Studio, formats, MIDI et procédures machine vérifiées.",
    accent: "orange", visual: "pixels", status: "LIRE →",
    action: { type: "page", page: "doc-ep133" }, section: "ep133", groupe: "documentation",
  },
  {
    id: "documentation", code: "DOC-HUB", category: "DOCUMENTATION", title: "Centre documentaire",
    text: "Vue d’ensemble des ressources, procédures et repères du dépôt.",
    accent: "cyan", visual: "pixels", status: "LIRE →",
    action: { type: "page", page: "documentation" }, section: "hub", groupe: "documentation",
  },
  {
    id: "app-guide", code: "APP-01", category: "DOCUMENTATION", title: "Guide Engineering Studio",
    text: "Comment naviguer, créer votre profil, organiser votre atelier.",
    accent: "cyan", visual: "pixels", status: "LIRE →",
    action: { type: "page", page: "documentation" }, section: "hub", groupe: "documentation",
  },
];

/** Les cartes du rack : tout ce qui n'appartient pas à un groupe. */
const cartes = (section: Section) =>
  tools.filter((t) => !t.groupe && (section === "all" || t.section === section));

const membres = (groupe: Groupe) => tools.filter((t) => t.groupe === groupe);

export default function ToolsHub(){
 const [selected,setSelected]=useState<Tool|null>(null);
 const [groupeOuvert,setGroupeOuvert]=useState<Groupe|null>(null);
 const [profileName,setProfileName]=useState("NOUVEAU MEMBRE");

 useEffect(()=>{ setProfileName(readProfileName()); },[]);

 const scrollToDocumentation = () =>
   document.getElementById("hub-documentation")?.scrollIntoView({ behavior: "smooth", block: "start" });

 /**
  * Un seul chemin d'ouverture, decrit par la donnee.
  *
  * `openTool` etait une cascade de quinze `if` sur des identifiants, ou deux
  * branches n'etaient jamais atteintes parce qu'un cas plus haut captait deja
  * l'outil. Ici, l'action est portee par l'outil : il n'y a plus d'ordre a
  * respecter, donc plus de branche morte possible.
  */
 function ouvrir(tool: Tool){
  const naviguer = (page: string) => {
   if (tool.hubTool) window.history.replaceState(null, "", `?hubTool=${tool.hubTool}`);
   else if (tool.passeHubTool) window.history.replaceState(null, "", `?hubTool=${tool.id}`);
   else if (tool.nettoieUrl) window.history.replaceState(null, "", window.location.pathname);
   (window as any).navigateMaquette(page);
  };
  switch (tool.action.type) {
   case "page": naviguer(tool.action.page); return;
   case "groupe": setGroupeOuvert(tool.action.groupe); return;
   case "ancre": document.getElementById(tool.action.ancre)?.scrollIntoView({ behavior: "smooth", block: "start" }); return;
   case "fiche": setSelected(tool); return;
  }
 }

 const visibles = cartes("all");

 return <AppShell activePage="outils" profileName={profileName} onDocClick={scrollToDocumentation} className="hub-page">
  <PageHeader
   eyebrow="ENGINEERING STUDIO · HUB"
   title={<>Choisir.<br/><em>Créer.</em></>}
   description="Deux machines en tête, les outils de production ensuite, les utilitaires à la fin. Chaque carte mène à une fonction réelle."
   status={<StatusBadge tone="test">Atelier expérimental</StatusBadge>}
  />

  {/* Les onglets de section : declares depuis le debut, jamais rendus, et
      inutilisables tant que les vrais outils vivaient dans des cartes ecrites
      a la main. Ils ont un sens maintenant que chaque outil porte sa section. */}

  <section className="tools-section-organized" aria-label="Outils organisés">
   <div className="utility-grid">
    {visibles.map(tool => (
     <CarteOutil key={tool.id} tool={tool} onOuvrir={()=>ouvrir(tool)} />
    ))}
   </div>
   <DocumentationShelf docs={membres("documentation")} onSelectTool={ouvrir} />
  </section>

    {selected&&<Modal tool={selected} onClose={()=>setSelected(null)}/>}
  {groupeOuvert==="formation"&&<TrainingModal training={membres("formation")} onClose={()=>setGroupeOuvert(null)} onSelectTool={(t)=>{setGroupeOuvert(null);ouvrir(t);}}/>}
  {groupeOuvert==="reglages"&&<SettingsModal settings={membres("reglages")} onClose={()=>setGroupeOuvert(null)} onSelectTool={(t)=>{setGroupeOuvert(null);ouvrir(t);}}/>}
 </AppShell>
}

/**
 * La carte, rendue une seule fois pour tous les outils.
 *
 * Neuf cartes ecrites a la main produisaient exactement ce balisage, valeurs
 * recopiees. La photo de machine etait la seule chose que le rendu pilote par
 * donnees ne savait pas faire — c'est maintenant un champ.
 */
function CarteOutil({tool,onOuvrir}:{tool:Tool;onOuvrir:()=>void}){
 const statut = tool.compteurDe ? `${membres(tool.compteurDe).length} ${tool.status}` : tool.status;

 if (tool.image) {
  return <Card
   variant="machine"
   className={`utility-card machine-image-card ${tool.accent}`}
   onActivate={onOuvrir}
   accessibleName={`Ouvrir ${tool.title}`}
   footer={<span>{tool.image.bouton}</span>}
  >
   <div className="machine-header-tag">
    <span>{tool.image.tag}</span>
    <small>TEENAGE ENGINEERING</small>
   </div>
   <div className="machine-image-wrapper">
    <img src={tool.image.src} alt={tool.image.alt} className="machine-card-image" referrerPolicy="no-referrer"/>
   </div>
   <h3>{tool.title}</h3>
   <p>{tool.text}</p>
  </Card>;
 }

 return <Card
  variant="tool"
  className={`utility-card ${tool.accent}`}
  onActivate={onOuvrir}
  accessibleName={`Ouvrir ${tool.title}`}
  footer={<span className="tool-status">{statut}</span>}
 >
  <span>{tool.code}</span>
  <ToolGraphic type={tool.visual}/>
  <small>{tool.category}</small>
  <h3>{tool.title}</h3>
  <p>{tool.text}</p>
 </Card>;
}

function SettingsModal({settings,onClose,onSelectTool}:{settings:Tool[];onClose:()=>void;onSelectTool:(t:Tool)=>void}){
 return <div className="settings-modal-backdrop" onClick={onClose}>
  <section className="settings-modal" onClick={e=>e.stopPropagation()}>
   <button className="settings-modal-close" onClick={onClose}>✕</button>
   <div className="settings-modal-header">
    <h2>⚙️ RÉGLAGES & DIAGNOSTIC</h2>
    <p>Configuration, synchronisation et tests systèmes</p>
   </div>
   <div className="settings-grid">
    {settings.map(setting => (
     <button key={setting.id} className={`settings-card-item ${setting.accent}`} onClick={()=>onSelectTool(setting)}>
      <ToolGraphic type={setting.visual}/>
      <h3>{setting.title}</h3>
      <small>{setting.category}</small>
      <p>{setting.text}</p>
      <div className="settings-status">{setting.status}</div>
     </button>
    ))}
   </div>
  </section>
 </div>
}

function TrainingModal({training,onClose,onSelectTool}:{training:Tool[];onClose:()=>void;onSelectTool:(t:Tool)=>void}){
 return <div className="training-modal-backdrop" onClick={onClose}>
  <section className="training-modal" onClick={e=>e.stopPropagation()}>
   <button className="training-modal-close" onClick={onClose}>✕</button>
   <div className="training-modal-header">
    <h2>APPRENDRE & S’ENTRAÎNER</h2>
    <p>Choisissez votre machine.</p>
   </div>
   <div className="training-grid">
    {training.map(course => (
     <button key={course.id} className={`training-card-item ${course.accent}`} onClick={()=>onSelectTool(course)}>
      {course.image&&<div className={`training-machine-preview training-machine-${course.section}`}>
       <img src={course.image.src} alt={course.image.alt}/>
       <span>{course.image.tag}</span>
      </div>}
      <h3>{course.title}</h3>
      <p>{course.text}</p>
      <div className="training-status">{course.status}</div>
     </button>
    ))}
   </div>
  </section>
 </div>
}

function DocumentationShelf({docs,onSelectTool}:{docs:Tool[];onSelectTool:(t:Tool)=>void}){
 return <section id="hub-documentation" className="hub-documentation" aria-labelledby="hub-documentation-title">
  <div className="hub-documentation-heading">
   <div><span>02 · RÉFÉRENCES CENTRALES</span><h2 id="hub-documentation-title">Documentation & repères</h2></div>
   <p>Tout ce qui explique l’atelier est rangé ici. Les ressources restent liées à leur machine ou au Hub pour éviter les doublons.</p>
  </div>
  <div className="hub-documentation-grid">
   {docs.map(doc => <button key={doc.id} className={`hub-documentation-card ${doc.accent}`} onClick={() => onSelectTool(doc)}>
    <div className="hub-documentation-card-top"><span>{doc.code}</span><small>{doc.status}</small></div>
    <ToolGraphic type={doc.visual}/>
    <small className="hub-documentation-category">{doc.id === "op1-docs" ? "OP-1" : doc.id === "ep-docs" ? "EP-133" : "HUB"}</small>
    <h3>{doc.title}</h3>
    <p>{doc.text}</p>
    <strong>OUVRIR LA RESSOURCE →</strong>
   </button>)}
  </div>
 </section>
}

function Modal({tool,onClose}:{tool:Tool;onClose:()=>void}){return <div className="hub-modal-backdrop" onClick={onClose}><section className={`hub-modal ${tool.accent}`} onClick={e=>e.stopPropagation()}><button className="hub-modal-close" onClick={onClose}>×</button><span>{tool.code} · {tool.category}</span><ToolGraphic type={tool.visual}/><h2>{tool.title}</h2><p>{tool.text}</p><div>PAGE OUTIL · PROCHAINE INTÉGRATION</div><button onClick={onClose}>RETOUR AU HUB</button></section></div>}
/**
 * Le visuel d'une carte.
 *
 * `chip` affiche « 243 » — la version du firmware OP-1. C'etait aussi le REPLI
 * pour tout type non reconnu, si bien que quatre cartes du rack affichaient ce
 * nombre : sur « Sauvegarde » et « Reglages », il ne veut rien dire. Le repli
 * est desormais neutre, et `grid`, utilise par plusieurs outils, a enfin son
 * propre rendu.
 */
function ToolGraphic({type}:{type:string}){
 if(type==="pads")return <div className="hub-graphic pads-g">{Array.from({length:12},(_,i)=><i key={i}/>)}</div>;
 if(type==="pixels")return <div className="hub-graphic pixels-g">{Array.from({length:40},(_,i)=><i key={i} className={[3,4,10,14,17,22,25,31,34].includes(i)?"on":""}/>)}</div>;
 if(type==="wave")return <div className="hub-graphic wave-g">{[20,48,80,35,66,92,42,73,28,57,84].map((v,i)=><i key={i} style={{height:`${v}%`}}/>)}</div>;
 if(type==="game")return <div className="hub-graphic game-g"><i/><i/><b/><i/><i/></div>;
 if(type==="sync")return <div className="hub-graphic sync-g"><span>OP-1</span><i/><b>24</b><i/><span>KO II</span></div>;
 if(type==="grid")return <div className="hub-graphic grid-g">{Array.from({length:16},(_,i)=><i key={i} className={[0,2,5,7,8,10,13,15].includes(i)?"on":""}/>)}</div>;
 if(type==="chip")return <div className="hub-graphic chip-g"><span>243</span></div>;
 // Repli neutre : un type inconnu ne doit pas afficher le numero de firmware.
 return <div className="hub-graphic pixels-g">{Array.from({length:40},(_,i)=><i key={i} className={i%7===0?"on":""}/>)}</div>;
}
