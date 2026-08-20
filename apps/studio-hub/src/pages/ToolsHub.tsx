"use client";
import { useState, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { readProfileName } from "../core/profile";
import SoundEditorHub from "./SoundEditorHub";
import "./outils.css";

const Link = ({href, className, ...props}: {href: string; className: string; [key: string]: any}) => {
  const handleClick = (e: any) => {
    e.preventDefault();
    if (href === "/") (window as any).navigateMaquette("landing");
  };
  return <a href={"#" + href} onClick={handleClick} className={className} {...props}/>;
};

type Tool={id:string;code:string;category:string;title:string;text:string;accent:string;visual:string;status:string;target?:"op1"|"ep133"|"hub";anchor?:string;section?:"hub"|"op1"|"ep133"};
type Section="hub"|"op1"|"ep133"|"all";

const STUDIO_URLS={op1:import.meta.env.VITE_OP1_URL||"#",ep133:import.meta.env.VITE_EP133_URL||"#",hub:import.meta.env.VITE_HUB_URL||"#"};
const tools:Tool[]=[
 {id:"firmware",code:"FW-243",category:"OP-1",title:"Firmware Lab",text:"Catalogue, vérification et préparation locale des mods OP-1.",accent:"yellow",visual:"chip",status:"SANS MACHINE",section:"op1",target:"op1"},
 {id:"op1-backup",code:"BKP-OP1",category:"SAUVEGARDE",title:"Sauvegarde OP-1",text:"Tape, Album, Drum et Synth avec manifeste et contrôle d’intégrité.",accent:"blue",visual:"chip",status:"OP-1 REQUIS",section:"op1",target:"op1"},
 {id:"sample",code:"WAV-AIFF",category:"SON",title:"Éditeur de samples",text:"Waveform, trim, fondus et préparation des packs OP-1.",accent:"cyan",visual:"wave",status:"LOCAL",section:"op1",target:"op1"},
 {id:"tape",code:"TAPE-04",category:"STUDIO",title:"Tape & Album Studio",text:"Quatre pistes, transport, mixage, stems et Album en mode local.",accent:"blue",visual:"wave",status:"MIDI",section:"op1",target:"op1"},
 {id:"image",code:"PX-320",category:"CRÉATION",title:"Éditeur d’image",text:"Écrans et thèmes OP-1 au format exact 320 × 160.",accent:"purple",visual:"pixels",status:"SANS MACHINE",section:"hub",target:"hub"},
 {id:"services",code:"OP1-LAB",category:"OP-1",title:"Services OP-1",text:"Patchs son, ressources référencées et outils de préparation.",accent:"yellow",visual:"chip",status:"LOCAL",section:"op1",target:"op1"},
 {id:"op1-exercise",code:"KEY-01",category:"TRAINING LAB",title:"Exercices OP-1",text:"Suites d’accords, clavier et retour MIDI pour progresser.",accent:"green",visual:"game",status:"OP-1 REQUIS",section:"hub",target:"op1"},
 {id:"op1-docs",code:"DOC-OP1",category:"DOCUMENTATION",title:"Documentation OP-1",text:"Procédures, formats, connexions et limites vérifiées.",accent:"purple",visual:"pixels",status:"LECTURE",section:"hub",target:"hub",anchor:"documentation"},
 {id:"pattern",code:"PAT-SONG",category:"STUDIO",title:"Pattern & Song Studio",text:"Groupes A/B/C/D, patterns, scènes et positions Song EP-133.",accent:"orange",visual:"pads",status:"ÉDITEUR COMPLET",section:"ep133",target:"ep133"},
 {id:"sounds",code:"PAD-64",category:"SON",title:"Sons & transferts EP-133",text:"Banques, réglages de pads, clone et transferts préparés.",accent:"pink",visual:"pads",status:"64 / 128 MO",section:"ep133",target:"ep133"},
 {id:"machine-test",code:"SYSEX-01",category:"DIAGNOSTIC",title:"Test machine EP-133",text:"Observer MIDI/SysEx, groupes actifs et communication aller-retour.",accent:"yellow",visual:"sync",status:"LECTURE SÛRE",section:"ep133",target:"ep133"},
 {id:"rhythm",code:"GAME-01",category:"TRAINING LAB",title:"Rhythm Hero",text:"Styles, niveaux, BPM, partitions animées, scores et progression aux pads.",accent:"green",visual:"game",status:"MIDI",section:"ep133",target:"ep133"},
 {id:"ep-docs",code:"DOC-KOII",category:"DOCUMENTATION",title:"Documentation EP-133",text:"Guides Studio, formats, MIDI et procédures machine vérifiées.",accent:"orange",visual:"pixels",status:"FR · EN · ES",section:"hub",target:"hub",anchor:"documentation"},
 {id:"op-settings",code:"GRID",category:"CONFIGURATION",title:"Réglages OP-1",text:"Le clavier joué et son mode config : assigner chaque contrôle par apprentissage.",accent:"green",visual:"sync",status:"OP-1",section:"hub",target:"hub"},
 {id:"midi",code:"24-PPQN",category:"TRANSPORT",title:"Synchronisation MIDI",text:"Tempo, Start, Stop, notes virtuelles, contrôleur OP-1 et PANIC communs.",accent:"blue",visual:"sync",status:"2 MACHINES",section:"hub",target:"hub"},
 {id:"library",code:"SOUND-V1",category:"OUTIL DU HUB",title:"Bibliothèque sonore",text:"Catalogue commun avec import, recherche, tags, favoris, préécoute et détection de doublons.",accent:"cyan",visual:"wave",status:"LOCAL",section:"hub",target:"hub",anchor:"sound-library"},
 {id:"vault",code:"VAULT-01",category:"OUTIL DU HUB",title:"Sauvegarde machine",text:"Snapshots sélectifs, vérification SHA-256 et restauration contrôlée.",accent:"yellow",visual:"chip",status:"SHA-256",section:"hub",target:"hub",anchor:"atelier-vault"},
 {id:"app-guide",code:"APP-01",category:"DOCUMENTATION",title:"Guide Engineering Studio",text:"Comment naviguer, créer votre profil, organiser votre atelier et maîtriser tous les outils.",accent:"purple",visual:"pixels",status:"GUIDE COMPLET",section:"hub"},
];

const sections:Array<{id:Section;label:string;emoji:string}> = [
 {id:"hub",label:"HUB CENTRAL",emoji:"🔗"},
 {id:"op1",label:"OP-1 STUDIO",emoji:"🎹"},
 {id:"ep133",label:"EP-133 STUDIO",emoji:"🥁"},
 {id:"all",label:"TOUS LES OUTILS",emoji:"📦"},
];

export default function ToolsHub(){
 const [selected,setSelected]=useState<Tool|null>(null);
 const [activeSection,setActiveSection]=useState<Section>("all");
 const [showDocs,setShowDocs]=useState(false);
 const [showSave,setShowSave]=useState(false);
 const [showTraining,setShowTraining]=useState(false);
 const [showSettings,setShowSettings]=useState(false);
 const [showSound,setShowSound]=useState(false);
 const [showSoundEditor,setShowSoundEditor]=useState(false);
 const [showOP1Studio,setShowOP1Studio]=useState(false);
 const [showEP133Studio,setShowEP133Studio]=useState(false);
 const [profileName,setProfileName]=useState("NOUVEAU MEMBRE");

 useEffect(()=>{ setProfileName(readProfileName()); },[]);

 const docTools = tools.filter(t => t.category === "DOCUMENTATION");
 const trainingTools = tools.filter(t => t.category === "TRAINING LAB");
 const settingsTools = tools.filter(t => t.id === "machine-test" || t.id === "midi" || t.id === "op-settings");
 const soundTools = tools.filter(t => t.id === "tape" || t.id === "sounds" || t.id === "sample" || t.id === "library");
 const op1StudioTools = tools.filter(t => t.id === "services");
 const ep133StudioTools = tools.filter(t => t.id === "pattern");
 function openTool(tool:Tool){
  if(tool.id==="op1-docs"){(window as any).navigateMaquette("doc-op1");return}
  if(tool.id==="ep-docs"){(window as any).navigateMaquette("doc-ep133");return}
  if(tool.id==="op-settings"){
   (window as any).navigateMaquette("op1-settings");
   return;
  }
  if(tool.id==="midi"){
   // Sans ce cas, l'entrée retombait sur setSelected() et n'ouvrait qu'une
   // modale descriptive : le panneau MidiSyncPanel n'était jamais monté.
   (window as any).navigateMaquette("midi-settings");
   return;
  }
  if(tool.id==="machine-test"){
   window.history.replaceState(null, '', '?hubTool=machine-test');
   (window as any).navigateMaquette("studio-ep133");
   return;
  }
  if(tool.id==="vault" || tool.id==="op1-backup"){
   (window as any).navigateMaquette("backup-lab");
   return;
  }
  if(tool.id==="pattern"){
   window.history.replaceState(null, '', window.location.pathname);
   (window as any).navigateMaquette("studio-ep133");
   return;
  }
  if(tool.id==="services" || tool.id==="op1-backup" || tool.id==="tape"){(window as any).navigateMaquette("studio-op1");return}
  if(tool.id==="image"){(window as any).navigateMaquette("image-editor-op1");return}
  if(tool.id==="firmware"){(window as any).navigateMaquette("firmware-lab");return}
  if(tool.id==="rhythm"){(window as any).navigateMaquette("rhythm-hero");return}
  if(tool.id==="op1-exercise"){(window as any).navigateMaquette("exercises");return}
  if(tool.id==="sample" || tool.id==="tape" || tool.id==="sounds"){(window as any).navigateMaquette("sound-editor");return}
  if(tool.id==="app-guide"){(window as any).navigateMaquette("documentation");return}
  if(tool.anchor==="exercises"){(window as any).navigateMaquette("exercises");return}
  if(tool.category==="DOCUMENTATION"){(window as any).navigateMaquette("documentation");return}

  setSelected(tool);
 }
 // Filtre les outils mais enlève les outils en cadres spéciaux
 const filteredTools = (activeSection === "all" ? tools : tools.filter(t => t.section && t.section === activeSection))
   .filter(t => t.category !== "DOCUMENTATION" && t.category !== "SAUVEGARDE" && t.id !== "vault" && t.category !== "TRAINING LAB" && t.id !== "machine-test" && t.id !== "midi" && t.id !== "op-settings" && t.id !== "tape" && t.id !== "sounds" && t.id !== "sample" && t.id !== "library" && t.id !== "firmware" && t.id !== "services" && t.id !== "op1-backup" && t.id !== "pattern");

 const saveTools = tools.filter(t => t.id === "op1-backup" || t.id === "vault");
 return <main className="hub-page">
  <TopBar activePage="outils" profileName={profileName} onDocClick={()=>setShowDocs(!showDocs)}/>
  <section className="tools-section-organized" aria-label="Outils organisés">
   <div className="utility-grid">
    {/* === HAUT : CARTE MACHINE OP-1 === */}
    <div
     className="utility-card machine-image-card op1-studio-card"
     onClick={()=>{
      window.history.replaceState(null, '', window.location.pathname);
      (window as any).navigateMaquette("studio-op1");
     }}
     title="Ouvrir OP-1 Studio"
    >
     <div className="machine-header-tag">
      <span>OP-1</span>
      <small>TEENAGE ENGINEERING</small>
     </div>
     <div className="machine-image-wrapper">
      <img
       src="/media/op1.jpeg"
       alt="OP-1 Machine"
       className="machine-card-image"
       referrerPolicy="no-referrer"
      />
     </div>
     <h3>🎹 OP-1 Studio</h3>
     <p>Tous les outils pour créer, éditer et gérer vos projets OP-1 (Synth, Tape, Drum & Backup).</p>
     <div className="machine-card-actions">
      <button
       className="machine-btn op1-btn"
       onClick={(e)=>{
        e.stopPropagation();
        window.history.replaceState(null, '', window.location.pathname);
        (window as any).navigateMaquette("studio-op1");
       }}
      >
       OUVRIR STUDIO OP-1 →
      </button>
     </div>
    </div>

    {/* === HAUT : CARTE MACHINE EP-133 === */}
    <div
     className="utility-card machine-image-card ep133-studio-card"
     onClick={()=>{
      window.history.replaceState(null, '', window.location.pathname);
      (window as any).navigateMaquette("studio-ep133");
     }}
     title="Ouvrir EP-133 Studio"
    >
     <div className="machine-header-tag">
      <span>K.O. II</span>
      <small>TEENAGE ENGINEERING</small>
     </div>
     <div className="machine-image-wrapper">
      <img
       src="/media/ep133.jpeg"
       alt="EP-133 K.O. II Machine"
       className="machine-card-image"
       referrerPolicy="no-referrer"
      />
     </div>
     <h3>🥁 EP-133 Studio</h3>
     <p>Tous les outils pour composer, performer et contrôler votre EP-133.</p>
     <div className="machine-card-actions">
      <button
       className="machine-btn ep133-btn primary"
       onClick={(e)=>{
        e.stopPropagation();
        window.history.replaceState(null, '', window.location.pathname);
        (window as any).navigateMaquette("studio-ep133");
       }}
      >
       OUVRIR STUDIO EP-133 →
      </button>
     </div>
    </div>
    <button
     className="utility-card firmware-card"
     onClick={()=>{
      (window as any).navigateMaquette("firmware-gallery");
     }}
     title="Ouvrir le Firmware Lab & Compilateur OS OP-1"
     style={{ borderTop: "4px solid #ff3a5d" }}
    >
     <span>FW-LAB</span>
     <ToolGraphic type="chip"/>
     <small>MODS & OS OP-1</small>
     <h3>⚙️ Firmware Lab & Compilateur</h3>
     <p>Catalogue, vérification, thèmes, patchs graphiques et préparation de firmwares OP-1.</p>
     <div className="tool-status">OUVRIR →</div>
    </button>
    <button
     className="utility-card save-card"
     onClick={()=>{
      (window as any).navigateMaquette("backup-lab");
     }}
     title="Ouvrir Sauvegarde unifiée"
    >
     <span>SAVE-ALL</span>
     <ToolGraphic type="chip"/>
     <small>COFFRE</small>
     <h3>💾 Sauvegarde</h3>
     <p>Snapshots OP-1 et EP-133, vérification SHA-256 et restauration contrôlée.</p>
     <div className="tool-status">OUVRIR →</div>
    </button>
    <button
     className="utility-card sound-creator-card"
     onClick={()=>{
      (window as any).navigateMaquette("sound-patch-creator");
     }}
     title="Ouvrir le Créateur de Patches et Sound Design"
     style={{ borderTop: "4px solid #00ed95" }}
    >
     <span>PATCH-BUILD</span>
     <ToolGraphic type="wave"/>
     <small>SOUND DESIGN</small>
     <h3>🎛️ Édition & Création de Son</h3>
     <p>Fabriquez et façonnez des patches OP-1 (moteurs synthé) et des réglages pads EP-133.</p>
     <div className="tool-status">OUVRIR →</div>
    </button>
    <button
     className="utility-card audio-plugin-card"
     onClick={()=>{
      (window as any).navigateMaquette("audio-plugin-rack");
     }}
     title="Ouvrir le Rack Moteurs Audio & Plugins"
     style={{ borderTop: "4px solid #d9ff43" }}
    >
     <span>RACK-PLUGINS</span>
     <ToolGraphic type="chip"/>
     <small>MOTEURS SYNTHÉ</small>
     <h3>🔌 Rack Plugins & Moteurs Audio</h3>
     <p>Dexed FM (DX7), Moog 24dB Ladder, TB-303 Acid, NES 8-Bit Chiptune et Karplus-Strong.</p>
     <div className="tool-status">OUVRIR →</div>
    </button>

    {/* === CENTRE === */}
    <button
     className="utility-card sound-card"
     onClick={()=>setShowSoundEditor(true)}
     title="Cliquez pour accéder aux outils audio"
    >
     <span>SOUND</span>
     <ToolGraphic type="wave"/>
     <small>AUDIO</small>
     <h3>🎵 Son</h3>
     <p>Tape Studio, transferts, samples, bibliothèque sonore - tout pour créer et éditer.</p>
     <div className="tool-status">{soundTools.length} OUTILS</div>
    </button>
    <button
     className="utility-card settings-card"
     onClick={()=>setShowSettings(true)}
     title="Cliquez pour accéder aux réglages et configuration"
    >
     <span>CONFIG</span>
     <ToolGraphic type="sync"/>
     <small>CONFIGURATION</small>
     <h3>⚙️ Réglages</h3>
     <p>Synchronisation MIDI, tests de machine et diagnostic système.</p>
     <div className="tool-status">{settingsTools.length} OPTIONS</div>
    </button>
    {filteredTools.map(tool => (
     <button
      key={tool.id}
      className={`utility-card ${tool.accent}`}
      onClick={()=>openTool(tool)}
     >
      <span>{tool.code}</span>
      <ToolGraphic type={tool.visual}/>
      <small>{tool.category}</small>
      <h3>{tool.title}</h3>
      <p>{tool.text}</p>
      <div className="tool-status">{tool.status}</div>
     </button>
    ))}

    {/* === BAS === */}
    <button
     className="utility-card docs-card"
     onClick={()=>setShowDocs(true)}
     title="Cliquez pour voir toutes les documentations et guides"
    >
     <span>DOC-ALL</span>
     <ToolGraphic type="pixels"/>
     <small>RÉFÉRENCES</small>
     <h3>📖 Documentation</h3>
     <p>Guides OP-1, EP-133, exercices et jeux d'entraînement - tout en un seul endroit.</p>
     <div className="tool-status">{docTools.length} RESSOURCES</div>
    </button>
    <button
     className="utility-card learn-card"
     onClick={()=>setShowTraining(true)}
     title="Cliquez pour accéder aux programmes d'entraînement"
    >
     <span>LEARN-ALL</span>
     <ToolGraphic type="game"/>
     <small>FORMATION</small>
     <h3>📚 Apprendre</h3>
     <p>Exercices OP-1, Rhythm Hero et jeux d'entraînement pour progresser.</p>
     <div className="tool-status">{trainingTools.length} PROGRAMMES</div>
    </button>
   </div>
  </section>

  {showSoundEditor&&<SoundEditorHub profileName={profileName} onClose={()=>setShowSoundEditor(false)}/>}
  {selected&&<Modal tool={selected} onClose={()=>setSelected(null)}/>}
  {showDocs&&<DocsModal docs={docTools} onClose={()=>setShowDocs(false)} onSelectTool={(tool)=>{openTool(tool);setShowDocs(false);}}/>}
  {showSave&&<SaveModal saves={saveTools} onClose={()=>setShowSave(false)} onSelectTool={(tool)=>{openTool(tool);setShowSave(false);}}/>}
  {showTraining&&<TrainingModal training={trainingTools} onClose={()=>setShowTraining(false)} onSelectTool={(tool)=>{openTool(tool);setShowTraining(false);}}/>}
  {showSettings&&<SettingsModal settings={settingsTools} onClose={()=>setShowSettings(false)} onSelectTool={(tool)=>{openTool(tool);setShowSettings(false);}}/>}
  {showSound&&<SoundModal sounds={soundTools} onClose={()=>setShowSound(false)} onSelectTool={(tool)=>{openTool(tool);setShowSound(false);}}/>}
  {showOP1Studio&&<StudioModal studio="op1" tools={op1StudioTools} onClose={()=>setShowOP1Studio(false)} onSelectTool={(tool)=>{openTool(tool);setShowOP1Studio(false);}}/>}
  {showEP133Studio&&<StudioModal studio="ep133" tools={ep133StudioTools} onClose={()=>setShowEP133Studio(false)} onSelectTool={(tool)=>{openTool(tool);setShowEP133Studio(false);}}/>}
 </main>
}

function StudioModal({studio,tools:studioTools,onClose,onSelectTool}:{studio:"op1"|"ep133";tools:Tool[];onClose:()=>void;onSelectTool:(t:Tool)=>void}){
 const isOP1 = studio === "op1";
 const title = isOP1 ? "🎹 OP-1 STUDIO" : "🥁 EP-133 STUDIO";
 const subtitle = isOP1 ? "Synthèse, création et gestion" : "Beatmaking et performance";
 const borderColor = isOP1 ? "#FFD700" : "#FF8C00";
 return <div className="studio-modal-backdrop" onClick={onClose}>
  <section className="studio-modal" style={{borderColor}} onClick={e=>e.stopPropagation()}>
   <button className="studio-modal-close" onClick={onClose} style={{background: borderColor}}>✕</button>
   <div className="studio-modal-header" style={{borderBottomColor: borderColor, backgroundColor: isOP1 ? "#fffacd" : "#ffe4c4"}}>
    <h2>{title}</h2>
    <p>{subtitle}</p>
   </div>
   <div className="studio-grid">
    {studioTools.map(tool => (
     <button key={tool.id} className={`studio-card-item ${tool.accent}`} onClick={()=>onSelectTool(tool)}>
      <ToolGraphic type={tool.visual}/>
      <h3>{tool.title}</h3>
      <small>{tool.category}</small>
      <p>{tool.text}</p>
      <div className="studio-status">{tool.status}</div>
     </button>
    ))}
   </div>
  </section>
 </div>
}

function SoundModal({sounds,onClose,onSelectTool}:{sounds:Tool[];onClose:()=>void;onSelectTool:(t:Tool)=>void}){
 return <div className="sound-modal-backdrop" onClick={onClose}>
  <section className="sound-modal" onClick={e=>e.stopPropagation()}>
   <button className="sound-modal-close" onClick={onClose}>✕</button>
   <div className="sound-modal-header">
    <h2>🎵 CRÉATION & ÉDITION AUDIO</h2>
    <p>Outils pour composer, éditer et préparer les sons</p>
   </div>
   <div className="sound-grid">
    {sounds.map(sound => (
     <button key={sound.id} className={`sound-card-item ${sound.accent}`} onClick={()=>onSelectTool(sound)}>
      <ToolGraphic type={sound.visual}/>
      <h3>{sound.title}</h3>
      <small>{sound.category}</small>
      <p>{sound.text}</p>
      <div className="sound-status">{sound.status}</div>
     </button>
    ))}
   </div>
  </section>
 </div>
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
    <h2>📚 APPRENDRE & S'ENTRAÎNER</h2>
    <p>Progressez à votre rythme</p>
   </div>
   <div className="training-grid">
    {training.map(course => (
     <button key={course.id} className={`training-card-item ${course.accent}`} onClick={()=>onSelectTool(course)}>
      <ToolGraphic type={course.visual}/>
      <h3>{course.title}</h3>
      <small>{course.category}</small>
      <p>{course.text}</p>
      <div className="training-status">{course.status}</div>
     </button>
    ))}
   </div>
  </section>
 </div>
}

function SaveModal({saves,onClose,onSelectTool}:{saves:Tool[];onClose:()=>void;onSelectTool:(t:Tool)=>void}){
 return <div className="save-modal-backdrop" onClick={onClose}>
  <section className="save-modal" onClick={e=>e.stopPropagation()}>
   <button className="save-modal-close" onClick={onClose}>✕</button>
   <div className="save-modal-header">
    <h2>💾 SAUVEGARDES & RESTAURATION</h2>
    <p>Protégez vos machines et vos données</p>
   </div>
   <div className="saves-grid">
    {saves.map(save => (
     <button key={save.id} className={`save-card-item ${save.accent}`} onClick={()=>onSelectTool(save)}>
      <ToolGraphic type={save.visual}/>
      <h3>{save.title}</h3>
      <small>{save.category}</small>
      <p>{save.text}</p>
      <div className="save-status">{save.status}</div>
     </button>
    ))}
   </div>
  </section>
 </div>
}

function DocsModal({docs,onClose,onSelectTool}:{docs:Tool[];onClose:()=>void;onSelectTool:(t:Tool)=>void}){
 return <div className="docs-modal-backdrop" onClick={onClose}>
  <section className="docs-modal" onClick={e=>e.stopPropagation()}>
   <button className="docs-modal-close" onClick={onClose}>✕</button>
   <div className="docs-modal-header">
    <h2>📖 DOCUMENTATION & TRAINING</h2>
    <p>Guides, références et jeux d'entraînement</p>
   </div>
   <div className="docs-grid">
    {docs.map(doc => (
     <button key={doc.id} className={`doc-card ${doc.accent}`} onClick={()=>onSelectTool(doc)}>
      <ToolGraphic type={doc.visual}/>
      <h3>{doc.title}</h3>
      <small>{doc.category}</small>
      <p>{doc.text}</p>
      <div className="doc-status">{doc.status}</div>
     </button>
    ))}
   </div>
  </section>
 </div>
}

function Modal({tool,onClose}:{tool:Tool;onClose:()=>void}){return <div className="hub-modal-backdrop" onClick={onClose}><section className={`hub-modal ${tool.accent}`} onClick={e=>e.stopPropagation()}><button className="hub-modal-close" onClick={onClose}>×</button><span>{tool.code} · {tool.category}</span><ToolGraphic type={tool.visual}/><h2>{tool.title}</h2><p>{tool.text}</p><div>PAGE OUTIL · PROCHAINE INTÉGRATION</div><button onClick={onClose}>RETOUR AU HUB</button></section></div>}
function machineTool(id:"op1"|"ep133"):Tool{return id==="op1"?{id,code:"OP1-08",category:"MACHINE",title:"OP-1 Studio",text:"Huit modules de création, préparation et documentation.",accent:"blue",visual:"wave",status:"8 MODULES",target:"op1"}:{id,code:"KOII-05",category:"MACHINE",title:"EP-133 Studio",text:"Cinq modules pour créer, cloner, transférer, tester et s’entraîner.",accent:"orange",visual:"pads",status:"5 MODULES",target:"ep133"}}
function hubTool(id:"library"|"vault"):Tool{return id==="library"?{id,code:"SOUND-V1",category:"OUTIL DU HUB",title:"Bibliothèque sonore",text:"Catalogue commun avec import, recherche, tags, favoris, préécoute et détection de doublons.",accent:"cyan",visual:"wave",status:"LOCAL",target:"hub",anchor:"sound-library"}:{id,code:"VAULT-01",category:"OUTIL DU HUB",title:"Sauvegarde machine",text:"Snapshots sélectifs, vérification SHA-256 et restauration contrôlée.",accent:"yellow",visual:"chip",status:"SHA-256",target:"hub",anchor:"atelier-vault"}}
function ToolGraphic({type}:{type:string}){if(type==="pads")return <div className="hub-graphic pads-g">{Array.from({length:12},(_,i)=><i key={i}/>)}</div>;if(type==="pixels")return <div className="hub-graphic pixels-g">{Array.from({length:40},(_,i)=><i key={i} className={[3,4,10,14,17,22,25,31,34].includes(i)?"on":""}/>)}</div>;if(type==="wave")return <div className="hub-graphic wave-g">{[20,48,80,35,66,92,42,73,28,57,84].map((v,i)=><i key={i} style={{height:`${v}%`}}/>)}</div>;if(type==="game")return <div className="hub-graphic game-g"><i/><i/><b/><i/><i/></div>;if(type==="sync")return <div className="hub-graphic sync-g"><span>OP-1</span><i/><b>24</b><i/><span>KO II</span></div>;return <div className="hub-graphic chip-g"><span>243</span></div>}
