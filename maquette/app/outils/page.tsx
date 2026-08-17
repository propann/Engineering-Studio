"use client";
import Link from "next/link";
import { useState } from "react";
import "./outils.css";

type Tool={id:string;code:string;category:string;title:string;text:string;accent:string;visual:string;status:string};
const tools:Tool[]=[
 {id:"firmware",code:"FW-243",category:"OP-1",title:"Firmware Lab",text:"Catalogue, vérification et préparation locale des mods OP-1.",accent:"yellow",visual:"chip",status:"SANS MACHINE"},
 {id:"op1-backup",code:"BKP-OP1",category:"SAUVEGARDE",title:"Sauvegarde OP-1",text:"Tape, Album, Drum et Synth avec manifeste et contrôle d’intégrité.",accent:"blue",visual:"chip",status:"OP-1 REQUIS"},
 {id:"sample",code:"WAV-AIFF",category:"SON",title:"Éditeur de samples",text:"Waveform, trim, fondus et préparation des packs OP-1.",accent:"cyan",visual:"wave",status:"LOCAL"},
 {id:"tape",code:"TAPE-04",category:"STUDIO",title:"Tape & Album Studio",text:"Quatre pistes, transport, mixage, stems et Album en mode local.",accent:"blue",visual:"wave",status:"MIDI"},
 {id:"image",code:"PX-320",category:"CRÉATION",title:"Éditeur d’image",text:"Écrans et thèmes OP-1 au format exact 320 × 160.",accent:"purple",visual:"pixels",status:"SANS MACHINE"},
 {id:"services",code:"OP1-LAB",category:"OP-1",title:"Services OP-1",text:"Patchs son, ressources référencées et outils de préparation.",accent:"yellow",visual:"chip",status:"LOCAL"},
 {id:"op1-exercise",code:"KEY-01",category:"TRAINING LAB",title:"Exercices OP-1",text:"Suites d’accords, clavier et retour MIDI pour progresser.",accent:"green",visual:"game",status:"OP-1 REQUIS"},
 {id:"op1-docs",code:"DOC-OP1",category:"DOCUMENTATION",title:"Documentation OP-1",text:"Procédures, formats, connexions et limites vérifiées.",accent:"purple",visual:"pixels",status:"LECTURE"},
 {id:"pattern",code:"PAT-SONG",category:"STUDIO",title:"Pattern & Song Studio",text:"Groupes A/B/C/D, patterns, scènes et positions Song EP-133.",accent:"orange",visual:"pads",status:"ÉDITEUR COMPLET"},
 {id:"sounds",code:"PAD-64",category:"SON",title:"Sons & transferts EP-133",text:"Banques, réglages de pads, clone et transferts préparés.",accent:"pink",visual:"pads",status:"64 / 128 MO"},
 {id:"machine-test",code:"SYSEX-01",category:"DIAGNOSTIC",title:"Test machine EP-133",text:"Observer MIDI/SysEx, groupes actifs et communication aller-retour.",accent:"yellow",visual:"sync",status:"LECTURE SÛRE"},
 {id:"rhythm",code:"GAME-01",category:"TRAINING LAB",title:"Rhythm Hero",text:"Styles, niveaux, BPM, partitions animées, scores et progression aux pads.",accent:"green",visual:"game",status:"MIDI"},
 {id:"ep-docs",code:"DOC-KOII",category:"DOCUMENTATION",title:"Documentation EP-133",text:"Guides Studio, formats, MIDI et procédures machine vérifiées.",accent:"orange",visual:"pixels",status:"FR · EN · ES"},
 {id:"midi",code:"24-PPQN",category:"TRANSPORT",title:"Synchronisation MIDI",text:"Tempo, Start, Stop, notes virtuelles, contrôleur OP-1 et PANIC communs.",accent:"blue",visual:"sync",status:"2 MACHINES"},
];
export default function ToolsHub(){
 const [selected,setSelected]=useState<Tool|null>(null);
 return <main className="hub-page">
  <header className="hub-header"><Link href="/" className="hub-brand"><i/><span><small>ENGINEERING</small><b>STUDIO HUB</b></span></Link><nav><a href="#studios">STUDIOS</a></nav><Link href="/fiche-personnage" className="hub-player"><img src="/media/avatars/pixel-avatar-engineer.webp" alt="Avatar du joueur"/><span><small>PLAYER 01</small><b>AZOTH</b></span><strong>LV.01</strong></Link></header>
  <section className="hub-welcome"><div><p><i/> WORKSPACE LOCAL · CONNECTÉ</p><h1>Bienvenue dans<br/><em>ton atelier.</em></h1><span>Deux machines, seize espaces utiles et aucune fausse fonction cloud.</span></div><div className="hub-status-board"><div><small>MACHINES</small><b>02</b><span>OP-1 · EP-133</span></div><div><small>ESPACES ACTIFS</small><b>16</b><span>CODE PRÉSENT</span></div><div><small>COFFRE</small><b>00</b><span>SNAPSHOT</span></div><div className="workspace-readout"><small>ESPACE MAÎTRE</small><strong>/ENGINEERING_STUDIO</strong><i>ONLINE</i></div></div></section>
  <section className="machine-studios" id="studios"><div className="machine-studio-grid">
   <button className="machine-card op1-card" onClick={()=>setSelected(machineTool("op1"))}><div className="machine-card-image"><img src="/media/teenage-engineering-op-1-pixel-art-music-workstation.jpeg" alt="Teenage Engineering OP-1 complet en pixel art"/><div className="machine-online"><i/> LOCAL MODE</div></div><div className="machine-card-copy"><span>SYNTHÈSE · TAPE · FIRMWARE</span><h3>OP-1 Studio</h3><p>Firmware, sauvegardes, sons, Tape, images, services, exercices et documentation.</p><div className="module-pills"><b>8 MODULES</b><b>MIDI</b><b>LOCAL</b></div></div></button>
   <button className="machine-card ko-card" onClick={()=>setSelected(machineTool("ep133"))}><div className="machine-card-image"><img src="/media/teenage-engineering-ep-133-ko-ii-pixel-art-sampler.jpeg" alt="Teenage Engineering EP-133 K.O. II complet en pixel art"/><div className="machine-online"><i/> 64 MO · PRÊT</div></div><div className="machine-card-copy"><span>BEATS · SONG · PERFORMANCE</span><h3>EP-133 Studio</h3><p>Pattern & Song, sons, test machine, Rhythm Hero et documentation.</p><div className="module-pills"><b>5 MODULES</b><b>SYSEX</b><b>PADS</b></div></div></button>
   <button className="machine-editor-card sound-library-card" onClick={()=>setSelected(hubTool("library"))}><div className="subtool-wave">{[32,68,45,88,56,96,40,76,50,82].map((v,i)=><i key={i} style={{height:`${v}%`}}/>)}</div><div><b>SOUND-V1 · CONTENU AUDIO</b><h3>Bibliothèque de samples</h3><p>Importer, classer, écouter et préparer les banques de sons OP-1.</p></div><strong>↗</strong></button>
  </div></section>

  <section className="utility-cards" aria-label="Accès rapides"><div className="utility-grid">
   <button className="utility-card purple" onClick={()=>setSelected(tools.find(t=>t.id==="op1-docs")!)}><span>DOC-01</span><ToolGraphic type="pixels"/><small>RÉFÉRENCES VÉRIFIÉES</small><h3>Documentation</h3><p>Guides OP-1 et EP-133, formats, MIDI et procédures.</p></button>
   <button className="utility-card orange" onClick={()=>setSelected(tools.find(t=>t.id==="image")!)}><span>PX-320</span><ToolGraphic type="pixels"/><small>CRÉATION VISUELLE</small><h3>Éditeur d’image</h3><p>Écrans, thèmes et visuels au format exact des machines.</p></button>
   <button className="utility-card yellow" onClick={()=>setSelected(hubTool("vault"))}><span>VAULT-01</span><ToolGraphic type="chip"/><small>COFFRE LOCAL</small><h3>Sauvegarde</h3><p>Snapshots OP-1 et EP-133 avec contrôle d’intégrité.</p></button>
  </div></section>

  <Link href="/fiche-personnage" className="player-progress-card" aria-label="Ouvrir la fiche personnage"><div className="progress-player"><img src="/media/avatars/pixel-avatar-engineer.webp" alt="Avatar Engineer"/><div><small>FICHE PERSONNAGE · PLAYER 01</small><h2>AZOTH</h2><span>ENGINEER · NIVEAU 01</span></div><strong className="player-card-link">VOIR MA FICHE →</strong></div><div className="game-scores"><div><small>RHYTHM HERO</small><b>12 450</b><span>MEILLEUR SCORE</span></div><div><small>PRÉCISION</small><b>84%</b><span>DERNIÈRE SESSION</span></div><div><small>MEILLEURE SÉRIE</small><b>37</b><span>FRAPPES</span></div><div><small>EXERCICES</small><b>18/42</b><span>TERMINÉS</span></div></div></Link>

  {selected&&<Modal tool={selected} onClose={()=>setSelected(null)}/>} 
 </main>
}

function Modal({tool,onClose}:{tool:Tool;onClose:()=>void}){return <div className="hub-modal-backdrop" onClick={onClose}><section className={`hub-modal ${tool.accent}`} onClick={e=>e.stopPropagation()}><button className="hub-modal-close" onClick={onClose}>×</button><span>{tool.code} · {tool.category}</span><ToolGraphic type={tool.visual}/><h2>{tool.title}</h2><p>{tool.text}</p><div>PAGE OUTIL · PROCHAINE INTÉGRATION</div><button onClick={onClose}>RETOUR AU HUB</button></section></div>}
function machineTool(id:"op1"|"ep133"):Tool{return id==="op1"?{id,code:"OP1-08",category:"MACHINE",title:"OP-1 Studio",text:"Huit modules de création, préparation et documentation.",accent:"blue",visual:"wave",status:"8 MODULES"}:{id,code:"KOII-05",category:"MACHINE",title:"EP-133 Studio",text:"Cinq modules pour créer, cloner, transférer, tester et s’entraîner.",accent:"orange",visual:"pads",status:"5 MODULES"}}
function hubTool(id:"library"|"vault"):Tool{return id==="library"?{id,code:"SOUND-V1",category:"OUTIL DU HUB",title:"Bibliothèque sonore",text:"Catalogue commun avec import, recherche, tags, favoris, préécoute et détection de doublons.",accent:"cyan",visual:"wave",status:"LOCAL"}:{id,code:"VAULT-01",category:"OUTIL DU HUB",title:"Sauvegarde machine",text:"Snapshots sélectifs, vérification SHA-256 et restauration contrôlée.",accent:"yellow",visual:"chip",status:"SHA-256"}}
function ToolGraphic({type}:{type:string}){if(type==="pads")return <div className="hub-graphic pads-g">{Array.from({length:12},(_,i)=><i key={i}/>)}</div>;if(type==="pixels")return <div className="hub-graphic pixels-g">{Array.from({length:40},(_,i)=><i key={i} className={[3,4,10,14,17,22,25,31,34].includes(i)?"on":""}/>)}</div>;if(type==="wave")return <div className="hub-graphic wave-g">{[20,48,80,35,66,92,42,73,28,57,84].map((v,i)=><i key={i} style={{height:`${v}%`}}/>)}</div>;if(type==="game")return <div className="hub-graphic game-g"><i/><i/><b/><i/><i/></div>;if(type==="sync")return <div className="hub-graphic sync-g"><span>OP-1</span><i/><b>24</b><i/><span>KO II</span></div>;return <div className="hub-graphic chip-g"><span>243</span></div>}
