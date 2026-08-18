"use client";
import { useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";

const Link = ({href, className = "", ...props}: any) => {
  const handleClick = (e: any) => {
    e.preventDefault();
    if (href === "/outils") (window as any).navigateMaquette("outils");
    else if (href === "/fiche-personnage") (window as any).navigateMaquette("profil");
    else if (href === "/") (window as any).navigateMaquette("landing");
  };
  return <a href={"#" + href} onClick={handleClick} className={className} {...props}/>;
};
const Image = ({src, ...props}) => <img src={src} {...props}/>;

const tools = [
  { id:"op1", index:"01", title:"OP-1 Studio", label:"Synthèse & création", description:"Samples, Tape, firmware, images et sauvegardes dans un atelier dédié.", accent:"blue", icon:"keys", meta:"8 modules" },
  { id:"ep133", index:"02", title:"EP-133 Studio", label:"Beatmaking & performance", description:"Patterns, Song, pads, transferts et entraînement rythmique.", accent:"orange", icon:"pads", meta:"64 / 128 Mo" },
  { id:"sounds", index:"03", title:"Bibliothèque sonore", label:"Le stock central", description:"Importer, écouter, classer et préparer les sons pour toutes les machines.", accent:"cyan", icon:"wave", meta:"Local & partagé" },
  { id:"visual", index:"04", title:"Atelier visuel", label:"Pixels & écrans", description:"Créer les écrans, thèmes et graphismes au format exact de l’OP-1.", accent:"purple", icon:"pixels", meta:"320 × 160" },
  { id:"games", index:"05", title:"Training Lab", label:"Jouer pour progresser", description:"Rhythm Hero, exercices MIDI, scores et programmes d’entraînement.", accent:"green", icon:"rhythm", meta:"MIDI ready" },
  { id:"vault", index:"06", title:"Coffre de l’atelier", label:"Copies & restauration", description:"Sauvegarder les machines, contrôler l’intégrité et restaurer sans surprise.", accent:"yellow", icon:"vault", meta:"SHA-256" },
];

function ToolVisual({icon}:{icon:string}) {
  if(icon==="keys") return <div className="visual keys">{[1,2,3,4,5].map(i=><i key={i}/>)}</div>;
  if(icon==="pads") return <div className="visual pads">{Array.from({length:12},(_,i)=><i key={i}/>)}</div>;
  if(icon==="wave") return <div className="visual wave">{[22,42,68,38,78,54,30,62,44].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div>;
  if(icon==="pixels") return <div className="visual pixels">{Array.from({length:24},(_,i)=><i key={i} className={[2,3,8,11,12,15,20,21].includes(i)?"on":""}/>)}</div>;
  if(icon==="rhythm") return <div className="visual rhythm"><i/><i/><b/><i/><i/><span/></div>;
  return <div className="visual vault"><span/><span/><b/></div>;
}

export default function Home(){
 const [selected,setSelected]=useState<(typeof tools)[number]|null>(null);
 const [profileName,setProfileName]=useState("AZOTH");
 // Le profil est une source locale externe : on le lit une seule fois au montage.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{try{const raw=localStorage.getItem("studio-hub-profile");if(raw){const profile=JSON.parse(raw) as {name?:string};if(profile.name?.trim())setProfileName(profile.name.trim())}}catch{/* profil local absent */}},[]);
 return <main>
  <TopBar profileName={profileName}/>
  <section className="hero" id="top"><div className="hero-grid"/><div className="hero-copy">
   <p className="eyebrow"><span/> ATELIER MUSICAL MODULAIRE · LOCAL</p><h1>Construis.<br/>Connecte.<br/><em>Crée.</em></h1>
   <p className="hero-intro">Un seul espace pour piloter tes machines, façonner tes sons et transformer les idées en instruments.</p>
   <div className="hero-actions"><Link className="primary-action" href="/outils">Ouvrir les outils <span>→</span></Link><Link className="secondary-action" href="/fiche-personnage">Créer ma fiche <span>→</span></Link></div>
   <div className="local-note"><i/> Aucun compte. Aucun cloud imposé. Tes fichiers restent chez toi.</div>
  </div><div className="pixel-showcase">
   <div className="pixel-window ep-window"><div className="pixel-window-bar"><span>EP133.EXE</span><b>01</b></div><Image src="/media/ep133.jpeg" alt="Teenage Engineering EP-133 K.O. II sampler composer en pixel art" width={512} height={512} priority sizes="(max-width: 900px) 62vw, 32vw"/><div className="machine-tag"><i/> EP-133 K.O. II · SAMPLER LAB</div></div>
   <div className="pixel-window op-window"><div className="pixel-window-bar"><span>OP1.EXE</span><b>02</b></div><Image src="/media/op1.jpeg" alt="Teenage Engineering OP-1 music workstation en pixel art" width={512} height={512} priority sizes="(max-width: 900px) 76vw, 40vw"/><div className="machine-tag"><i/> OP-1 · SYNTH STUDIO</div></div>
   <div className="pixel-cursor">+</div><div className="pixel-stamp">TWO MACHINES<br/><b>ONE STUDIO</b></div>
  </div></section>
  <section className="intro-strip" id="atelier"><span>01 / L’ATELIER</span><h2>Des outils sérieux.<br/>Une interface qui donne envie de jouer.</h2><p>Engineering Studio réunit le Hub, l’OP-1 et l’EP-133 sans transformer la musique en tableau Excel. Chaque carte est une porte vers un espace spécialisé.</p></section>
  <section className="tools-section" id="outils"><div className="section-head"><div><p className="eyebrow"><span/> CHOISIS TON MODULE</p><h2>Tableau des outils</h2></div><p>Une page dédiée par outil.<br/>Une navigation commune pour ne jamais se perdre.</p></div>
   <div className="tool-grid">{tools.map(tool=><button key={tool.id} className={`tool-card ${tool.accent}`} onClick={()=>setSelected(tool)}><div className="card-top"><span>{tool.index}</span><b>{tool.meta}</b></div><ToolVisual icon={tool.icon}/><div className="card-copy"><small>{tool.label}</small><h3>{tool.title}</h3><p>{tool.description}</p></div><div className="card-open"><span>Ouvrir l’outil</span><b>↗</b></div></button>)}</div>
  </section>
  <section className="system-strip" id="systeme"><div><span className="status-light"/><small>SYSTÈME</small><strong>Local et prêt</strong></div><div><small>MACHINES</small><strong>OP-1 · EP-133</strong></div><div><small>ESPACE</small><strong>1 atelier partagé</strong></div><Link href="/fiche-personnage">Configurer mon atelier <span>→</span></Link></section>
  <footer><span>ENGINEERING STUDIO</span><p>Un atelier pour inventer les machines de demain.</p><b>LOCAL FIRST · 2026</b></footer>
  {selected&&<div className="dialog-backdrop" onClick={()=>setSelected(null)}><section className={`tool-dialog ${selected.accent}`} role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}><button className="dialog-close" onClick={()=>setSelected(null)}>×</button><span className="dialog-index">MODULE {selected.index}</span><ToolVisual icon={selected.icon}/><small>{selected.label}</small><h2>{selected.title}</h2><p>{selected.description}</p><div className="dialog-state"><i/> PAGE DÉDIÉE · PROCHAINE ÉTAPE</div><button className="dialog-action" onClick={()=>setSelected(null)}>Retour à l’atelier</button></section></div>}
 </main>
}
