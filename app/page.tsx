"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import firmwareCatalog from "../data/firmware/catalog.json";
import { describeLocalBridgeAction, prepareLocalBridgeAction } from "./lib/localBridge";
import { decodeMidiNote } from "./lib/midi";
import { hasNativeStorage, initialiseNativeLibrary, prepareNativeLocalPlan, readDisplayLibrary, readNativeProfile, writeNativeProfile } from "./lib/nativeStorage";
import { DEFAULT_PROFILE, parseProfile, serializeProfile, type LocalProfile } from "./lib/profile";
import { encodeAiffPcm16 } from "./lib/audioConvert";
import { HomeHub } from "./components/HomeHub";
import { DocumentationPanel } from "./components/DocumentationPanel";
import { DisplayCreatorPanel } from "./components/DisplayCreatorPanel";
import { Op1PixelEditor } from "./components/Op1PixelEditor";
import { ExercisePanel } from "./components/ExercisePanel";
import { BackupPanel } from "./components/BackupPanel";
import { SoundsPanel } from "./components/SoundsPanel";
import { StudioModeHeader } from "./components/StudioModeHeader";
import { StudioMachinePanel } from "./components/StudioMachinePanel";
import { StudioProjectToolbar } from "./components/StudioProjectToolbar";
import { StudioTapeEditor } from "./components/StudioTapeEditor";
import { StudioTransportPanel } from "./components/StudioTransportPanel";
import { ToolWindowTabs } from "./components/ToolWindowTabs";

type IconName =
  | "chip"
  | "shield"
  | "archive"
  | "wave"
  | "tape"
  | "settings"
  | "download"
  | "check"
  | "lock"
  | "terminal"
  | "plug"
  | "book"
  | "image";

type ToolWindow = "exercise" | "docs" | "editor" | "backups" | "sounds" | "tape" | null;

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    chip: <><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3M10 10h4v4h-4z"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.8 2.7 8.1 7 10 4.3-1.9 7-5.2 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    archive: <><path d="M4 7h16v14H4zM3 3h18v4H3z"/><path d="M9 11h6"/></>,
    wave: <path d="M3 12h3l2-6 4 12 3-9 2 6h4"/>,
    tape: <><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="8" cy="11" r="2.5"/><circle cx="16" cy="11" r="2.5"/><path d="m8 16 2-2h4l2 2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 20h14"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    terminal: <><path d="m5 7 4 5-4 5M11 17h8"/></>,
    plug: <><path d="M9 2v6m6-6v6M7 8h10v3a5 5 0 0 1-5 5v5"/></>,
    book: <><path d="M4 4h6a2 2 0 0 1 2 2v15a3 3 0 0 0-3-3H4z"/><path d="M20 4h-6a2 2 0 0 0-2 2v15a3 3 0 0 1 3-3h5z"/></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5-5 3 3 4-5 4 5"/></>,
  };

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

// Categorie/confiance : miroir volontaire de CATEGORY_MAP dans tools/display_bridge.py.
// Toute modification de la logique de tri doit rester cohérente des deux côtés.
type DisplayConfidence = "high" | "medium" | "low";
const DISPLAY_CATEGORY_MAP: Record<string, [string, DisplayConfidence, string]> = {
  tape: ["tape", "high", "Guide officiel, chapitre tape-mode."],
  tapeconfig: ["tape", "high", "Déjà documenté dans FIRMWARE_MOD_CATALOG.md."],
  mixer: ["tape", "high", "Fiche produit : « 4 channel mixer » de la fonction Tape."],
  album: ["album", "high", "Guide officiel, chapitre song-rendering-and-connectivity."],
  com: ["connectivite", "high", "Repère « album/com » du guide layout officiel."],
  help: ["aide", "high", "Guide officiel, chapitre help."],
  tempo: ["tempo", "high", "Guide officiel, chapitre tempo."],
  clock: ["sequenceurs", "medium", "Associé au tempo/horloge, non nommé explicitement par TE."],
  octave: ["clavier", "high", "Guide officiel, ancre musical-keyboard#3.2 (octave shift)."],
  endless: ["sequenceurs", "high", "Nommé « Endless sequencer » dans OP1_KNOWLEDGE_BASE.md."],
  pattern: ["sequenceurs", "medium", "Séquenceur pattern, cohérent avec le guide sequencers."],
  playmode: ["modes_principaux", "high", "Déjà documenté dans FIRMWARE_MOD_CATALOG.md."],
  rymd: ["modes_principaux", "medium", "Déjà utilisé comme mod vérifié, nom d’écran non confirmé par TE."],
  delay: ["effets", "high", "Fiche produit : « seven high quality effects »."],
  eq: ["effets", "high", "Fiche produit : effets + fonction mixer/EQ Tape."],
  master: ["effets", "high", "OP1_KNOWLEDGE_BASE.md : traitements master de l’Album."],
  singlelfo: ["lfo", "high", "Fiche produit : « multiple routable lfo's »."],
  duallfo: ["lfo", "high", "Fiche produit : « multiple routable lfo's »."],
  rndlfo: ["lfo", "high", "Fiche produit : « multiple routable lfo's »."],
  bendlfo: ["lfo", "high", "Fiche produit : « multiple routable lfo's »."],
  cranklfo: ["lfo", "high", "Fiche produit : « multiple routable lfo's »."],
  midilfo: ["lfo", "high", "Fiche produit : « multiple routable lfo's »."],
  reroutelfo: ["lfo", "high", "Fiche produit : « multiple routable lfo's »."],
  iter: ["moteurs_sonores", "high", "data/mods/catalog.json : synthé Iter vérifié."],
  fm: ["moteurs_sonores", "medium", "Moteur FM, cohérent avec les treize moteurs annoncés."],
  sampler: ["moteurs_sonores", "medium", "OP-1 documenté comme synthétiseur ET sampler."],
  presetbrowser: ["navigation_presets", "medium", "Nom explicite du fichier, pas de page TE dédiée."],
  save: ["interface_generique", "low", "Chrome d’interface générique, sens probable mais non confirmé."],
  ok: ["interface_generique", "low", "Chrome d’interface générique, sens probable mais non confirmé."],
  cls: ["interface_generique", "low", "Codename interne, sens non confirmé."],
};
const DISPLAY_DEFAULT_CATEGORY: [string, DisplayConfidence, string] = ["non_identifie", "low", "Codename interne du firmware, aucune source externe ne le confirme."];
const DISPLAY_CATEGORY_LABELS: Record<string, string> = {
  tape: "Tape", album: "Album", connectivite: "Connectivité", aide: "Aide", tempo: "Tempo",
  sequenceurs: "Séquenceurs", clavier: "Clavier", modes_principaux: "Modes principaux",
  effets: "Effets", lfo: "LFO", moteurs_sonores: "Moteurs sonores", navigation_presets: "Navigation presets",
  interface_generique: "Interface générique", non_identifie: "Non identifié",
};
const DISPLAY_CATEGORY_ORDER = ["tape", "album", "connectivite", "aide", "tempo", "sequenceurs", "clavier", "modes_principaux", "effets", "lfo", "moteurs_sonores", "navigation_presets", "interface_generique", "non_identifie"];

function categorizeDisplayAsset(fileName: string) {
  const stem = fileName.replace(/\.svg$/i, "").toLowerCase();
  const [category, confidence, note] = DISPLAY_CATEGORY_MAP[stem] ?? DISPLAY_DEFAULT_CATEGORY;
  return { category, confidence, note };
}

function displayDimensions(svg: string) {
  const match = svg.match(/viewBox\s*=\s*["']\s*(-?[\d.]+)\s+(-?[\d.]+)\s+([\d.]+)\s+([\d.]+)\s*["']/i);
  if (!match) return { width: 0, height: 0, viewBox: "inconnu" };
  return { width: Number(match[3]), height: Number(match[4]), viewBox: `${match[1]} ${match[2]} ${match[3]} ${match[4]}` };
}

// Doit produire exactement le meme contrat que build_patch() dans tools/display_bridge.py,
// pour rester compatible avec op1_gfx.patch_image_file côté Python.
function pyRegexEscape(text: string) {
  return text.replace(/[.^$*+?()[\]{}|\\]/g, "\\$&");
}
function buildDisplayPatch(file: string, original: string, edited: string) {
  return { file, changes: [{ type: "substitute", find: pyRegexEscape(original), replace: edited.replace(/\\/g, "\\\\") }] };
}

const THEME_SOURCE_COLORS = ["#010101", "#3b2d49", "#87839c", "#b4aecf", "#ff3a5d", "#00ed95", "#698eff", "#dfd9ff"];
const THEME_PRESETS: Record<string, Record<string, string>> = {
  "Neon OP-1": { "#010101": "#101418", "#3b2d49": "#202729", "#87839c": "#8aa29a", "#b4aecf": "#d9f0e4", "#ff3a5d": "#ff3a5d", "#00ed95": "#00ed95", "#698eff": "#698eff", "#dfd9ff": "#f4fff8" },
  "Sunset studio": { "#010101": "#160f1e", "#3b2d49": "#4b244d", "#87839c": "#a05d72", "#b4aecf": "#f0b18d", "#ff3a5d": "#ff6b5b", "#00ed95": "#ffd166", "#698eff": "#e07aff", "#dfd9ff": "#fff1d6" },
  "Mono console": { "#010101": "#080b0b", "#3b2d49": "#202727", "#87839c": "#6e7d79", "#b4aecf": "#a9bab3", "#ff3a5d": "#d8e5df", "#00ed95": "#d8e5df", "#698eff": "#a9bab3", "#dfd9ff": "#f0f7f2" },
};

function applyDisplayTheme(svg: string, colors: Record<string, string>) {
  return THEME_SOURCE_COLORS.reduce((result, source) => result.replace(new RegExp(source, "gi"), colors[source] ?? source), svg);
}

type DisplayAsset = { file: string; category: string; confidence: DisplayConfidence; note: string; original: string; edited: string; width: number; height: number; viewBox: string };

function DisplayEditor({ onNotice, root }: { onNotice: (message: string) => void; root: string }) {
  const [assets, setAssets] = useState<DisplayAsset[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [pixelEditorOpen, setPixelEditorOpen] = useState(false);
  const [themeName, setThemeName] = useState("Neon OP-1");
  const [themeScope, setThemeScope] = useState<"all" | "synth">("all");
  const [themeColors, setThemeColors] = useState<Record<string, string>>(THEME_PRESETS["Neon OP-1"]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firmwareDisplayInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void readDisplayLibrary(root).then((files) => {
      if (!active || !files.length) return;
      const loaded = files.map(({ file, contents }) => {
        const { category, confidence, note } = categorizeDisplayAsset(file);
        return { file, category, confidence, note, original: contents, edited: contents, ...displayDimensions(contents) };
      });
      setAssets((current) => {
        const byName = new Map(current.map((asset) => [asset.file, asset]));
        loaded.forEach((asset) => byName.set(asset.file, asset));
        return [...byName.values()];
      });
    }).catch(() => undefined);
    return () => { active = false; };
  }, [root]);

  async function loadFiles(files: FileList) {
    const svgFiles = Array.from(files).filter((file) => file.name.toLowerCase().endsWith(".svg") && (!((file as File & { webkitRelativePath?: string }).webkitRelativePath) || (file as File & { webkitRelativePath?: string }).webkitRelativePath?.replaceAll("\\", "/").includes("/content/display/")));
    if (!svgFiles.length) { onNotice("Aucun fichier .svg dans la sélection."); return; }
    const loaded = await Promise.all(svgFiles.map(async (file) => {
      const text = await file.text();
      const { category, confidence, note } = categorizeDisplayAsset(file.name);
      return { file: file.name, category, confidence, note, original: text, edited: text, ...displayDimensions(text) };
    }));
    setAssets((current) => {
      const byName = new Map(current.map((asset) => [asset.file, asset]));
      loaded.forEach((asset) => byName.set(asset.file, asset));
      return [...byName.values()];
    });
    onNotice(`${loaded.length} écran${loaded.length > 1 ? "s" : ""} chargé${loaded.length > 1 ? "s" : ""} localement, triés par catégorie.`);
  }

  const active = assets.find((asset) => asset.file === activeFile) ?? null;
  const grouped = DISPLAY_CATEGORY_ORDER
    .map((category) => ({ category, items: assets.filter((asset) => asset.category === category) }))
    .filter((group) => group.items.length > 0);

  function updateActiveEdit(text: string) {
    if (!activeFile) return;
    setAssets((current) => current.map((asset) => (asset.file === activeFile ? { ...asset, edited: text } : asset)));
  }

  function resetActiveEdit() {
    if (!activeFile) return;
    setAssets((current) => current.map((asset) => (asset.file === activeFile ? { ...asset, edited: asset.original } : asset)));
    onNotice("Écran remis dans son état d’origine.");
  }

  function exportPatch() {
    if (!active) return;
    if (active.edited === active.original) { onNotice("Rien à exporter : modifiez le SVG avant de générer un patch."); return; }
    const patch = buildDisplayPatch(active.file, active.original, active.edited);
    const blob = new Blob([JSON.stringify(patch, null, 4)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${active.file.replace(/\.svg$/i, "")}.patch.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    onNotice("Patch JSON exporté. Il s’applique avec tools/display_bridge.py ou op1_gfx.patch_image_file, jamais directement sur l’OP-1.");
  }

  function isThemeAllowed(asset: DisplayAsset) {
    return asset.width === 320 && asset.height === 160 && (themeScope === "all" || asset.category === "moteurs_sonores");
  }

  function applyThemeToAssets() {
    if (!assets.length) { onNotice("Chargez d’abord un dossier content/display."); return; }
    const changed = assets.filter((asset) => isThemeAllowed(asset) && applyDisplayTheme(asset.edited, themeColors) !== asset.edited).length;
    setAssets((current) => current.map((asset) => isThemeAllowed(asset) ? { ...asset, edited: applyDisplayTheme(asset.edited, themeColors) } : asset));
    onNotice(`${changed} image${changed > 1 ? "s" : ""} préparée${changed > 1 ? "s" : ""} avec le thème ${themeName}. Les profils atypiques restent verrouillés.`);
  }

  function exportThemeBundle() {
    const modified = assets.filter((asset) => asset.edited !== asset.original);
    if (!modified.length) { onNotice("Aucune modification à exporter."); return; }
    const bundle = { schema: "op1-studio-display-theme-bundle", version: 1, theme: themeName, scope: themeScope, safety: "patches-only-no-machine-write", source: "local-firmware-display-assets", allowedProfile: "320x160-exact", rejectedAssets: assets.filter((asset) => !isThemeAllowed(asset)).map((asset) => ({ file: asset.file, viewBox: asset.viewBox, width: asset.width, height: asset.height, reason: "profile-not-allowed" })), assets: modified.map((asset) => ({ file: asset.file, viewBox: asset.viewBox, width: asset.width, height: asset.height, patch: buildDisplayPatch(asset.file, asset.original, asset.edited) })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = `op1-${themeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-display-patches.json`; link.click(); URL.revokeObjectURL(url); onNotice(`${modified.length} patch${modified.length > 1 ? "s" : ""} exporté${modified.length > 1 ? "s" : ""} dans un bundle contrôlé.`);
  }

  return (
    <div className="tool-body display-editor">
      <div className="display-editor-intro">
        <Icon name="shield" size={16} />
        <p>
          Ces écrans viennent d’un firmware officiel déballé en local avec <code>python tools/display_bridge.py sort --input votre_firmware.op1 --output-dir backups/display-sorted</code>.
          Rien n’est stocké dans le dépôt Git. Chargez ici les fichiers <code>.svg</code> obtenus (dossier <code>backups/display-sorted/</code>) pour les prévisualiser, les modifier et exporter un patch — jamais pour écrire directement sur la machine.
        </p>
      </div>

      <div className="display-loader">
        <button className="secondary-action" onClick={() => fileInputRef.current?.click()}><Icon name="download" size={14} />Charger des écrans .svg</button>
        <input ref={fileInputRef} className="visually-hidden" type="file" accept=".svg" multiple onChange={(event) => { const files = event.target.files; if (files?.length) void loadFiles(files); event.currentTarget.value = ""; }} />
        <button className="secondary-action" onClick={() => firmwareDisplayInputRef.current?.click()}><Icon name="archive" size={14} />Importer tout content/display</button>
        <input ref={firmwareDisplayInputRef} className="visually-hidden" type="file" multiple accept=".svg" {...{ webkitdirectory: "true", directory: "true" }} onChange={(event) => { const files = event.target.files; if (files?.length) void loadFiles(files); event.currentTarget.value = ""; }} />
        <small>{assets.length ? `${assets.length} écran${assets.length > 1 ? "s" : ""} en mémoire, sur cet appareil uniquement.` : "Aucun écran chargé pour l’instant."}</small>
      </div>

      <section className="display-theme-panel" aria-label="Créateur de thèmes firmware">
        <div className="mod-section-heading"><div><span className="section-label">THÈME GLOBAL</span><strong>Recolorer les fenêtres du firmware</strong></div><small>{assets.filter(isThemeAllowed).length} assets compatibles · profils atypiques exclus</small></div>
        <div className="display-theme-controls"><label>Preset <select value={themeName} onChange={(event) => { const next = event.target.value; setThemeName(next); setThemeColors(THEME_PRESETS[next] ?? themeColors); }}><option value="Neon OP-1">Neon OP-1</option><option value="Sunset studio">Sunset studio</option><option value="Mono console">Mono console</option><option value="Personnalisé">Personnalisé</option></select></label><label>Périmètre <select value={themeScope} onChange={(event) => setThemeScope(event.target.value as "all" | "synth")}><option value="all">Tous les écrans 320×160</option><option value="synth">Fenêtres synthèse uniquement</option></select></label><button type="button" className="secondary-action" onClick={applyThemeToAssets} disabled={!assets.length}><Icon name="check" size={14} />Prévisualiser le thème</button><button type="button" className="primary-action" onClick={exportThemeBundle} disabled={!assets.some((asset) => asset.edited !== asset.original)}><Icon name="download" size={14} />Exporter le bundle patches</button></div>
        <div className="display-theme-swatches">{THEME_SOURCE_COLORS.map((source) => <label key={source}><span style={{ background: source }} title={`Source ${source}`} /><input type="color" value={themeColors[source] ?? source} aria-label={`Remplacer ${source}`} onChange={(event) => { setThemeName("Personnalisé"); setThemeColors((current) => ({ ...current, [source]: event.target.value })); }} /></label>)}</div>
        <small className="display-theme-note">Le thème recolore le texte SVG connu sans toucher aux dimensions. Les images originales restent conservées et chaque résultat sera exporté comme patch séparé.</small>
      </section>

      {grouped.length > 0 && (
        <div className="display-groups">
          {grouped.map((group) => (
            <div className="display-category" key={group.category}>
              <h3>{DISPLAY_CATEGORY_LABELS[group.category]}<small>{group.items.length}</small></h3>
              <div className="display-grid">
                {group.items.map((asset) => (
                  <button type="button" key={asset.file} className={`display-card ${activeFile === asset.file ? "is-active" : ""} ${asset.edited !== asset.original ? "is-edited" : ""}`} onClick={() => setActiveFile(asset.file)}>
                    <span className="display-card-preview" dangerouslySetInnerHTML={{ __html: asset.edited }} />
                    <span className="display-card-dimensions">{asset.width}×{asset.height}</span>
                    <span className="display-card-meta"><strong>{asset.file}</strong><em className={`confidence-badge confidence-${asset.confidence}`}>{asset.confidence === "high" ? "confirmé" : asset.confidence === "medium" ? "probable" : "non confirmé"}</em></span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {active && (
        <section className="display-edit-panel" aria-label={`Édition de ${active.file}`}>
          <div className="mod-section-heading"><div><span className="section-label">{DISPLAY_CATEGORY_LABELS[active.category].toUpperCase()}</span><strong>{active.file}</strong></div><small>{active.note}</small></div>
          <div className="display-pixel-safety"><Icon name="shield" size={14} /><span>Édition pixel bridée : aucune mise à l’échelle automatique. Les dimensions hors profil sont verrouillées.</span></div>
          <button type="button" className="primary-action display-open-pixel" onClick={() => setPixelEditorOpen(true)}><Icon name="image" size={14} />Ouvrir l’éditeur pixel dans sa fenêtre</button>
          <div className="display-edit-columns">
            <textarea className="display-edit-textarea" value={active.edited} onChange={(event) => updateActiveEdit(event.target.value)} spellCheck={false} aria-label="Code SVG éditable" />
            <div className="display-edit-preview" aria-label="Aperçu en direct" dangerouslySetInnerHTML={{ __html: active.edited }} />
          </div>
          <div className="editor-footer">
            <span>{active.edited === active.original ? "Aucune modification" : "Modifié localement, pas encore exporté"}</span>
            <button className="secondary-action" onClick={resetActiveEdit} disabled={active.edited === active.original}><Icon name="terminal" size={14} />Réinitialiser</button>
            <button className="primary-action" onClick={exportPatch} disabled={active.edited === active.original}><Icon name="download" size={14} />Exporter le patch JSON</button>
          </div>
        </section>
      )}
      {active && pixelEditorOpen && <div className="display-editor-modal" role="dialog" aria-modal="true" aria-label={`Éditeur pixel ${active.file}`}><div className="display-editor-modal-card"><div className="display-editor-modal-head"><div><span className="section-label">ÉDITEUR PIXEL OP-1</span><strong>{active.file}</strong></div><button type="button" className="secondary-action" onClick={() => setPixelEditorOpen(false)}>Fermer</button></div><Op1PixelEditor width={active.width} height={active.height} sourceSvg={active.edited} filename={active.file} onNotice={onNotice} /></div></div>}
    </div>
  );
}

function MachineControls({ onNotice }: { onNotice: (message: string) => void }) {
  const [values, setValues] = useState([42, 58, 31, 67]);
  const controls = [
    { label: "BLEU", name: "Tempo", color: "blue" },
    { label: "VERT", name: "Volume", color: "green" },
    { label: "BLANC", name: "Pan", color: "white" },
    { label: "ROUGE", name: "Effet", color: "red" },
  ];

  return (
    <section className="machine-controls" aria-label="Commandes OP-1">
      <div className="machine-controls-head"><span className="section-label">SURFACE OP-1</span><small>Commandes du clone et du MIDI</small></div>
      <div className="machine-controls-grid">{controls.map((control, index) => <label className={`machine-knob machine-knob-${control.color}`} key={control.label}><span className="machine-knob-cap"><i style={{ transform: `rotate(${values[index] * 2.7 - 135}deg)` }} /></span><span className="machine-knob-label">{control.label}</span><strong>{control.name}</strong><input aria-label={control.name} type="range" min="0" max="100" value={values[index]} onChange={(event) => { const next = [...values]; next[index] = Number(event.target.value); setValues(next); }} onDoubleClick={() => onNotice(`${control.name} réinitialisé.`)} /><output>{values[index]}</output></label>)}</div>
    </section>
  );
}

function TapeMachine() {
  const meters = ["Track 1", "Track 2", "Track 3", "Track 4"];
  return (
    <section className="tape-machine" aria-label="Machine Tape OP-1">
      <div className="tape-machine-screen"><span>STUDIO TAPE</span><strong>00:00:00</strong><small>4 TRACK · 44.1 kHz · 16 bit</small></div>
      <div className="tape-reels" aria-hidden="true"><i /><div className="tape-head-mark" /><i /></div>
      <div className="tape-machine-meters">{meters.map((meter, index) => <div className="tape-meter" key={meter}><span>{meter}</span><div className="meter-scale"><i style={{ height: `${32 + index * 9}%` }} /></div><small>-{12 - index * 2} dB</small></div>)}</div>
    </section>
  );
}

type MidiEvent = { type: "note_on" | "note_off"; note: number; velocity: number; time: number };

function MidiRoll({ events, onToggleNote }: { events: MidiEvent[]; onToggleNote: (note: number, time: number) => void }) {
  const notes = [72, 71, 69, 67, 65, 64, 62, 60];
  const cells = Array.from({ length: 16 }, (_, index) => index);
  return (
    <section className="midi-roll" aria-label="Piano roll MIDI">
      <div className="midi-roll-head"><div><span className="section-label">ÉDITEUR MIDI</span><strong>Piano-roll Tape</strong></div><small>{events.length ? `${events.length} événements capturés` : "Aucune note capturée"}</small></div>
      <div className="midi-roll-grid">{notes.map((note) => <div className="midi-roll-row" key={note}><span>{note === 60 ? "C4" : note}</span>{cells.map((cell) => { const time = cell * 0.5; const active = events.some((event) => event.type === "note_on" && event.note === note && Math.abs(event.time - time) < 0.05); return <button type="button" aria-label={`${active ? "Supprimer" : "Ajouter"} la note ${note} à ${time.toFixed(1)} seconde`} className={active ? "is-note" : ""} onClick={() => onToggleNote(note, time)} key={`${note}-${cell}`} />; })}</div>)}</div>
      <div className="midi-roll-scale"><span>00:00</span><span>00:02</span><span>00:04</span><span>00:06</span></div>
    </section>
  );
}

function GlobalArrangement({ files, offsets, position, playing, onSeek, onMoveClip, onTogglePlay }: { files: Record<number, string>; offsets: Record<number, number>; position: number; playing: boolean; onSeek: (time: number) => void; onMoveClip: (index: number, time: number) => void; onTogglePlay: () => void }) {
  const tracks = ["Track 1", "Track 2", "Track 3", "Track 4"];
  return (
    <section className="global-arrangement" aria-label="Vue globale de la bande">
      <div className="global-arrangement-head"><div><span className="section-label">VUE GLOBALE</span><strong>Partition Tape · 6 minutes</strong><small>Les quatre pistes restent alignées sur le même transport.</small></div><button className="primary-action" onClick={onTogglePlay}><Icon name={playing ? "check" : "wave"} size={15} />{playing ? "Arrêter" : "Lecture globale"}</button></div>
      <div className="arrangement-ruler"><span>00:00</span><span>01:00</span><span>02:00</span><span>03:00</span><span>04:00</span><span>05:00</span><span>06:00</span></div>
      <div className="arrangement-body" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const index = Number(event.dataTransfer.getData("text/plain")); if (!Number.isInteger(index)) return; const rect = event.currentTarget.getBoundingClientRect(); onMoveClip(index, Math.max(0, Math.min(360, ((event.clientX - rect.left) / rect.width) * 360))); }} onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); onSeek(Math.max(0, Math.min(360, ((event.clientX - rect.left) / rect.width) * 360))); }}>
        <div className="arrangement-playhead" style={{ left: `${(position / 360) * 100}%` }} />
        {tracks.map((track, index) => <div className="arrangement-row" key={track}><span>{track}</span><div className={`arrangement-clip ${files[index] ? "has-source" : ""}`} draggable={Boolean(files[index])} onDragStart={(event) => { event.dataTransfer.setData("text/plain", String(index)); event.dataTransfer.effectAllowed = "move"; }} style={{ transform: `translateX(${((offsets[index] ?? 0) / 360) * 100}%)` }}><i />{files[index] ?? "Piste vide"}</div></div>)}
      </div>
    </section>
  );
}

function CloneSurface({ onSendMidi, onNotice }: { onSendMidi: (data: number[]) => void; onNotice: (message: string) => void }) {
  const [pressed, setPressed] = useState<number[]>([]);
  const audioContext = useRef<AudioContext | null>(null);
  const oscillators = useRef<Record<number, OscillatorNode>>({});
  const keys = [
    { note: 60, label: "C4", key: "a", black: false }, { note: 61, label: "C#4", key: "w", black: true }, { note: 62, label: "D4", key: "s", black: false }, { note: 63, label: "D#4", key: "e", black: true }, { note: 64, label: "E4", key: "d", black: false }, { note: 65, label: "F4", key: "f", black: false }, { note: 66, label: "F#4", key: "t", black: true }, { note: 67, label: "G4", key: "g", black: false }, { note: 68, label: "G#4", key: "y", black: true }, { note: 69, label: "A4", key: "h", black: false }, { note: 70, label: "A#4", key: "u", black: true }, { note: 71, label: "B4", key: "j", black: false }, { note: 72, label: "C5", key: "k", black: false },
  ];

  function noteOn(note: number) {
    if (pressed.includes(note)) return;
    const context = audioContext.current ?? new AudioContext(); audioContext.current = context; void context.resume();
    const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.frequency.value = 440 * Math.pow(2, (note - 69) / 12); gain.gain.setValueAtTime(0.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.015); oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillators.current[note] = oscillator; setPressed((current) => [...current, note]); onSendMidi([0x90, note, 100]);
  }
  function noteOff(note: number) {
    const oscillator = oscillators.current[note]; if (oscillator && audioContext.current) { oscillator.stop(audioContext.current.currentTime + 0.04); delete oscillators.current[note]; } setPressed((current) => current.filter((item) => item !== note)); onSendMidi([0x80, note, 0]);
  }
  useEffect(() => { const down = (event: KeyboardEvent) => { const item = keys.find((key) => key.key === event.key.toLowerCase()); if (item) { event.preventDefault(); noteOn(item.note); } }; const up = (event: KeyboardEvent) => { const item = keys.find((key) => key.key === event.key.toLowerCase()); if (item) noteOff(item.note); }; window.addEventListener("keydown", down); window.addEventListener("keyup", up); return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); }; });
  return <section className="clone-surface" aria-label="Clone OP-1 contrôlable"><div className="clone-surface-head"><div><span className="section-label">CLONE OP-1</span><strong>Surface jouable</strong><small>Clavier de l’ordinateur ou clavier MIDI connecté</small></div><button className="secondary-action" onClick={() => onNotice("Le clavier local joue une synthèse de contrôle. Le son OP-1 réel passe par la sortie audio USB.")}><Icon name="wave" size={14} />Source audio</button></div><div className="clone-keyboard">{keys.map((item) => <button type="button" className={`${item.black ? "clone-key black-key" : "clone-key"} ${pressed.includes(item.note) ? "is-pressed" : ""}`} key={item.note} onPointerDown={() => noteOn(item.note)} onPointerUp={() => noteOff(item.note)} onPointerLeave={() => { if (pressed.includes(item.note)) noteOff(item.note); }}><strong>{item.label}</strong><small>{item.key.toUpperCase()}</small></button>)}</div></section>;
}

function UsbAudioMonitor({ onNotice }: { onNotice: (message: string) => void }) {
  const [active, setActive] = useState(false);
  const [deviceLabel, setDeviceLabel] = useState("Interface audio du système");
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  async function toggle() {
    if (active) { streamRef.current?.getTracks().forEach((track) => track.stop()); void contextRef.current?.close(); streamRef.current = null; contextRef.current = null; setActive(false); return; }
    if (!navigator.mediaDevices?.getUserMedia) { onNotice("Cette fenêtre ne donne pas accès à l’audio USB. Utilisez Chrome ou Edge en local."); return; }
    try { let stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const devices = await navigator.mediaDevices.enumerateDevices(); const op1 = devices.find((device) => device.kind === "audioinput" && device.label.toUpperCase().includes("OP-1")); if (op1 && stream.getAudioTracks()[0].getSettings().deviceId !== op1.deviceId) { stream.getTracks().forEach((track) => track.stop()); stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: op1.deviceId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); setDeviceLabel(op1.label); } else { setDeviceLabel(op1?.label ?? "Entrée audio sélectionnée"); } const context = new AudioContext(); const source = context.createMediaStreamSource(stream); source.connect(context.destination); streamRef.current = stream; contextRef.current = context; setActive(true); onNotice("Audio USB OP-1 routé vers la sortie du Studio."); } catch { onNotice("L’accès audio a été refusé ou aucune interface OP-1 n’est disponible."); }
  }
  return <section className="usb-audio-panel"><div><span className="section-label">AUDIO MACHINE</span><strong>{active ? "Son OP-1 actif" : "Son OP-1 disponible"}</strong><small>{deviceLabel} · casque recommandé pour éviter le Larsen</small></div><button className={active ? "primary-action is-active" : "secondary-action"} onClick={toggle}><Icon name="wave" size={14} />{active ? "Couper l’audio" : "Écouter l’OP-1"}</button></section>;
}

function TrackGainControls({ tracks, gains, onChange }: { tracks: string[]; gains: Record<number, number>; onChange: (index: number, value: number) => void }) {
  return <section className="track-gain-panel" aria-label="Gain des pistes"><div className="mod-section-heading"><div><span className="section-label">MIXAGE LOCAL</span><strong>Gain des quatre pistes</strong></div><small>Persisté dans le projet</small></div><div className="track-gain-grid">{tracks.map((track, index) => <label key={track}><span>{track}</span><input type="range" min="0" max="1" step="0.01" value={gains[index] ?? 1} onChange={(event) => onChange(index, Number(event.target.value))} /><output>{Math.round((gains[index] ?? 1) * 100)}%</output></label>)}</div></section>;
}

function TrimEditor({ track, max, end, onChange, onClose }: { track: string; max: number; end: number; onChange: (value: number) => void; onClose: () => void }) {
  const [start, setStart] = useState(0);
  const safeEnd = Math.max(start + 0.1, Math.min(end, max));
  const duration = Math.max(0, safeEnd - start);
  return <div className="trim-editor" aria-label={`Trim de ${track}`}>
    <div className="trim-editor-head"><div><span className="section-label">TRIM ACTIF</span><strong>{track}</strong></div><button type="button" className="secondary-action" onClick={onClose}>Retour aux réglages</button></div>
    <div className="trim-waveform" aria-label="Forme d’onde de la sélection"><div className="trim-selection" style={{ left: `${(start / max) * 100}%`, right: `${100 - (safeEnd / max) * 100}%` }} />{Array.from({ length: 32 }, (_, index) => <i key={index} style={{ height: `${22 + ((index * 37) % 68)}%` }} />)}<input aria-label="Poignée de début" type="range" min="0" max={max} step="0.1" value={start} onChange={(event) => setStart(Math.min(Number(event.target.value), safeEnd - 0.1))} /><input aria-label="Poignée de fin" type="range" min="0.1" max={max} step="0.1" value={safeEnd} onChange={(event) => onChange(Math.max(start + 0.1, Number(event.target.value)))} /></div>
    <div className="trim-editor-meta"><label>Début <output>{start.toFixed(1)} s</output></label><strong>{duration.toFixed(1)} s sélectionnées</strong><label>Fin <output>{safeEnd.toFixed(1)} s</output></label></div>
  </div>;
}

function TrackEditControls({ tracks, durations, clipEnds, fadeIns, fadeOuts, trimTrack, onTrimTrack, onChange }: { tracks: string[]; durations: Record<number, number>; clipEnds: Record<number, number>; fadeIns: Record<number, number>; fadeOuts: Record<number, number>; trimTrack: number | null; onTrimTrack: (index: number | null) => void; onChange: (kind: "end" | "fadeIn" | "fadeOut", index: number, value: number) => void }) {
  if (trimTrack !== null) {
    const max = durations[trimTrack] && Number.isFinite(durations[trimTrack]) ? durations[trimTrack] : 360;
    return <section className="track-edit-panel" aria-label="Edition du trim"><TrimEditor track={tracks[trimTrack]} max={max} end={Math.min(clipEnds[trimTrack] ?? max, max)} onChange={(value) => onChange("end", trimTrack, value)} onClose={() => onTrimTrack(null)} /></section>;
  }
  return <section className="track-edit-panel" aria-label="Edition des clips"><div className="mod-section-heading"><div><span className="section-label">EDITION NON DESTRUCTIVE</span><strong>Trim et fondus</strong></div><small>Les sources restent intactes</small></div><div className="track-edit-grid">{tracks.map((track, index) => { const max = durations[index] && Number.isFinite(durations[index]) ? durations[index] : 360; const end = Math.min(clipEnds[index] ?? max, max); return <div className="track-edit-row" key={track}><strong>{track}</strong><button type="button" className="secondary-action trim-open-button" onClick={() => onTrimTrack(index)}>Trim · {Number(end.toFixed(1))} s</button><label>Fade in <input type="number" min="0" max="10" step="0.1" value={fadeIns[index] ?? 0} onChange={(event) => onChange("fadeIn", index, Number(event.target.value))} /><small>s</small></label><label>Fade out <input type="number" min="0" max="10" step="0.1" value={fadeOuts[index] ?? 0} onChange={(event) => onChange("fadeOut", index, Number(event.target.value))} /><small>s</small></label></div>; })}</div></section>;
}

function audioBufferToWav(buffer: AudioBuffer) {
  const channels = Math.min(2, buffer.numberOfChannels); const frames = buffer.length; const bytes = 2; const dataSize = frames * channels * bytes; const output = new ArrayBuffer(44 + dataSize); const view = new DataView(output); const write = (offset: number, value: string) => [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0))); write(0, "RIFF"); view.setUint32(4, 36 + dataSize, true); write(8, "WAVE"); write(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true); view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * channels * bytes, true); view.setUint16(32, channels * bytes, true); view.setUint16(34, 16, true); write(36, "data"); view.setUint32(40, dataSize, true);
  let offset = 44; for (let frame = 0; frame < frames; frame += 1) for (let channel = 0; channel < channels; channel += 1) { const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[frame])); view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true); offset += 2; }
  return new Blob([output], { type: "audio/wav" });
}

// Stems Tape (`track_N.aif`) et faces Album (`side_a.aif`/`side_b.aif`) sont
// de l'AIFF mono, pas du WAV stéréo (docs/AUDIO_FILE_FORMAT_REFERENCE.md
// §1, §3) — repéré avant d'être livré : ces exports imitaient déjà les noms
// de fichiers réels de l'OP-1 sans en avoir le format, ce qui les aurait
// rendus inutilisables tels quels sur la machine. `encodeAiffPcm16` est le
// même encodeur que `app/lib/audioConvert.ts` (Sons), un seul endroit dans
// le dépôt qui écrit de l'AIFF.
function audioBufferToAiffMono(buffer: AudioBuffer): Blob {
  const frames = buffer.length;
  const channels = buffer.numberOfChannels;
  const mono = new Float32Array(frames);
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let frame = 0; frame < frames; frame += 1) mono[frame] += data[frame] / channels;
  }
  return new Blob([encodeAiffPcm16(mono, 1, buffer.sampleRate)], { type: "audio/aiff" });
}

function WaveformOverview({ tracks, peaks }: { tracks: string[]; peaks: Record<number, number[]> }) {
  return <section className="waveform-overview" aria-label="Formes d&apos;onde audio calculees"><div className="mod-section-heading"><div><span className="section-label">ANALYSE AUDIO</span><strong>Formes d&apos;onde réelles</strong></div><small>24 points par piste</small></div><div className="waveform-overview-grid">{tracks.map((track, index) => <div className="waveform-overview-row" key={track}><span>{track}</span><div>{(peaks[index] ?? Array.from({ length: 24 }, () => 0)).map((peak, peakIndex) => <i key={`${index}-${peakIndex}`} style={{ height: `${Math.max(4, peak * 100)}%` }} />)}</div></div>)}</div></section>;
}

function TapeEditor({ onNotice, onConnectMidi, onSendMidi }: { onNotice: (message: string) => void; onConnectMidi: (options?: { silent?: boolean }) => Promise<boolean>; onSendMidi: (data: number[]) => void }) {
  const tracks = ["Track 1", "Track 2", "Track 3", "Track 4"];
  const [files, setFiles] = useState<Record<number, string>>({});
  const [sources, setSources] = useState<Record<number, string>>({});
  const [sourceRefs, setSourceRefs] = useState<Record<number, { path: string; status: "linked" | "reconnect" }>>({});
  const [durations, setDurations] = useState<Record<number, number>>({});
  const [clipOffsets, setClipOffsets] = useState<Record<number, number>>({});
  const [gains, setGains] = useState<Record<number, number>>({});
  const [clipEnds, setClipEnds] = useState<Record<number, number>>({});
  const [fadeIns, setFadeIns] = useState<Record<number, number>>({});
  const [fadeOuts, setFadeOuts] = useState<Record<number, number>>({});
  const [trimTrack, setTrimTrack] = useState<number | null>(null);
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [waveformPeaks, setWaveformPeaks] = useState<Record<number, number[]>>({});
  const [muted, setMuted] = useState<Record<number, boolean>>({});
  const [solo, setSolo] = useState<number | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [tempo, setTempo] = useState(90);
  const [recording, setRecording] = useState(false);
  const [looping, setLooping] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [screenFolded, setScreenFolded] = useState(false);
  const [keyboardFolded, setKeyboardFolded] = useState(false);
  const [transportTime, setTransportTime] = useState(0);
  const [transportPlaying, setTransportPlaying] = useState(false);
  const [studioMode, setStudioMode] = useState<"clone" | "midi">("clone");
  const [midiNotes, setMidiNotes] = useState(0);
  const [pressedMidiNotes, setPressedMidiNotes] = useState<number[]>([]);
  const [midiEvents, setMidiEvents] = useState<Array<{ type: "note_on" | "note_off"; note: number; velocity: number; time: number }>>([]);
  const [projectName, setProjectName] = useState("Nouveau projet OP-1");
  const projectInputRef = useRef<HTMLInputElement>(null);
  const midiHandler = useRef<((event: MIDIMessageEvent) => void) | null>(null);
  const midiInputRef = useRef<MidiInputLike | null>(null);
  const midiInputsRef = useRef<MidiInputLike[]>([]);
  const midiStartRef = useRef(0);
  const midiTimersRef = useRef<number[]>([]);
  const autoMidiAttemptedRef = useRef(false);

  useEffect(() => {
    if (autoMidiAttemptedRef.current) return;
    autoMidiAttemptedRef.current = true;
    void onConnectMidi({ silent: true });
  }, [onConnectMidi]);

  // L'OP-1 expose deux ports MIDI sous Windows. Le retour visuel du clone
  // doit rester actif même quand aucune capture n'est en cours.
  useEffect(() => {
    if (recording) return;
    const request = (navigator as MidiNavigator).requestMIDIAccess;
    if (!request) return;
    let disposed = false;
    let inputs: MidiInputLike[] = [];
    const handler = (event: MIDIMessageEvent) => {
      const message = decodeMidiNote(event.data);
      if (!message) return;
      if (message.type === "note_on") {
        setPressedMidiNotes((current) => current.includes(message.note) ? current : [...current, message.note]);
      } else {
        setPressedMidiNotes((current) => current.filter((note) => note !== message.note));
      }
    };
    void request().then((access) => {
      if (disposed) return;
      inputs = [...access.inputs.values()].filter((port) => port.name?.toUpperCase().includes("OP-1"));
      inputs.forEach((port) => { port.onmidimessage = handler; });
    }).catch(() => undefined);
    return () => {
      disposed = true;
      inputs.forEach((port) => { port.onmidimessage = null; });
    };
  }, [recording]);

  useEffect(() => {
    let cancelled = false;
    // Fermé au plus une fois : sans ce garde, le .finally() (fin normale du
    // calcul) et le nettoyage de l'effet (changement de sources/démontage)
    // appellent tous les deux context.close() sur le même AudioContext,
    // et le second lève "Cannot close a closed AudioContext" — vu en
    // pratique en changeant de fenêtre pendant que le calcul avait déjà fini.
    let closed = false;
    const context = new AudioContext();
    const closeOnce = () => { if (!closed) { closed = true; void context.close(); } };
    void Promise.all(Object.entries(sources).map(async ([rawIndex, source]) => { const buffer = await context.decodeAudioData(await (await fetch(source)).arrayBuffer()); const data = buffer.getChannelData(0); const bins = 24; const size = Math.max(1, Math.floor(data.length / bins)); const peaks = Array.from({ length: bins }, (_, bin) => { let peak = 0; for (let sample = bin * size; sample < Math.min(data.length, (bin + 1) * size); sample += 1) peak = Math.max(peak, Math.abs(data[sample])); return peak; }); return [Number(rawIndex), peaks] as const; })).then((entries) => { if (!cancelled) setWaveformPeaks(Object.fromEntries(entries)); }).catch(() => { if (!cancelled) setWaveformPeaks({}); }).finally(() => { closeOnce(); });
    return () => { cancelled = true; closeOnce(); };
  }, [sources]);

  function projectData() {
    return { schema: "op1-studio-project", version: 1, name: projectName, updated_at: new Date().toISOString(), tempo, sample_rate: 44100, length_seconds: 360, tracks: tracks.map((name, index) => ({ id: `track-${index + 1}`, name, mute: muted[index] === true, solo: solo === index, gain: gains[index] ?? 1, clips: files[index] ? [{ source: files[index], start: 0, offset: 0, duration: clipEnds[index] ?? durations[index] ?? 0, fade_in: fadeIns[index] ?? 0, fade_out: fadeOuts[index] ?? 0 }] : [], midi_events: index === 0 ? midiEvents : [] })), sources: Object.values(files), source_refs: tracks.flatMap((name, index) => files[index] ? [{ id: `track-${index + 1}`, path: sourceRefs[index]?.path ?? files[index], status: sourceRefs[index]?.status ?? "linked" }] : []), device: { model: "OP-1 original", midi_port: studioMode === "midi" ? "OP-1" : null } };
  }

  function saveProject() {
    const blob = new Blob([JSON.stringify(projectData(), null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "op1-project"}.op1studio.json`; link.click(); URL.revokeObjectURL(link.href);
    onNotice("Projet Studio enregistré avec ses pistes et réglages.");
  }

  function loadProject(file: File) {
    loadProjectState(file);
    return;
    void file.text().then((text) => { try { const project = JSON.parse(text) as { schema?: string; name?: string; tempo?: number; tracks?: Array<{ mute?: boolean; solo?: boolean; clips?: Array<{ source?: string }> }> }; if (project.schema !== "op1-studio-project" || project.tracks?.length !== 4) throw new Error("format"); setProjectName(project.name ?? "Projet OP-1"); setTempo(project.tempo ?? 90); const nextFiles: Record<number, string> = {}; const nextMuted: Record<number, boolean> = {}; let nextSolo: number | null = null; project.tracks.forEach((track, index) => { const source = track.clips?.[0]?.source; if (source) nextFiles[index] = source; if (track.mute) nextMuted[index] = true; if (track.solo) nextSolo = index; }); setFiles(nextFiles); setMuted(nextMuted); setSolo(nextSolo); onNotice("Projet Studio chargé. Les sources audio doivent être re-sélectionnées si elles ont changé de dossier."); } catch { onNotice("Projet invalide : utilisez un fichier .op1studio.json créé par OP-1 Studio."); } });
  }

  function loadProjectState(file: File) {
    void file.text().then((text) => { try {
      const project = JSON.parse(text) as { schema?: string; name?: string; tempo?: number; tracks?: Array<{ mute?: boolean; solo?: boolean; gain?: number; clips?: Array<{ source?: string; duration?: number; fade_in?: number; fade_out?: number }>; midi_events?: MidiEvent[] }>; sources?: Array<{ id?: string; path?: string; status?: string } | string>; source_refs?: Array<{ id?: string; path?: string; status?: string } | string> };
      if (project.schema !== "op1-studio-project" || project.tracks?.length !== 4) throw new Error("format");
      const nextFiles: Record<number, string> = {}; const nextSourceRefs: Record<number, { path: string; status: "linked" | "reconnect" }> = {}; const nextDurations: Record<number, number> = {}; const nextEnds: Record<number, number> = {}; const nextFadeIns: Record<number, number> = {}; const nextFadeOuts: Record<number, number> = {}; const nextMuted: Record<number, boolean> = {}; const nextGains: Record<number, number> = {}; let nextSolo: number | null = null;
      project.tracks.forEach((track, index) => { const clip = track.clips?.[0]; if (clip?.source) { nextFiles[index] = clip.source; nextSourceRefs[index] = { path: clip.source, status: "reconnect" }; } if (typeof clip?.duration === "number") { nextDurations[index] = clip.duration; nextEnds[index] = clip.duration; } if (typeof clip?.fade_in === "number") nextFadeIns[index] = clip.fade_in; if (typeof clip?.fade_out === "number") nextFadeOuts[index] = clip.fade_out; if (track.mute) nextMuted[index] = true; if (typeof track.gain === "number") nextGains[index] = Math.max(0, Math.min(1, track.gain)); if (track.solo) nextSolo = index; });
      (project.source_refs ?? project.sources)?.forEach((source, index) => { const reference = typeof source === "string" ? { path: source, status: "reconnect" } : source.path ? { path: source.path, status: "reconnect" } : null; if (reference) nextSourceRefs[index] = { path: reference.path, status: "reconnect" }; });
      const events = project.tracks[0].midi_events ?? [];
      setProjectName(project.name ?? "Projet OP-1"); setTempo(project.tempo ?? 90); setFiles(nextFiles); setSourceRefs(nextSourceRefs); setSources({}); setDurations(nextDurations); setClipEnds(nextEnds); setFadeIns(nextFadeIns); setFadeOuts(nextFadeOuts); setMuted(nextMuted); setGains(nextGains); setSolo(nextSolo); setMidiEvents(events); setMidiNotes(events.filter((event) => event.type === "note_on").length); onNotice("Projet Studio chargé. Les références audio sont conservées ; re-sélectionnez chaque source pour reconnecter la lecture.");
    } catch { onNotice("Projet invalide : utilisez un fichier .op1studio.json créé par OP-1 Studio."); } });
  }

  async function toggleMidiRecording() {
    if (recording) {
      midiInputsRef.current.forEach((input) => { input.onmidimessage = null; });
      midiHandler.current = null;
      midiInputRef.current = null;
      midiInputsRef.current = [];
      setRecording(false);
      onNotice(`Capture MIDI terminée : ${midiNotes} note${midiNotes === 1 ? "" : "s"} reçue${midiNotes === 1 ? "" : "s"}.`);
      return;
    }
    if (!await onConnectMidi()) return;
    const request = (navigator as MidiNavigator).requestMIDIAccess;
    if (!request) return;
    const access = await request();
    const inputs = [...access.inputs.values()].filter((port) => port.name?.toUpperCase().includes("OP-1"));
    const input = inputs[0];
    if (!input) return;
    setMidiNotes(0);
    setMidiEvents([]);
    midiStartRef.current = performance.now();
    const handler = (event: MIDIMessageEvent) => { const message = decodeMidiNote(event.data); if (!message) return; if (message.type === "note_on") { setMidiNotes((count) => count + 1); setPressedMidiNotes((current) => current.includes(message.note) ? current : [...current, message.note]); } else setPressedMidiNotes((current) => current.filter((note) => note !== message.note)); setMidiEvents((current) => [...current, { ...message, time: Number(((performance.now() - midiStartRef.current) / 1000).toFixed(4)) }]); };
    midiHandler.current = handler;
    midiInputRef.current = input;
    midiInputsRef.current = inputs;
    inputs.forEach((port) => { port.onmidimessage = handler; });
    setRecording(true);
    onNotice("Capture MIDI active : les notes de l’OP-1 sont comptées dans le projet local.");
  }
  const audioRefs = useRef<Record<number, HTMLAudioElement | null>>({});

  useEffect(() => {
    Object.entries(audioRefs.current).forEach(([index, audio]) => { if (audio) audio.volume = gains[Number(index)] ?? 1; });
  }, [gains]);

  useEffect(() => {
    if (!transportPlaying) return;
    let frame = 0;
    const process = () => {
      Object.entries(audioRefs.current).forEach(([rawIndex, audio]) => { if (!audio) return; const index = Number(rawIndex); const end = clipEnds[index] ?? durations[index] ?? 360; const fadeIn = fadeIns[index] ?? 0; const fadeOut = fadeOuts[index] ?? 0; if (audio.currentTime >= end) { audio.pause(); audio.currentTime = end; } let level = gains[index] ?? 1; if (fadeIn > 0 && audio.currentTime < fadeIn) level *= audio.currentTime / fadeIn; if (fadeOut > 0 && audio.currentTime > end - fadeOut) level *= Math.max(0, (end - audio.currentTime) / fadeOut); audio.volume = Math.max(0, Math.min(1, level)); });
      frame = window.requestAnimationFrame(process);
    };
    frame = window.requestAnimationFrame(process);
    return () => window.cancelAnimationFrame(frame);
  }, [clipEnds, durations, fadeIns, fadeOuts, gains, transportPlaying]);

  useEffect(() => {
    if (!transportPlaying) return;
    let frame = 0;
    const sync = () => {
      const master = audioRefs.current[0] ?? Object.values(audioRefs.current).find((audio): audio is HTMLAudioElement => Boolean(audio));
      if (master) setTransportTime(Math.min(360, master.currentTime));
      else setTransportTime((current) => Math.min(360, current + 1 / 60));
      frame = window.requestAnimationFrame(sync);
    };
    frame = window.requestAnimationFrame(sync);
    return () => window.cancelAnimationFrame(frame);
  }, [transportPlaying]);

  function toggleGlobalPlayback() {
    if (transportPlaying) {
      Object.values(audioRefs.current).forEach((audio) => audio?.pause());
      midiTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      midiTimersRef.current = [];
      // Relâche visuellement les touches encore actives si on coupe la lecture en cours de route.
      setPressedMidiNotes([]);
      setTransportPlaying(false);
      return;
    }
    const loaded = Object.values(audioRefs.current).filter((audio): audio is HTMLAudioElement => Boolean(audio));
    // Le transport avance aussi avec des pistes vides pour tester le workflow Tape.
    loaded.forEach((audio) => { audio.currentTime = transportTime < audio.duration ? transportTime : 0; void audio.play(); });
    midiEvents.forEach((event) => {
      const delay = Math.max(0, (event.time - transportTime) * 1000);
      const timer = window.setTimeout(() => {
        onSendMidi([event.type === "note_on" ? 0x90 : 0x80, event.note, event.type === "note_on" ? event.velocity : 0]);
        // Anime aussi le clavier construit pendant la relecture logicielle du
        // piano-roll, pas seulement pour les notes reçues d'un OP-1 physique.
        if (event.type === "note_on") setPressedMidiNotes((current) => current.includes(event.note) ? current : [...current, event.note]);
        else setPressedMidiNotes((current) => current.filter((note) => note !== event.note));
      }, delay);
      midiTimersRef.current.push(timer);
    });
    setTransportPlaying(true);
  }

  function toggleRollNote(note: number, time: number) {
    const existing = midiEvents.find((event) => event.type === "note_on" && event.note === note && Math.abs(event.time - time) < 0.05);
    if (existing) {
      setMidiEvents((current) => current.filter((event) => !(event.note === note && Math.abs(event.time - time) < 0.05)));
      return;
    }
    const next = [...midiEvents, { type: "note_on" as const, note, velocity: 100, time }, { type: "note_off" as const, note, velocity: 0, time: time + 0.45 }];
    setMidiEvents(next.sort((left, right) => left.time - right.time));
  }

  function quantizeMidi() {
    if (!midiEvents.length) { onNotice("Ajoutez ou capturez des notes MIDI avant de quantifier."); return; }
    const step = (60 / Math.max(20, tempo)) / 4;
    const open = new Map<number, number>();
    const quantized = midiEvents.map((event) => {
      const time = Math.max(0, Math.round(event.time / step) * step);
      if (event.type === "note_on") open.set(event.note, time);
      if (event.type === "note_off") {
        const start = open.get(event.note);
        if (start !== undefined) { open.delete(event.note); return { ...event, time: Math.max(start + step / 4, time) }; }
      }
      return { ...event, time };
    }).sort((left, right) => left.time - right.time);
    setMidiEvents(quantized);
    onNotice(`MIDI quantifié sur une grille 1/16 à ${tempo} BPM.`);
  }

  async function renderOffline() {
    const entries = Object.entries(sources).filter(([, source]) => Boolean(source));
    if (!entries.length) { onNotice("Chargez au moins une piste avant de lancer le rendu WAV."); return; }
    try {
      const sampleRate = 44100; const soloed = solo !== null;
      const context = new AudioContext(); const decoded = await Promise.all(entries.map(async ([rawIndex, source]) => ({ index: Number(rawIndex), buffer: await context.decodeAudioData(await (await fetch(source)).arrayBuffer()) }))); await context.close(); const maxEnd = Math.min(360, Math.max(...decoded.map(({ index, buffer }) => clipEnds[index] ?? durations[index] ?? buffer.duration), 1));
      const offline = new OfflineAudioContext(2, Math.ceil(maxEnd * sampleRate), sampleRate);
      decoded.forEach(({ index, buffer }) => { if (muted[index] || (soloed && solo !== index)) return; const clipEnd = Math.min(maxEnd, clipEnds[index] ?? durations[index] ?? buffer.duration); const fadeIn = Math.min(clipEnd, fadeIns[index] ?? 0); const fadeOut = Math.min(clipEnd, fadeOuts[index] ?? 0); const source = offline.createBufferSource(); const gain = offline.createGain(); source.buffer = buffer; const level = gains[index] ?? 1; gain.gain.setValueAtTime(fadeIn ? 0 : level, 0); if (fadeIn) gain.gain.linearRampToValueAtTime(level, fadeIn); if (fadeOut) { gain.gain.setValueAtTime(level, Math.max(fadeIn, clipEnd - fadeOut)); gain.gain.linearRampToValueAtTime(0, clipEnd); } source.connect(gain).connect(offline.destination); source.start(0); source.stop(clipEnd); });
      const rendered = await offline.startRendering(); const blob = audioBufferToWav(rendered); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "op1-project"}.wav`; link.click(); URL.revokeObjectURL(link.href); onNotice("Rendu WAV terminé : gain, trim, mute/solo et fades appliqués.");
    } catch { onNotice("Le rendu WAV a échoué. Vérifiez les sources audio locales et réessayez."); }
  }

  async function exportTapeStems() {
    const entries = Object.entries(sources).filter(([, source]) => Boolean(source));
    if (!entries.length) { onNotice("Chargez au moins une piste avant l'export Tape."); return; }
    try {
      const sampleRate = 44100; const context = new AudioContext(); const decoded = await Promise.all(entries.map(async ([rawIndex, source]) => ({ index: Number(rawIndex), buffer: await context.decodeAudioData(await (await fetch(source)).arrayBuffer()) }))); await context.close(); const soloed = solo !== null;
      for (const { index, buffer } of decoded) {
        if (muted[index] || (soloed && solo !== index)) continue;
        const end = Math.min(360, clipEnds[index] ?? durations[index] ?? buffer.duration); const fadeIn = Math.min(end, fadeIns[index] ?? 0); const fadeOut = Math.min(end, fadeOuts[index] ?? 0); const offline = new OfflineAudioContext(2, Math.ceil(end * sampleRate), sampleRate); const sourceNode = offline.createBufferSource(); const gainNode = offline.createGain(); sourceNode.buffer = buffer; const level = gains[index] ?? 1; gainNode.gain.setValueAtTime(fadeIn ? 0 : level, 0); if (fadeIn) gainNode.gain.linearRampToValueAtTime(level, fadeIn); if (fadeOut) { gainNode.gain.setValueAtTime(level, Math.max(fadeIn, end - fadeOut)); gainNode.gain.linearRampToValueAtTime(0, end); } sourceNode.connect(gainNode).connect(offline.destination); sourceNode.start(0); sourceNode.stop(end); const rendered = await offline.startRendering(); const link = document.createElement("a"); link.href = URL.createObjectURL(audioBufferToAiffMono(rendered)); link.download = `track_${index + 1}.aif`; link.click(); URL.revokeObjectURL(link.href); await new Promise((resolve) => window.setTimeout(resolve, 120));
      }
      onNotice("Stems Tape exportés : quatre fichiers AIFF mono (track_1.aif…track_4.aif), prêts pour validation.");
    } catch { onNotice("L'export Tape a échoué. Vérifiez les fichiers audio locaux."); }
  }

  async function exportAlbumFaces() {
    const entries = Object.entries(sources).filter(([, source]) => Boolean(source));
    if (!entries.length) { onNotice("Chargez au moins une piste avant l'export Album."); return; }
    try {
      const sampleRate = 44100; const context = new AudioContext(); const decoded = await Promise.all(entries.map(async ([rawIndex, source]) => ({ index: Number(rawIndex), buffer: await context.decodeAudioData(await (await fetch(source)).arrayBuffer()) }))); await context.close(); const maxEnd = Math.min(360, Math.max(...decoded.map(({ index, buffer }) => clipEnds[index] ?? durations[index] ?? buffer.duration), 1)); const offline = new OfflineAudioContext(2, Math.ceil(maxEnd * sampleRate), sampleRate); const soloed = solo !== null;
      decoded.forEach(({ index, buffer }) => { if (muted[index] || (soloed && solo !== index)) return; const end = Math.min(maxEnd, clipEnds[index] ?? durations[index] ?? buffer.duration); const fadeIn = Math.min(end, fadeIns[index] ?? 0); const fadeOut = Math.min(end, fadeOuts[index] ?? 0); const sourceNode = offline.createBufferSource(); const gainNode = offline.createGain(); sourceNode.buffer = buffer; const level = gains[index] ?? 1; gainNode.gain.setValueAtTime(fadeIn ? 0 : level, 0); if (fadeIn) gainNode.gain.linearRampToValueAtTime(level, fadeIn); if (fadeOut) { gainNode.gain.setValueAtTime(level, Math.max(fadeIn, end - fadeOut)); gainNode.gain.linearRampToValueAtTime(0, end); } sourceNode.connect(gainNode).connect(offline.destination); sourceNode.start(0); sourceNode.stop(end); });
      const rendered = await offline.startRendering(); const faceLength = 180; const downloads: string[] = []; for (let face = 0; face < 2; face += 1) { const start = face * faceLength; const length = Math.max(0, Math.min(faceLength, maxEnd - start)); const faceBuffer = new AudioBuffer({ length: Math.max(1, Math.ceil(length * sampleRate)), numberOfChannels: 2, sampleRate }); for (let channel = 0; channel < 2; channel += 1) faceBuffer.copyToChannel(rendered.getChannelData(channel).subarray(Math.ceil(start * sampleRate), Math.ceil(start * sampleRate) + faceBuffer.length), channel); const link = document.createElement("a"); link.href = URL.createObjectURL(audioBufferToAiffMono(faceBuffer)); link.download = `side_${face === 0 ? "a" : "b"}.aif`; link.click(); URL.revokeObjectURL(link.href); downloads.push(link.download); await new Promise((resolve) => window.setTimeout(resolve, 120)); }
      const manifest = new Blob([JSON.stringify({ schema: "op1-album-export", version: 1, project: projectName, tempo, sample_rate: sampleRate, channels: 1, faces: downloads, source_tracks: entries.map(([rawIndex]) => Number(rawIndex) + 1) }, null, 2)], { type: "application/json" }); const manifestLink = document.createElement("a"); manifestLink.href = URL.createObjectURL(manifest); manifestLink.download = "album-manifest.json"; manifestLink.click(); URL.revokeObjectURL(manifestLink.href); onNotice("Album exporté : deux faces AIFF mono (side_a.aif, side_b.aif) et manifeste générés.");
    } catch { onNotice("L'export Album a échoué. Vérifiez les sources audio locales."); }
  }

  function seekTransport(time: number) {
    setTransportTime(time);
    Object.values(audioRefs.current).forEach((audio) => { if (audio) audio.currentTime = time; });
  }

  function togglePlay(index: number) {
    const audio = audioRefs.current[index];
    if (!audio) {
      onNotice("Chargez d’abord une piste audio locale.");
      return;
    }
    if (playing === index) {
      audio.pause();
      setPlaying(null);
    } else {
      Object.values(audioRefs.current).forEach((item) => item?.pause());
      void audio.play();
      setPlaying(index);
    }
  }

  return (
    <div className="tool-body tape-editor">

      {/* ── Transport strip (toujours visible) ── */}
      <div className="studio-top-strip">
        <StudioModeHeader Icon={Icon} mode={studioMode} onModeChange={setStudioMode} onConnectMidi={onConnectMidi} />
        <StudioTransportPanel Icon={Icon} tempo={tempo} recording={recording} looping={looping} reversed={reversed} mode={studioMode} midiNotes={midiNotes} onPlay={toggleGlobalPlayback} onRecord={toggleMidiRecording} onQuantize={quantizeMidi} onLoopChange={setLooping} onTempoChange={setTempo} onConnectMidi={onConnectMidi} onReversedChange={setReversed} />
      </div>

      {/* ── Panneau Écran (escamotable) ── */}
      <div className={`studio-slide-panel studio-screen-panel${screenFolded ? " is-folded" : ""}`}>
        <button
          className="slide-panel-toggle"
          onClick={() => setScreenFolded(!screenFolded)}
          title={screenFolded ? "Déplier l’écran" : "Replier l’écran"}
        >
          <span>{screenFolded ? "▶ Écran" : "◀ Replier écran"}</span>
        </button>

        {/* Contenu quand déplié : SVG tape editor */}
        {!screenFolded && (
          <StudioTapeEditor
            tracks={tracks}
            files={files}
            sources={sources}
            sourceRefs={sourceRefs}
            waveformPeaks={waveformPeaks}
            clipOffsets={clipOffsets}
            clipEnds={clipEnds}
            durations={durations}
            muted={muted}
            solo={solo}
            playing={playing}
            selectedTrack={selectedTrack}
            position={transportTime}
            transportPlaying={transportPlaying}
            looping={looping}
            audioRefs={audioRefs}
            onFileLoad={(index, file) => {
              setFiles({ ...files, [index]: file.name });
              setSourceRefs({ ...sourceRefs, [index]: { path: file.name, status: "linked" } });
              setSources({ ...sources, [index]: URL.createObjectURL(file) });
              setDurations({ ...durations, [index]: 0 });
              setSelectedTrack(index);
              onNotice(`${tracks[index]} chargée localement.`);
            }}
            onTogglePlay={togglePlay}
            onSoloChange={(index) => setSolo(solo === index ? null : index)}
            onMuteChange={(index) => setMuted({ ...muted, [index]: !muted[index] })}
            onDurationChange={(index, duration) => setDurations((current) => ({ ...current, [index]: duration }))}
            onTrackEnd={() => { if (transportPlaying) setTransportPlaying(false); setPlaying(null); }}
            onOffsetChange={(index, offset) => setClipOffsets((current) => ({ ...current, [index]: offset }))}
            onSelectTrack={setSelectedTrack}
            onSeek={seekTransport}
            reversed={reversed}
          />
        )}

        {/* Contenu quand replié : réglages affichage */}
        {screenFolded && (
          <div className="panel-settings display-settings">
            <h3>Réglages affichage</h3>

            {trimTrack !== null && (
              <TrackEditControls
                tracks={tracks}
                durations={durations}
                clipEnds={clipEnds}
                fadeIns={fadeIns}
                fadeOuts={fadeOuts}
                trimTrack={trimTrack}
                onTrimTrack={setTrimTrack}
                onChange={(kind, index, value) => {
                  if (kind === "end") setClipEnds((c) => ({ ...c, [index]: value }));
                  else if (kind === "fadeIn") setFadeIns((c) => ({ ...c, [index]: value }));
                  else setFadeOuts((c) => ({ ...c, [index]: value }));
                }}
              />
            )}

            <StudioProjectToolbar
              Icon={Icon}
              projectName={projectName}
              inputRef={projectInputRef}
              onProjectNameChange={setProjectName}
              onNew={() => { setProjectName("Nouveau projet OP-1"); setFiles({}); setSources({}); setSourceRefs({}); onNotice("Nouveau projet Studio créé."); }}
              onOpen={() => projectInputRef.current?.click()}
              onSave={saveProject}
              onLoad={loadProject}
              onImport={() => onNotice("Import préparé : les 4 pistes seront rangées dans le dossier tape après confirmation.")}
            />

            <div className="studio-render-actions">
              <div className="studio-render-action"><button className="primary-action" onClick={renderOffline}><Icon name="wave" size={15} />Rendu WAV</button><small>Mixe les pistes.</small></div>
              <div className="studio-render-action"><button className="secondary-action" onClick={exportTapeStems}><Icon name="tape" size={15} />Stems</button><small>Un AIFF mono par piste.</small></div>
              <div className="studio-render-action"><button className="secondary-action" onClick={exportAlbumFaces}><Icon name="archive" size={15} />Album</button><small>Deux faces AIFF + manifeste.</small></div>
            </div>

            <div className="tape-import-note">
              <Icon name="shield" size={14} />
              <span><small>Le clone prépare les pistes dans tape/. Copie vers OP-1 après sauvegarde et éjection.</small></span>
            </div>
          </div>
        )}
      </div>

      {/* ── Panneau Clavier (escamotable) ── */}
      <div className="studio-slide-panel studio-keyboard-panel">
        <button
          className="slide-panel-toggle"
          type="button"
          disabled
          title="Clavier Studio visible"
        >
          <span>▼ Clavier Studio</span>
        </button>

        {/* Contenu quand déplié : clone clavier */}
        <StudioMachinePanel
          pressedNotes={pressedMidiNotes}
          mode={studioMode}
          playing={transportPlaying}
          position={transportTime}
          files={files}
          onTogglePlayback={toggleGlobalPlayback}
          onSendMidi={onSendMidi}
        />

        {/* Contenu quand replié : réglages clavier */}
        {keyboardFolded && (
          <div className="panel-settings keyboard-settings">
            <h3>Réglages clavier</h3>
            <div className="settings-row">
              <label>Mode</label>
              <select value={studioMode} onChange={(e) => setStudioMode(e.target.value as "clone" | "midi")}>
                <option value="clone">Clone local</option>
                <option value="midi">MIDI externe</option>
              </select>
            </div>
            <div className="settings-row">
              <label>Tempo</label>
              <input type="number" min="40" max="200" value={tempo} onChange={(e) => setTempo(Number(e.target.value))} /> BPM
            </div>
            <div className="settings-row">
              <label>Boucle</label>
              <button className={`track-state${looping ? " is-active" : ""}`} onClick={() => setLooping(!looping)}>LOOP</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

const nav = [
  { label: "Firmware", icon: "chip" as IconName, active: true },
  { label: "Sauvegardes", icon: "archive" as IconName },
  { label: "Sons", icon: "wave" as IconName },
  { label: "Studio", icon: "tape" as IconName },
  { label: "Images", icon: "image" as IconName },
];

const recommendedFirmware = firmwareCatalog.releases[0];
const officialFirmwareUrl = recommendedFirmware.officialUrl;

type FirmwareMod = { id: string; category: string; title: string; detail: string; source: string; availability?: string; preview?: string; isNew?: boolean };

const firmwareMods: FirmwareMod[] = [
  { id: "playmode", category: "Écrans", title: "Écran Play Mode", detail: "Remplace l’écran du mode lecture.", source: "SOURCE_MODIFIEE/content/display/playmode.svg", preview: "/firmware-mods/playmode.svg" },
  { id: "rymd", category: "Écrans", title: "Écran RYMD", detail: "Modifie l’écran et les repères du mode RYMD.", source: "SOURCE_MODIFIEE/content/display/rymd.svg", preview: "/firmware-mods/rymd.svg" },
  { id: "tapeconfig", category: "Écrans", title: "Écran Tape Config", detail: "Remplace l’écran de configuration Tape.", source: "SOURCE_MODIFIEE/content/display/tapeconfig.svg", preview: "/firmware-mods/tapeconfig.svg" },
  { id: "op1patch", category: "Audio", title: "Patch vocal OP-1", detail: "Ajoute la ressource audio de speech modifiée.", source: "SOURCE_MODIFIEE/content/audio/speech/op1patch.raw" },
  { id: "audio", category: "Ressources", title: "Ressources audio du pack", detail: "40 RAW : synth, drum, presets et speech.", source: "SOURCE_MODIFIEE/content/audio/" },
  { id: "display", category: "Ressources", title: "Ressources graphiques du pack", detail: "61 SVG d’interface et d’écrans.", source: "SOURCE_MODIFIEE/content/display/" },
  { id: "iter", category: "Fonctions", title: "Synthé Iter", detail: "Active le synthé Iter caché dans le firmware original.", source: "op1repacker --options iter", availability: "Moteur local trouvé", isNew: true },
  { id: "presets-iter", category: "Fonctions", title: "Presets Iter", detail: "Ajoute 11 presets AIF fournis avec le moteur Iter.", source: "op1repacker --options presets-iter", availability: "Moteur local trouvé · dépend de Iter", isNew: true },
  { id: "filter", category: "Fonctions", title: "Effet Filter", detail: "Rend disponible l’effet Filter pour le traitement sonore.", source: "op1repacker --options filter", availability: "Moteur local trouvé", isNew: true },
  { id: "subtle-fx", category: "Fonctions", title: "Subtle FX", detail: "Modifie les réglages par défaut des effets pour un rendu plus léger.", source: "op1repacker --options subtle-fx", availability: "Moteur local trouvé", isNew: true },
  { id: "gfx-tape-invert", category: "Thèmes", title: "Tape inversé", detail: "Applique le patch graphique d’inversion de l’écran Tape.", source: "op1repacker --options gfx-tape-invert", availability: "Moteur local trouvé", isNew: true },
  { id: "gfx-cwo-moose", category: "Thèmes", title: "CWO Moose", detail: "Applique le patch graphique Moose au visuel CWO.", source: "op1repacker --options gfx-cwo-moose", availability: "Moteur local trouvé", isNew: true },
  { id: "gfx-iter-lab", category: "Thèmes", title: "Iter Lab", detail: "Remplace le visuel Iter par l’asset Iter Lab fourni.", source: "op1repacker --options gfx-iter-lab", availability: "Moteur local trouvé · dépend de Iter", isNew: true },
];

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: () => Promise<{ name: string }>;
};

type MidiInputLike = { name: string | null; onmidimessage: MIDIInput["onmidimessage"] };
type MidiOutputLike = { name: string | null; send: MIDIOutput["send"] };

type MidiAccessLike = {
  inputs: { values: () => Iterable<MidiInputLike> };
  outputs: { values: () => Iterable<MidiOutputLike> };
};

type MidiNavigator = Navigator & {
  requestMIDIAccess?: () => Promise<MidiAccessLike>;
};

export default function Home() {
  const [stage, setStage] = useState(0);
  const [expertOpen, setExpertOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [midiConnected, setMidiConnected] = useState(false);
  const [backupTested, setBackupTested] = useState(false);
  const [libraryFolder, setLibraryFolder] = useState<string | null>(null);
  const [toolWindow, setToolWindow] = useState<ToolWindow>(null);
  const [homeOpen, setHomeOpen] = useState(true);
  const [exerciseRunning, setExerciseRunning] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("I–V–vi–IV");
  const [firmwareOptions, setFirmwareOptions] = useState({
    verify: true,
    backup: true,
    teBoot: false,
  });
  const [firmwareSection, setFirmwareSection] = useState<"build" | "graphics">("build");
  const [studioSection, setStudioSection] = useState<"tape" | "graphics">("tape");
  const [firmwareFile, setFirmwareFile] = useState<{ name: string; size: number } | null>(null);
  const [selectedMods, setSelectedMods] = useState<Record<string, boolean>>({});
  const [selectedMod, setSelectedMod] = useState<FirmwareMod | null>(null);
  const [soundPackReady, setSoundPackReady] = useState(false);
  const [backupRoot, setBackupRoot] = useState("backups/");
  const [profile, setProfile] = useState<LocalProfile>(() => {
    if (typeof window === "undefined") return DEFAULT_PROFILE;
    const stored = window.localStorage.getItem("op1-studio-profile");
    return stored ? parseProfile(stored) : DEFAULT_PROFILE;
  });
  const folderInputRef = useRef<HTMLInputElement>(null);
  const midiOutputRef = useRef<MidiOutputLike | null>(null);

  function updateProfile(next: LocalProfile) {
    setProfile(next);
    const serialized = serializeProfile({ ...next, localSpace: { ...next.localSpace, root: backupRoot } });
    window.localStorage.setItem("op1-studio-profile", serialized);
    if (hasNativeStorage()) {
      void writeNativeProfile(backupRoot, serialized)?.catch(() => {
        setNotice("Profil local modifié dans l’interface, mais le coffre Tauri n’est pas accessible.");
      });
    }
  }

  useEffect(() => {
    if (!hasNativeStorage()) return;
    let active = true;
    void Promise.resolve(initialiseNativeLibrary(backupRoot))
      .then(() => readNativeProfile(backupRoot))
      .then((serialized) => {
        if (active && serialized) setProfile(parseProfile(serialized));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [backupRoot]);

  useEffect(() => {
    if (!toolWindow && !selectedMod && !expertOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (selectedMod) setSelectedMod(null);
      else if (expertOpen) setExpertOpen(false);
      else setToolWindow(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [expertOpen, selectedMod, toolWindow]);

  async function chooseLibraryFolder() {
    const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
    if (picker) {
      try {
        const folder = await picker();
        setLibraryFolder(folder.name);
        setNotice(`Dossier local sélectionné : ${folder.name}. Les fichiers restent sur cet appareil.`);
      } catch {
        // The user cancelled the native picker.
      }
      return;
    }
    folderInputRef.current?.click();
  }

  const logs = useMemo(() => {
    const entries = [
      ["14:32:04", "Interface sécurisée prête — aucune machine connectée"],
    ];
    if (stage >= 1) entries.push(["14:32:18", "Pont local détecté sur cette machine"]);
    if (stage >= 2) {
      entries.push(["14:32:21", "OP-1 original identifié — mode normal"]);
      entries.push(["14:32:22", "OS 243 lu — mise à jour 246 disponible"]);
    }
    if (stage >= 3) entries.push(["14:32:36", "Plan préparé — attente du mode TE-boot"]);
    return entries;
  }, [stage]);

  async function connectMidiDevice(options: { silent?: boolean } = {}) {
    const requestMIDIAccess = (navigator as MidiNavigator).requestMIDIAccess;
    if (!requestMIDIAccess) {
      if (!options.silent) setNotice("Ce navigateur ne propose pas Web MIDI. Utilisez Chrome ou Edge en local pour connecter l’OP-1.");
      return false;
    }

    try {
      const midi = await requestMIDIAccess();
      const inputs = [...midi.inputs.values()].filter((port) => port.name?.toUpperCase().includes("OP-1"));
      const input = inputs[0];
      const output = [...midi.outputs.values()].find((port) => port.name?.toUpperCase().includes("OP-1"));
      if (!input) {
        if (!options.silent) setNotice("Aucune entrée MIDI OP-1 détectée. Vérifiez le câble USB et le mode MIDI de la machine.");
        return false;
      }
      setDeviceName(input.name ?? "OP-1");
      midiOutputRef.current = output ?? null;
      setMidiConnected(true);
      setStage(2);
      if (!options.silent) setNotice(`OP-1 détecté par MIDI : ${inputs.length} port${inputs.length === 1 ? "" : "s"} en entrée${output ? " et une sortie" : ""}.`);
      return true;
    } catch {
      if (!options.silent) setNotice("L’accès MIDI a été refusé. Autorisez l’accès au port OP-1 dans le navigateur puis réessayez.");
      return false;
    }
  }

  async function notifyLocalPlan(action: "firmware.plan" | "backup.plan" | "sounds.transfer-plan", payload: Record<string, string | number | boolean>) {
    const request = prepareLocalBridgeAction(action, payload);
    try {
      const nativePlan = await prepareNativeLocalPlan(action, payload);
      if (nativePlan) {
        setNotice(`${describeLocalBridgeAction(request)} Validé par le pont Tauri.`);
        return;
      }
      setNotice(describeLocalBridgeAction(request));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Validation native refusée.";
      setNotice(`Le pont Tauri a refusé le plan : ${message}`);
    }
  }

  function testBackupPlan() {
    setBackupTested(true);
    void notifyLocalPlan("backup.plan", { root: backupRoot });
  }


  return (
    <main className="site-canvas">
      <section className="machine-shell" aria-label="OP-1 Studio">
        <header className="machine-strip">
          <div className="brand-block">
            <span className="speaker-mark" aria-hidden="true">{Array.from({ length: 16 }).map((_, index) => <i key={index} />)}</span>
            <div><strong>OP-1</strong><span>STUDIO</span></div>
          </div>

          <div className="mini-screen" aria-label="État du système">
            <span className="screen-kicker">FIRMWARE CONTROL</span>
            <strong>{deviceName ? "OP-1 CONNECTÉ" : "NO DEVICE"}</strong>
            <div className="screen-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
          </div>

          <div className="knob-group" aria-label="Codes couleur de progression">
            <span className="knob knob-blue"><i /></span>
            <span className="knob knob-green"><i /></span>
            <span className="knob knob-white"><i /></span>
            <span className="knob knob-orange"><i /></span>
          </div>

          <div className={`bridge-state ${stage > 0 ? "online" : ""}`}>
            <span className="state-dot" />
            <div><small>{midiConnected ? "MIDI USB" : "PONT LOCAL"}</small><strong>{midiConnected ? "CONNECTÉ" : "REQUIS"}</strong></div>
          </div>
        </header>

        <div className="workspace">
          <aside className="sidebar">
            <nav aria-label="Navigation principale">
              <p className="nav-label">CONTRÔLE</p>
              <button className={`nav-item ${homeOpen ? "active" : ""}`} onClick={() => { setHomeOpen(true); setToolWindow(null); }}>
                <Icon name="archive" /><span>Accueil</span>
              </button>
              {nav.map((item) => (
                <button
                  key={item.label}
                  className={item.active ? "nav-item active" : "nav-item"}
                    onClick={() => { setHomeOpen(false); if (item.label === "Sauvegardes") setToolWindow("backups"); else if (item.label === "Sons") setToolWindow("sounds"); else if (item.label === "Studio") setToolWindow("tape"); else if (item.label === "Images") setToolWindow("editor"); else setToolWindow(null); }}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  {!item.active && <small>BIENTÔT</small>}
                </button>
              ))}
            </nav>

            <div className="sidebar-spacer" />

            <button className="nav-item" onClick={() => { setHomeOpen(false); setToolWindow("docs"); }}>
              <Icon name="book" /><span>Documentation</span>
            </button>
            <button className="nav-item" onClick={() => { setHomeOpen(false); setToolWindow("exercise"); }}>
              <Icon name="wave" /><span>Exercices MIDI</span>
            </button>
            <button className="nav-item" onClick={() => setNotice("Les réglages restent locaux dans la version de base.")}>
              <Icon name="settings" /><span>Réglages</span>
            </button>

          </aside>

          {homeOpen ? <HomeHub Icon={Icon} onOpen={(id) => { setHomeOpen(false); if (id === "graphics") setToolWindow("editor"); else if (id === "firmware") setToolWindow(null); else setToolWindow(id as ToolWindow); }} /> : <div className="content">
            <div className="page-heading">
              <div>
                <span className="eyebrow"><Icon name="shield" size={16} /> FIRMWARE / CENTRE DE CONTRÔLE</span>
                <h1>Votre OP‑1, sous contrôle.</h1>
                <p>Identifier, sauvegarder, vérifier et mettre à jour avec un plan lisible à chaque étape.</p>
              </div>
            </div>

            {notice && <div className="notice" role="status"><Icon name="shield" size={17} /><span>{notice}</span><button aria-label="Fermer" onClick={() => setNotice(null)}>×</button></div>}

            <section className="library-folder" aria-labelledby="library-folder-title">
              <div className="library-folder-icon"><Icon name="archive" size={21} /></div>
              <div className="library-folder-copy">
                <span className="section-label">BIBLIOTHÈQUE LOCALE</span>
                <h2 id="library-folder-title">Firmwares, samples et sauvegardes</h2>
                <p>{libraryFolder ? `Dossier actif : ${libraryFolder}` : "Choisissez un dossier racine pour réunir vos fichiers OP-1."}</p>
              </div>
              <button className="folder-action" onClick={chooseLibraryFolder}>{libraryFolder ? "Changer de dossier" : "Choisir un dossier"}</button>
              <input ref={folderInputRef} className="visually-hidden" type="file" /* Chromium fallback */ {...({ webkitdirectory: "", directory: "" } as Record<string, string>)} onChange={(event) => {
                const file = event.target.files?.[0];
                const folder = file?.webkitRelativePath.split("/")[0];
                if (folder) {
                  setLibraryFolder(folder);
                  setNotice(`Dossier local sélectionné : ${folder}. Les fichiers restent sur cet appareil.`);
                }
              }} />
            </section>

            <section className="device-overview" aria-labelledby="machine-title">
              <div className="device-identity">
                <div className="device-icon"><Icon name="chip" size={28} /></div>
                <div>
                  <span className="section-label">MACHINE DÉTECTÉE</span>
                  <h2 id="machine-title">{stage >= 2 ? "OP‑1 original" : "En attente d’une machine"}</h2>
                  <p>{deviceName ? "USB 2367:0004 · MIDI détecté" : "Connectez l’OP-1 en USB puis lancez la détection MIDI."}</p>
                  <button className="backup-button" onClick={testBackupPlan}><Icon name="archive" size={14} />{backupTested ? "Plan vérifié" : "Tester la sauvegarde"}</button>
                </div>
              </div>
              <div className="device-metrics">
                <div><span>OS ACTUEL</span><strong>{stage >= 2 ? "243" : "—"}</strong></div>
                <div><span>DERNIER OFFICIEL</span><strong>246</strong></div>
                <div><span>BATTERIE</span><strong>{stage >= 2 ? "84%" : "—"}</strong></div>
                <div><span>SAUVEGARDE</span><strong className={stage >= 3 ? "ok" : "warn"}>{stage >= 3 ? "VÉRIFIÉE" : "REQUISE"}</strong></div>
              </div>
            </section>

            {/* Disposition inspirée d'op1REpackerGUI (référence UX uniquement,
                voir docs/FIRMWARE_PAGE_UI_SPEC.md) : trois colonnes toujours
                visibles plutôt qu'un parcours à 4 étapes à dérouler —
                actions à gauche, mods au centre, outils secondaires à
                droite. Logique et données inchangées, seule la disposition
                change. */}
            <section id="firmware-editor" className="firmware-editor-inline" aria-labelledby="firmware-editor-title">
              <div className="section-heading"><div><span className="section-label">ÉDITEUR INTÉGRÉ</span><h2 id="firmware-editor-title">Préparer un firmware</h2></div><div className="editor-status-pills"><span className="release-pill"><i /> MODS LOCAUX</span><span className="engine-pill"><i /> OP1REPACKER 0.2.6 · TROUVÉ</span></div></div>

              <div className="firmware-panes">
                <div className="firmware-pane firmware-pane-actions">
                  <div className="editor-release"><span className="section-label">FICHIER CIBLE</span><strong>OP-1 OS {recommendedFirmware.version}</strong><small>Catalogue officiel · modification désactivée</small><a className="firmware-download-button" href={officialFirmwareUrl} target="_blank" rel="noreferrer" download={`op1_${recommendedFirmware.version}.op1`}><Icon name="download" size={17} />Télécharger le firmware officiel</a></div>
                  <label className="firmware-file-picker"><span className="section-label">FICHIER LOCAL À VÉRIFIER</span><strong>{firmwareFile ? firmwareFile.name : "Choisir un fichier .op1"}</strong><small>{firmwareFile ? `${(firmwareFile.size / 1024 / 1024).toFixed(2)} Mo · prêt pour analyse` : "Le fichier reste sur cet ordinateur."}</small><input type="file" accept=".op1,application/octet-stream" onChange={(event) => { const file = event.target.files?.[0]; if (file) setFirmwareFile({ name: file.name, size: file.size }); }} /></label>
                  <div className="inline-editor-options"><div className="mod-section-heading"><div><span className="section-label">CONTRÔLES</span><strong>Plan sécurisé</strong></div><small>{Object.values(firmwareOptions).filter(Boolean).length}/3</small></div>{Object.entries({ verify: "Vérifier origine et CRC", backup: "Exiger une sauvegarde", teBoot: "Préparer TE-boot" }).map(([key, label]) => <label key={key}><input type="checkbox" checked={firmwareOptions[key as keyof typeof firmwareOptions]} onChange={(event) => setFirmwareOptions({ ...firmwareOptions, [key]: event.target.checked })} /><span>{label}</span></label>)}<button className="primary-action" disabled={!firmwareFile} onClick={() => { if (firmwareFile) { void notifyLocalPlan("firmware.plan", { filename: firmwareFile.name, verify: firmwareOptions.verify }); setNotice("Plan firmware préparé. Aucune écriture n’est exécutée dans le prototype."); } else setNotice("Choisissez d’abord un fichier .op1 local."); }}><Icon name="shield" />Préparer le plan</button></div>
                </div>

                <div className="firmware-pane firmware-pane-mods">
                  <div className="mod-section-heading"><div><span className="section-label">SOURCE_MODIFIEE + CATALOGUE COMMUNAUTAIRE</span><strong>Mods et ressources exploitables</strong></div><small>{Object.values(selectedMods).filter(Boolean).length}/{firmwareMods.length} sélectionnés</small></div>
                  {["Écrans", "Audio", "Ressources", "Fonctions", "Thèmes"].map((category) => <div className="mod-category" key={category}><h3>{category}</h3><div className="mod-grid">{firmwareMods.filter((mod) => mod.category === category).map((mod) => <label key={mod.id} className="mod-option"><input type="checkbox" checked={selectedMods[mod.id] === true} onChange={(event) => setSelectedMods({ ...selectedMods, [mod.id]: event.target.checked })} />{mod.preview ? <button type="button" className="mod-preview-button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setSelectedMod(mod); }}><img src={mod.preview} alt={`Aperçu ${mod.title}`} /></button> : <span className="mod-placeholder"><Icon name={mod.id === "op1patch" || mod.category === "Audio" ? "wave" : "archive"} size={17} /></span>}<span><strong>{mod.title} {mod.isNew && <em className="mod-new-badge">NOUVEAU</em>}</strong><small>{mod.detail}</small><em>{mod.source}</em>{mod.availability && <em className="mod-availability">{mod.availability}</em>}</span></label>)}</div></div>)}
                </div>

                <div className="firmware-pane firmware-pane-tools">
                  <div className="mod-section-heading"><div><span className="section-label">IMAGES &amp; SVG</span><strong>Outils graphiques</strong></div></div>
                  <button type="button" className="secondary-action firmware-tool-link" onClick={() => setToolWindow("editor")}><Icon name="image" size={15} />Ouvrir l’atelier graphique</button>
                  <p className="tool-note"><code>tools/display_bridge.py</code> trie les écrans et exporte un patch non destructif par fichier ; <code>tools/svg_preflight.py</code> valide un SVG avant modification.</p>

                  <div className="mod-section-heading"><div><span className="section-label">VÉRIFICATION</span><strong>Bridges locaux</strong></div></div>
                  <p className="tool-note"><code>tools/firmware_inspector.py</code> revalide CRC/LZMA/TAR sans jamais extraire de chemin dangereux ; <code>tools/firmware_fetch.py</code> ne télécharge que depuis l’hôte officiel. Détail complet des commandes dans <code>README.md</code>.</p>
                </div>
              </div>
            </section>

          </div>}
        </div>
      </section>

      {selectedMod && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedMod(null)}>
          <section className="mod-detail-window" role="dialog" aria-modal="true" aria-labelledby="mod-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="window-close mod-detail-close" aria-label="Fermer" onClick={() => setSelectedMod(null)}>×</button>
            {selectedMod.preview ? <img className="mod-detail-image" src={selectedMod.preview} alt={`Aperçu agrandi ${selectedMod.title}`} /> : <div className="mod-detail-placeholder"><Icon name={selectedMod.id === "op1patch" ? "wave" : "archive"} size={34} /></div>}
            <span className="section-label">{selectedMod.category} · SOURCE_MODIFIEE</span>
            <h2 id="mod-detail-title">{selectedMod.title}</h2>
            <p>{selectedMod.detail}</p>
            <div className="mod-detail-meta"><strong>Source</strong><code>{selectedMod.source}</code><strong>État</strong><span>Disponible pour sélection · aucune écriture automatique</span></div>
          </section>
        </div>
      )}

      {expertOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setExpertOpen(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="expert-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className="modal-icon"><Icon name="terminal" size={25} /></span>
            <span className="section-label">ZONE À RISQUE</span>
            <h2 id="expert-title">Le Labo expert reste séparé.</h2>
            <p>Les outils de repack peuvent inspecter ou préparer un firmware modifié, mais ils ne pourront jamais écrire directement sur l’OP‑1 depuis cet écran.</p>
            <ul>
              <li>activation volontaire et avertissement persistant ;</li>
              <li>processus isolé, version épinglée et empreinte vérifiée ;</li>
              <li>export manuel marqué comme non officiel ;</li>
              <li>aucun mélange avec le catalogue Teenage Engineering.</li>
            </ul>
            <button onClick={() => setExpertOpen(false)}>J’ai compris</button>
          </section>
        </div>
      )}

      {toolWindow && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setToolWindow(null)}>
          <section className="tool-window" role="dialog" aria-modal="true" aria-labelledby="tool-window-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="tool-window-header">
              <div>
                <span className="section-label">OP-1 STUDIO / OUTIL</span>
                <h2 id="tool-window-title">{toolWindow === "exercise" ? "Exercices MIDI" : toolWindow === "docs" ? "Documentation rapide" : toolWindow === "backups" ? "Sauvegardes" : toolWindow === "sounds" ? "Bibliothèque de sons" : toolWindow === "tape" ? "Studio · Tape & Album" : "Éditeur firmware"}</h2>
              </div>
              <button className="window-close" aria-label="Fermer" onClick={() => setToolWindow(null)}>×</button>
            </div>

            <ToolWindowTabs tabs={[
                ["editor", "Images", "image"],
                ["backups", "Sauvegardes", "archive"],
                ["sounds", "Sons", "wave"],
                ["tape", "Studio", "tape"],
                ["exercise", "Exercices", "settings"],
                ["docs", "Documentation", "book"],
              ].map(([id, label, icon]) => ({ id, label, icon: <Icon name={icon as IconName} size={14} /> }))} activeId={toolWindow ?? ""} onSelect={(id) => setToolWindow(id as ToolWindow)} />

            {/* pressedNotes pas encore branché : l'état MIDI (pressedMidiNotes) vit
                dans TapeEditor, un composant frère, pas dans ce scope. À faire
                remonter d'un niveau si on veut que les touches jouées en vrai
                s'allument ici aussi ; la cible qui tombe fonctionne déjà sans. */}
            {toolWindow === "exercise" && <ExercisePanel Icon={Icon} selectedExercise={selectedExercise} running={exerciseRunning} onExerciseChange={setSelectedExercise} onToggle={() => setExerciseRunning((running) => !running)} />}

            {toolWindow === "docs" && <DocumentationPanel />}

            {toolWindow === "editor" && (
              <div className="tool-body image-studio-page">
                <div className="image-studio-hero"><div><span className="section-label">OP-1 STUDIO / IMAGES</span><strong>L’atelier graphique</strong><small>Dessine, explore et prépare tes écrans OP-1 avec les bonnes dimensions.</small></div><span className="image-studio-count">BANQUE DYNAMIQUE</span></div>
                <DisplayCreatorPanel Icon={Icon} onNotice={setNotice} /><DisplayEditor root={backupRoot} onNotice={setNotice} />
                {/* L’éditeur image est autonome : le build firmware reste dans sa page dédiée. */}
                <div className="image-studio-note"><Icon name="shield" size={14} /><span>Les originaux restent conservés. Les dimensions et profils machine sont contrôlés avant tout export.</span></div>
              </div>
            )}
            {false && (
              <div className="tool-body">
                <div className="editor-release"><span className="section-label">FICHIER CIBLE</span><strong>OP-1 OS {recommendedFirmware.version}</strong><small>Catalogue officiel · modification désactivée</small><a href={officialFirmwareUrl} target="_blank" rel="noreferrer">Télécharger depuis Teenage Engineering</a></div>
                <label className="firmware-file-picker"><span className="section-label">FICHIER LOCAL À VÉRIFIER</span><strong>{firmwareFile?.name ?? "Choisir un fichier .op1"}</strong><small>{firmwareFile ? `${((firmwareFile?.size ?? 0) / 1024 / 1024).toFixed(2)} Mo · prêt pour analyse` : "Le fichier reste sur cet ordinateur."}</small><input type="file" accept=".op1,application/octet-stream" onChange={(event) => { const file = event.target.files?.[0]; if (file) setFirmwareFile({ name: file.name, size: file.size }); }} /></label>
                <div className="mod-section">
                  <div className="mod-section-heading"><div><span className="section-label">SOURCE_MODIFIEE</span><strong>Mods disponibles</strong></div><small>{Object.values(selectedMods).filter(Boolean).length}/{firmwareMods.length} sélectionnés</small></div>
                  <div className="mod-grid">{firmwareMods.map((mod) => <label key={mod.id} className="mod-option"><input type="checkbox" checked={selectedMods[mod.id] === true} onChange={(event) => setSelectedMods({ ...selectedMods, [mod.id]: event.target.checked })} />{mod.preview ? <img src={mod.preview} alt={`Aperçu ${mod.title}`} /> : <span className="mod-placeholder"><Icon name={mod.id === "op1patch" ? "wave" : "archive"} size={17} /></span>}<span><strong>{mod.title}</strong><small>{mod.detail}</small><em>{mod.source}</em></span></label>)}</div>
                </div>
                <div className="editor-options">
                  <label><input type="checkbox" checked={firmwareOptions.verify} onChange={(event) => setFirmwareOptions({ ...firmwareOptions, verify: event.target.checked })} /><span><strong>Vérifier l’origine et le CRC</strong><small>Refuser un fichier incomplet ou non reconnu.</small></span></label>
                  <label><input type="checkbox" checked={firmwareOptions.backup} onChange={(event) => setFirmwareOptions({ ...firmwareOptions, backup: event.target.checked })} /><span><strong>Exiger une sauvegarde</strong><small>Créer un snapshot avant toute opération sensible.</small></span></label>
                  <label><input type="checkbox" checked={firmwareOptions.teBoot} onChange={(event) => setFirmwareOptions({ ...firmwareOptions, teBoot: event.target.checked })} /><span><strong>Préparer le mode TE-boot</strong><small>Afficher les étapes manuelles avant la mise à jour.</small></span></label>
                </div>
                <div className="editor-footer"><span>{Object.values(firmwareOptions).filter(Boolean).length}/3 contrôles activés</span><button className="primary-action" disabled={!firmwareFile} onClick={() => setNotice(firmwareFile ? "Plan firmware préparé. Aucune écriture n’est exécutée dans le prototype." : "Choisissez d’abord un fichier .op1 local.")}><Icon name="shield" />Préparer le plan</button></div>
                
              </div>
            )}

            {toolWindow === "backups" && <BackupPanel Icon={Icon} backupRoot={backupRoot} profile={profile} onBackupRootChange={setBackupRoot} onProfileChange={updateProfile} onNotice={setNotice} onOpenSounds={() => setToolWindow("sounds")} describePlan={(root) => { void notifyLocalPlan("backup.plan", { root }); }} />}

            {toolWindow === "sounds" && <SoundsPanel Icon={Icon} ready={soundPackReady} onPreparePack={() => { setSoundPackReady(true); void notifyLocalPlan("sounds.transfer-plan", { packReady: true }); }} onTransfer={() => { if (soundPackReady) void notifyLocalPlan("sounds.transfer-plan", { packReady: true }); else setNotice("Préparez d’abord le pack de sons."); }} />}

            {toolWindow === "tape" && <>
              <nav className="studio-main-tabs" aria-label="Section principale du Studio"><button type="button" className="is-active"><Icon name="tape" size={14} />Tape &amp; Album</button></nav>
              {studioSection === "tape" ? <TapeEditor onNotice={setNotice} onConnectMidi={connectMidiDevice} onSendMidi={(data) => midiOutputRef.current?.send?.(data)} /> : <div className="studio-graphics-workspace"><div className="studio-graphics-head"><div><span className="section-label">STUDIO / GRAPHISMES</span><strong>Éditeur des écrans OP-1</strong><small>Thèmes, fenêtres de synthèse et assets firmware sous contrôle des dimensions.</small></div><span className="studio-graphics-badge">53 × 320×160</span></div><DisplayCreatorPanel Icon={Icon} onNotice={setNotice} /><DisplayEditor root={backupRoot} onNotice={setNotice} /></div>}
            </>}

          </section>
        </div>
      )}
    </main>
  );
}
