"use client";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/TopBar";

const Link = ({href, className, ...props}) => {
  const handleClick = (e: any) => {
    e.preventDefault();
    if (href === "/outils") (window as any).navigateMaquette("outils");
    else if (href === "/") (window as any).navigateMaquette("landing");
  };
  return <a href={"#" + href} onClick={handleClick} className={className} {...props}/>;
};

type Machine={id:number;kind:"op1"|"ep133";name:string;memory?:64|128;active:boolean};
const avatarNames=["teacher","carpenter","artist","barista","support","architect","activist","mail-carrier","builder","scientist","student","librarian","trainer","office-worker","influencer","chef","courier","grandma","musician","paramedic","knight","rogue","smith","archer","scholar","warrior","goblin","cyborg","cat-adventurer","pirate","sorceress","viking","engineer","necromancer","ranger","royal-guard","fighter","samurai","cultist","explorer"] as const;
const avatarLabel=(value:string)=>value.replace(/-/g," ").toUpperCase();

export default function CharacterPage(){
 const [name,setName]=useState("AZOTH"); const [bio,setBio]=useState("Inventeur de machines musicales et explorateur de fréquences.");
 const [avatar,setAvatar]=useState<(typeof avatarNames)[number]>("engineer"); const [workspace,setWorkspace]=useState("");
 const [language,setLanguage]=useState("FR"); const [keyboard,setKeyboard]=useState("AZERTY"); const [theme,setTheme]=useState("PIXEL");
 const [machines,setMachines]=useState<Machine[]>([{id:1,kind:"op1",name:"OP-1 STUDIO",active:true},{id:2,kind:"ep133",name:"KO II LAB",memory:64,active:true}]);

 // Workspace picker - crée la structure de dossiers nécessaire
 const pickWorkspaceFolder=async()=>{
  if((window as any).showDirectoryPicker){
   try{const dirHandle=await(window as any).showDirectoryPicker({mode:"readwrite"});const name=dirHandle.name;setWorkspace(name);
    // Créer la structure de dossiers (sans écraser si existe)
    const folders=["shared/sounds","op1/backups","op1/projects","ep133/projects","ep133/samples"];
    for(const folder of folders){const parts=folder.split("/");let current=dirHandle;for(const part of parts){try{current=await current.getDirectoryHandle(part,{create:true})}catch{}}}}catch(e){}}else{alert("Choisir un dossier manuellement dans votre explorateur.\n\nStructure créée: shared/sounds, op1/backups, op1/projects, ep133/projects, ep133/samples");}};

 const toggleWorkspace=()=>{if(workspace){setWorkspace("")}else{pickWorkspaceFolder()}};
 // La fiche est hydratée depuis le profil local sauvegardé, uniquement au montage.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{try{const raw=localStorage.getItem("studio-hub-profile");if(!raw)return;const profile=JSON.parse(raw) as {name?:string;bio?:string;avatar?:string;workspace?:{name?:string};machineInventory?:Array<{id?:string|number;kind?:string;name?:string;capacityMb?:64|128;enabled?:boolean}>};if(profile.name)setName(profile.name);if(profile.bio)setBio(profile.bio);if(profile.avatar&&avatarNames.includes(profile.avatar as (typeof avatarNames)[number]))setAvatar(profile.avatar as (typeof avatarNames)[number]);if(profile.workspace?.name)setWorkspace(profile.workspace.name);if(profile.machineInventory?.length)setMachines(profile.machineInventory.map((machine,index)=>({id:typeof machine.id==="number"?machine.id:index+1,kind:machine.kind==="ep133"?"ep133":"op1",name:machine.name||"MACHINE",memory:machine.kind==="ep133"?machine.capacityMb||64:undefined,active:machine.enabled!==false})));}catch{/* profil absent ou ancien format */}},[]);
 const progress=useMemo(()=>25+(name.trim()?25:0)+(machines.some(m=>m.active)?25:0)+(workspace?25:0),[name,machines,workspace]);
 const avatarIndex=avatarNames.indexOf(avatar);
 function cycleAvatar(direction:-1|1){const next=(avatarIndex+direction+avatarNames.length)%avatarNames.length;setAvatar(avatarNames[next])}
 function update(id:number,patch:Partial<Machine>){setMachines(list=>list.map(m=>m.id===id?{...m,...patch}:m))}
 function add(kind:Machine["kind"]){setMachines(list=>[...list,{id:Date.now(),kind,name:kind==="op1"?`OP-1 ${list.filter(m=>m.kind===kind).length+1}`:`EP-133 ${list.filter(m=>m.kind===kind).length+1}`,memory:kind==="ep133"?64:undefined,active:true}])}
 function saveProfile(){const active=machines.filter(machine=>machine.active);const summary={op1:{enabled:active.some(machine=>machine.kind==="op1"),backups:0,projects:0,samples:0,trainingProgress:0},ep133:{enabled:active.some(machine=>machine.kind==="ep133"),backups:0,projects:0,samples:0,trainingProgress:0}};localStorage.setItem("studio-hub-profile",JSON.stringify({version:1,name:name.trim(),avatar,bio:bio.trim(),machines:summary,machineInventory:machines.map(machine=>({id:String(machine.id),kind:machine.kind,name:machine.name,capacityMb:machine.memory,enabled:machine.active,backups:0,projects:0,samples:0,trainingProgress:0})),workspace:workspace?{name:workspace,folders:[]}:undefined,createdAt:new Date().toISOString()}));localStorage.removeItem("studio-hub-profile-draft")}
 return <main className="creator-page">
  <TopBar profileName={name}/>
  <div className="creator-progress"><span style={{width:`${progress}%`}}/><b>{progress}% · ATELIER CONFIGURÉ</b></div>

  <section className="creator-layout">
   <aside className="player-panel">
    <div className="panel-label">PLAYER_01 / APERÇU</div>
    <div className="pixel-avatar"><img src={`/media/avatars/pixel-avatar-${avatar}.webp`} alt={`Avatar pixel art ${avatarLabel(avatar)}`} width="640" height="560"/><div className="avatar-role"><span>CLASS</span><b>{avatarLabel(avatar)}</b></div></div>
    <div className="player-card"><small>CRÉATEUR LOCAL</small><h1>{name||"SANS NOM"}</h1><p>{bio||"Écris quelques mots sur ton atelier."}</p><div className="player-stats"><span><b>{machines.filter(m=>m.active).length}</b>MACHINES</span><span><b>{workspace?"ON":"OFF"}</b>WORKSPACE</span><span><b>{language}</b>LANGUE</span></div></div>
    <div className="privacy-chip"><i/> PROFIL LOCAL · AUCUN COMPTE</div>
   </aside>

   <div className="creator-console">
    <div className="quest-head"><span>CONFIGURATION PRINCIPALE</span><b>4 ÉTAPES</b></div>
    <section className="creator-block identity-block"><div className="block-number">01</div><div className="block-content"><div className="block-title"><span>IDENTITÉ</span><small>QUI PILOTE L’ATELIER ?</small></div><div className="field-grid"><label>PSEUDO<input value={name} onChange={e=>setName(e.target.value.toUpperCase())} maxLength={40}/></label><label className="wide">PRÉSENTATION<textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={160}/><small>{bio.length}/160</small></label></div><div className="avatar-carousel"><span>CHOISIR UN AVATAR</span><div className="avatar-carousel-control"><button onClick={()=>cycleAvatar(-1)} aria-label="Avatar précédent">←</button><div className="avatar-current"><img src={`/media/avatars/pixel-avatar-${avatar}.webp`} alt={`Avatar ${avatarLabel(avatar)}`} width="320" height="280"/><div><small>{String(avatarIndex+1).padStart(2,"0")} / 40</small><strong>{avatarLabel(avatar)}</strong></div></div><button onClick={()=>cycleAvatar(1)} aria-label="Avatar suivant">→</button></div><small>Utilise les flèches pour parcourir les personnages</small></div></div></section>

    <section className="creator-block"><div className="block-number">02</div><div className="block-content"><div className="block-title"><span>ÉQUIPEMENT</span><small>NOMME TES MACHINES</small></div><div className="loadout-list">{machines.map(machine=><article className={`loadout ${machine.kind} ${machine.active?"active":""}`} key={machine.id}><button className="power" onClick={()=>update(machine.id,{active:!machine.active})}><i/></button><div className="machine-pixel">{machine.kind==="op1"?<div className="mini-op"><i/><i/><i/><i/></div>:<div className="mini-ko">{Array.from({length:12},(_,i)=><i key={i}/>)}</div>}</div><label>NOM DE LA MACHINE<input value={machine.name} onChange={e=>update(machine.id,{name:e.target.value})}/></label><label>MODÈLE<select value={machine.kind} onChange={e=>{const kind=e.target.value as Machine["kind"];update(machine.id,{kind,memory:kind==="ep133"?64:undefined})}}><option value="op1">OP-1</option><option value="ep133">EP-133 K.O. II</option></select></label>{machine.kind==="ep133"&&<label>MÉMOIRE<select value={machine.memory} onChange={e=>update(machine.id,{memory:Number(e.target.value) as 64|128})}><option value="64">64 Mo</option><option value="128">128 Mo</option></select></label>}<button className="remove-machine" onClick={()=>setMachines(list=>list.filter(m=>m.id!==machine.id))}>×</button></article>)}</div><div className="add-machine"><button onClick={()=>add("op1")}>+ AJOUTER UN OP-1</button><button onClick={()=>add("ep133")}>+ AJOUTER UN EP-133</button></div></div></section>

    <section className="creator-block"><div className="block-number">03</div><div className="block-content"><div className="block-title"><span>BASE LOCALE</span><small>LE DOSSIER MAÎTRE DE TON ATELIER</small></div><div className={`workspace-slot ${workspace?"connected":""}`}><div className="pixel-folder"><i/><b/></div><div><small>ESPACE DE TRAVAIL PARTAGÉ</small><strong>{workspace||"AUCUN DOSSIER CONNECTÉ"}</strong><p>Sons, projets et sauvegardes restent sur ton ordinateur.</p></div><button onClick={toggleWorkspace}>{workspace?"CHANGER DOSSIER":"CHOISIR UN DOSSIER"}</button></div>{workspace&&<div className="folder-map"><code>/shared/sounds</code><code>/op1/backups</code><code>/ep133/projects</code><code>/ep133/samples</code></div>}</div></section>

    <section className="creator-block"><div className="block-number">04</div><div className="block-content"><div className="block-title"><span>RÉGLAGES JOUEUR</span><small>PRÉFÉRENCES LOCALES</small></div><div className="settings-row"><Choice label="LANGUE" value={language} choices={["FR","EN"]} onChange={setLanguage}/><Choice label="CLAVIER" value={keyboard} choices={["AZERTY","QWERTY"]} onChange={setKeyboard}/><Choice label="THÈME" value={theme} choices={["PIXEL","LIGHT"]} onChange={setTheme}/></div></div></section>

    <div className="creator-actions"><Link href="/">ANNULER</Link><Link className="save-profile-link" href="/outils" onClick={saveProfile}>ENREGISTRER MA FICHE <span>→</span></Link></div>
   </div>
  </section>
 </main>
}

function Choice({label,value,choices,onChange}:{label:string;value:string;choices:string[];onChange:(v:string)=>void}){return <div className="choice"><span>{label}</span><div>{choices.map(item=><button key={item} className={item===value?"active":""} onClick={()=>onChange(item)}>{item}</button>)}</div></div>}
