"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { sAbonner } from "@studio-hub/midi-dispatch";
// Le rack du hub, importe tel quel. Ce studio n'avait aucun moteur de synthese
// a lui : op1SynthEngine joue des samples, pas des patches.
import AudioPluginRack from "../../studio-hub/src/pages/AudioPluginRack";

/**
 * Ce que les gestionnaires MIDI de cette page lisent reellement d'un
 * MIDIMessageEvent : le seul champ `data`. Nommer la forme plutot que de
 * caster — un `as unknown as` a deja masque une interop impossible ici.
 */
type EvenementMidiLu = { data: Uint8Array | null };
import firmwareCatalog from "../data/firmware/catalog.json";
import { describeLocalBridgeAction, prepareLocalBridgeAction } from "./lib/localBridge";
import { decodeMidiNote } from "./lib/midi";
import { prepareNativeLocalPlan, readDisplayLibrary } from "./lib/nativeStorage";
import { encodeAiffPcm16, encodeWavPcm16 } from "./lib/audioConvert";
import { op1AudioEngine } from "./lib/op1SynthEngine";
import { HomeHub } from "./components/HomeHub";
// import { DocumentationPanel } from "./components/DocumentationPanel"; // Moved to Hub
import { DisplayCreatorPanel } from "./components/DisplayCreatorPanel";
import { Op1PixelEditor } from "./components/Op1PixelEditor";
import { ExercisePanel } from "./components/ExercisePanel";
import { BackupPanel } from "./components/BackupPanel";
import { SoundsPanel } from "./components/SoundsPanel";
import { ServiceHub } from "./components/ServiceHub";
import { StudioModeHeader } from "./components/StudioModeHeader";
import { StudioMachinePanel } from "./components/StudioMachinePanel";
import { StudioProjectToolbar } from "./components/StudioProjectToolbar";
import { StudioTapeEditor } from "./components/StudioTapeEditor";
import { StudioTrackList } from "./components/StudioTrackList";
import { ToolWindowTabs } from "./components/ToolWindowTabs";
import { useHubInitialization } from "./hooks/useHubInitialization";
import { sanitizeSvg } from "./lib/sanitizeSvg";
import { hubCommunication, incrementHubCounter, OP1_PROJECTS_SAVED_KEY, OP1_SAMPLES_PREPARED_KEY } from "./lib/hubCommunication";
import type { HubNoteMessage, HubTransportMessage } from "@studio-hub/midi-bridge";

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

type ToolWindow = "exercise" | "editor" | "backups" | "sounds" | "services" | "tape" | null;

function hubReturnUrl() {
  return new URLSearchParams(window.location.search).get("hubReturn") || (typeof window !== "undefined" ? window.location.origin : "/");
}

function initialHubTool(): { tool: ToolWindow; homeOpen: boolean } {
  if (typeof window === "undefined") return { tool: "tape", homeOpen: false };
  const requested = new URLSearchParams(window.location.search).get("hubTool");
  if (requested === "firmware") return { tool: null, homeOpen: false };
  const tools: ToolWindow[] = ["exercise", "editor", "backups", "sounds", "services", "tape"];
  return tools.includes(requested as ToolWindow)
    ? { tool: requested as ToolWindow, homeOpen: false }
    : { tool: "tape", homeOpen: false };
}

const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function returnToHub() {
  if ((window as any).navigateMaquette) {
    (window as any).navigateMaquette("outils");
    return;
  }
  const target = hubReturnUrl();
  if (window.opener && !window.opener.closed) {
    window.opener.focus();
    window.close();
    return;
  }
  window.location.assign(target);
}

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
                    <span className="display-card-preview" dangerouslySetInnerHTML={{ __html: sanitizeSvg(asset.edited) }} />
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
            <div className="display-edit-preview" aria-label="Aperçu en direct" dangerouslySetInnerHTML={{ __html: sanitizeSvg(active.edited) }} />
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

type MidiEvent = { type: "note_on" | "note_off"; note: number; velocity: number; time: number };
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
  const [recordingStartPos, setRecordingStartPos] = useState(0);
  const recordingRef = useRef(false);
  const recordStartPosRef = useRef(0);
  useEffect(() => { recordStartPosRef.current = recordingStartPos; }, [recordingStartPos]);
  const selectedTrackRef = useRef(selectedTrack);
  useEffect(() => { selectedTrackRef.current = selectedTrack; }, [selectedTrack]);
  const [looping, setLooping] = useState(false);
  const [loopIn, setLoopIn] = useState(0);
  const [loopOut, setLoopOut] = useState(16);
  const [reversed, setReversed] = useState(false);
  const [screenFolded, setScreenFolded] = useState(false);
  const [screenScale, setScreenScale] = useState(1);
  const [keyboardFolded, setKeyboardFolded] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("op1-studio-view-config-v1") ?? "{}") as { screenScale?: number };
      if (typeof saved.screenScale === "number") setScreenScale(Math.max(0.5, Math.min(1, saved.screenScale)));
    } catch { /* préférence locale absente ou invalide */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem("op1-studio-view-config-v1", JSON.stringify({ screenScale })); } catch { /* stockage local indisponible */ }
  }, [screenScale]);
  // Rack audio du hub. Replie par defaut, contrairement aux deux autres :
  // il n'a rien a faire a l'ecran tant qu'on ne le demande pas, et ses
  // ecouteurs clavier sont poses sur `window`.
  const [rackFolded, setRackFolded] = useState(true);
  const [activeModal, setActiveModal] = useState<"tracks" | "engines" | "project" | "midi" | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<"project" | "view" | "midi" | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<string>("FM");
  const [selectedPatch, setSelectedPatch] = useState<string>("Classic 01");
  const [selectedSoundCategory, setSelectedSoundCategory] = useState<string>("Synth");
  const [transportTime, setTransportTime] = useState(0);
  const [transportPlaying, setTransportPlaying] = useState(false);
  const [studioMode, setStudioMode] = useState<"clone" | "midi">("clone");
  const [midiNotes, setMidiNotes] = useState(0);
  const [pressedMidiNotes, setPressedMidiNotes] = useState<number[]>([]);
  // Octets bruts du dernier message MIDI reçu, quel que soit son type — pas
  // seulement note on/off comme pressedMidiNotes (decodeMidiNote ignore CC
  // et le reste). Alimente le journal MIDI et la procédure d'association de
  // StudioMachinePanel (14 août 2026) : nouvelle référence à chaque message,
  // même si les octets se répètent, pour que le composant distingue « rien
  // de nouveau » de « le même message est arrivé deux fois ».
  const [lastRawMidiIn, setLastRawMidiIn] = useState<number[] | null>(null);
  const [midiEvents, setMidiEvents] = useState<Array<{ type: "note_on" | "note_off"; note: number; velocity: number; time: number }>>([]);
  const [projectName, setProjectName] = useState("Nouveau projet OP-1");
  const projectInputRef = useRef<HTMLInputElement>(null);
  const midiHandler = useRef<((event: EvenementMidiLu) => void) | null>(null);
  /** Desabonnement du repartiteur pendant l'enregistrement MIDI. */
  const desabonnerEnregistrementRef = useRef<(() => void) | null>(null);
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

  // Synchronisation du moteur audio OP-1 actif
  useEffect(() => {
    op1AudioEngine.setEngine(selectedEngine);
  }, [selectedEngine]);

  // L'OP-1 expose deux ports MIDI sous Windows. Le retour visuel et sonore du clone
  // reste actif même quand aucune capture n'est en cours.
  useEffect(() => {
    if (recording) return;
    const request = (navigator as MidiNavigator).requestMIDIAccess?.bind(navigator);
    if (!request) return;
    let disposed = false;
    let inputs: MidiInputLike[] = [];
    const handler = (event: EvenementMidiLu) => {
      if (event.data) setLastRawMidiIn([...event.data]);
      const message = decodeMidiNote(event.data);
      if (!message) return;
      if (message.type === "note_on") {
        op1AudioEngine.triggerNoteOn(message.note, message.velocity || 100);
        setPressedMidiNotes((current) => current.includes(message.note) ? current : [...current, message.note]);
      } else {
        op1AudioEngine.triggerNoteOff(message.note);
        setPressedMidiNotes((current) => current.filter((note) => note !== message.note));
      }
    };
    // Abonnement au repartiteur, plutot qu'une ecriture directe.
    //
    // `inputs.forEach(p => p.onmidimessage = handler)` ecrasait le
    // gestionnaire de tous les autres, et le nettoyage les remettait TOUS
    // a null. Ouvrir le studio OP-1 rendait donc le rack muet, et le
    // quitter coupait le MIDI de la page suivante.
    const seDesabonner = sAbonner(({ donnees }) => {
      if (disposed) return;
      handler({ data: donnees } as EvenementMidiLu);
    });
    return () => {
      disposed = true;
      seDesabonner();
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
    return { schema: "op1-studio-project", version: 1, name: projectName, updated_at: new Date().toISOString(), tempo, sample_rate: 44100, length_seconds: 360, tracks: tracks.map((name, index) => ({ id: `track-${index + 1}`, name, mute: muted[index] === true, solo: solo === index, gain: gains[index] ?? 1, clips: files[index] ? [{ source: files[index], start: 0, offset: 0, duration: clipEnds[index] ?? durations[index] ?? 0, fade_in: fadeIns[index] ?? 0, fade_out: fadeOuts[index] ?? 0 }] : [], midi_events: index === 0 ? midiEvents : [] })), sources: Object.values(files), source_refs: tracks.flatMap((name, index) => files[index] ? [{ id: `track-${index + 1}`, path: sourceRefs[index]?.path ?? files[index], status: sourceRefs[index]?.status ?? "linked" }] : []), device: { model: "OP-1 original", midi_port: studioMode === "midi" ? "OP-1" : null }, sound: { engine: selectedEngine, patch: selectedPatch }, view: { screen_scale: screenScale, screen_open: !screenFolded, keyboard_open: !keyboardFolded } };
  }

  function saveProject() {
    const blob = new Blob([JSON.stringify(projectData(), null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "op1-project"}.op1studio.json`; link.click(); URL.revokeObjectURL(link.href);
    hubCommunication.updateStats({ projectsSaved: incrementHubCounter(OP1_PROJECTS_SAVED_KEY) });
    onNotice("Projet Studio enregistré avec ses pistes et réglages.");
  }

  function loadProject(file: File) {
    loadProjectState(file);
    return;
    void file.text().then((text) => { try { const project = JSON.parse(text) as { schema?: string; name?: string; tempo?: number; tracks?: Array<{ mute?: boolean; solo?: boolean; clips?: Array<{ source?: string }> }> }; if (project.schema !== "op1-studio-project" || project.tracks?.length !== 4) throw new Error("format"); setProjectName(project.name ?? "Projet OP-1"); setTempo(project.tempo ?? 90); const nextFiles: Record<number, string> = {}; const nextMuted: Record<number, boolean> = {}; let nextSolo: number | null = null; project.tracks.forEach((track, index) => { const source = track.clips?.[0]?.source; if (source) nextFiles[index] = source; if (track.mute) nextMuted[index] = true; if (track.solo) nextSolo = index; }); setFiles(nextFiles); setMuted(nextMuted); setSolo(nextSolo); onNotice("Projet Studio chargé. Les sources audio doivent être re-sélectionnées si elles ont changé de dossier."); } catch { onNotice("Projet invalide : utilisez un fichier .op1studio.json créé par OP-1 Studio."); } });
  }

  function loadProjectState(file: File) {
    void file.text().then((text) => { try {
      const project = JSON.parse(text) as { schema?: string; name?: string; tempo?: number; tracks?: Array<{ mute?: boolean; solo?: boolean; gain?: number; clips?: Array<{ source?: string; duration?: number; fade_in?: number; fade_out?: number }>; midi_events?: MidiEvent[] }>; sources?: Array<{ id?: string; path?: string; status?: string } | string>; source_refs?: Array<{ id?: string; path?: string; status?: string } | string>; view?: { screen_scale?: number } };
      if (project.schema !== "op1-studio-project" || project.tracks?.length !== 4) throw new Error("format");
      const nextFiles: Record<number, string> = {}; const nextSourceRefs: Record<number, { path: string; status: "linked" | "reconnect" }> = {}; const nextDurations: Record<number, number> = {}; const nextEnds: Record<number, number> = {}; const nextFadeIns: Record<number, number> = {}; const nextFadeOuts: Record<number, number> = {}; const nextMuted: Record<number, boolean> = {}; const nextGains: Record<number, number> = {}; let nextSolo: number | null = null;
      project.tracks.forEach((track, index) => { const clip = track.clips?.[0]; if (clip?.source) { nextFiles[index] = clip.source; nextSourceRefs[index] = { path: clip.source, status: "reconnect" }; } if (typeof clip?.duration === "number") { nextDurations[index] = clip.duration; nextEnds[index] = clip.duration; } if (typeof clip?.fade_in === "number") nextFadeIns[index] = clip.fade_in; if (typeof clip?.fade_out === "number") nextFadeOuts[index] = clip.fade_out; if (track.mute) nextMuted[index] = true; if (typeof track.gain === "number") nextGains[index] = Math.max(0, Math.min(1, track.gain)); if (track.solo) nextSolo = index; });
      (project.source_refs ?? project.sources)?.forEach((source, index) => { const reference = typeof source === "string" ? { path: source, status: "reconnect" } : source.path ? { path: source.path, status: "reconnect" } : null; if (reference) nextSourceRefs[index] = { path: reference.path, status: "reconnect" }; });
      const events = project.tracks[0].midi_events ?? [];
      setProjectName(project.name ?? "Projet OP-1"); setTempo(project.tempo ?? 90); if (typeof project.view?.screen_scale === "number") setScreenScale(Math.max(0.5, Math.min(1, project.view.screen_scale))); setFiles(nextFiles); setSourceRefs(nextSourceRefs); setSources({}); setDurations(nextDurations); setClipEnds(nextEnds); setFadeIns(nextFadeIns); setFadeOuts(nextFadeOuts); setMuted(nextMuted); setGains(nextGains); setSolo(nextSolo); setMidiEvents(events); setMidiNotes(events.filter((event) => event.type === "note_on").length); onNotice("Projet Studio chargé. Les références audio sont conservées ; re-sélectionnez chaque source pour reconnecter la lecture.");
    } catch { onNotice("Projet invalide : utilisez un fichier .op1studio.json créé par OP-1 Studio."); } });
  }

  const finalizeAudioRecording = useCallback(() => {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    setRecording(false);

    // Stop direct engine recording
    const recResult = op1AudioEngine.stopTapeRecording();

    // Stop MIDI recording listeners if active
    if (midiInputsRef.current.length > 0) {
      // Se desabonner, jamais debrancher : les ports servent aussi au rack.
      desabonnerEnregistrementRef.current?.();
      desabonnerEnregistrementRef.current = null;
      midiHandler.current = null;
      midiInputRef.current = null;
      midiInputsRef.current = [];
    }

    const targetTrack = selectedTrackRef.current;
    const startPos = recordStartPosRef.current;
    const duration = recResult.duration;

    if (duration > 0.05 && recResult.samples.length > 0) {
      // Encode en WAV PCM 16 bits 44.1 kHz OP-1 standard
      const wavBytes = encodeWavPcm16(recResult.samples, 1, 44100);
      const blob = new Blob([wavBytes], { type: "audio/wav" });
      const blobUrl = URL.createObjectURL(blob);
      const fileName = `OP1_${selectedEngine}_Trk${targetTrack + 1}_${Math.round(duration)}s.wav`;

      setFiles((prev) => ({ ...prev, [targetTrack]: fileName }));
      setSources((prev) => ({ ...prev, [targetTrack]: blobUrl }));
      setSourceRefs((prev) => ({ ...prev, [targetTrack]: { path: fileName, status: "linked" } }));
      setDurations((prev) => ({ ...prev, [targetTrack]: duration }));
      setClipEnds((prev) => ({ ...prev, [targetTrack]: duration }));
      setClipOffsets((prev) => ({ ...prev, [targetTrack]: startPos }));
      setWaveformPeaks((prev) => ({ ...prev, [targetTrack]: recResult.peaks }));

      onNotice(`Enregistrement OP-1 (${selectedEngine}) imprimé sur la Piste ${targetTrack + 1} (${duration.toFixed(1)}s, 44.1 kHz 16 bits PCM).`);
    } else {
      onNotice("Enregistrement OP-1 arrêté : aucune note ou percussion n'a été jouée.");
    }
  }, [onNotice, selectedEngine]);

  const [masterVolume, setMasterVolume] = useState(0.85);
  const audioRefs = useRef<Record<number, HTMLAudioElement | null>>({});

  useEffect(() => {
    op1AudioEngine.setMasterVolume(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    Object.entries(audioRefs.current).forEach(([index, audio]) => { if (audio) audio.volume = (gains[Number(index)] ?? 1) * masterVolume; });
  }, [gains, masterVolume]);

  useEffect(() => {
    if (!transportPlaying) return;
    let frame = 0;
    const process = () => {
      Object.entries(audioRefs.current).forEach(([rawIndex, audio]) => {
        if (!audio) return;
        const index = Number(rawIndex);
        const rawEnd = clipEnds[index] ?? durations[index];
        const clipEnd = (rawEnd && rawEnd > 0) ? rawEnd : 360;
        const end = looping ? Math.min(clipEnd, loopOut) : clipEnd;
        const start = looping ? loopIn : 0;
        const fadeIn = fadeIns[index] ?? 0;
        const fadeOut = fadeOuts[index] ?? 0;

        if (audio.currentTime >= end) {
          if (looping) {
            audio.currentTime = start;
            audio.play().catch(() => {});
          } else {
            try { audio.pause(); } catch {}
          }
        }

        let level = (gains[index] ?? 1) * masterVolume;
        if (fadeIn > 0 && audio.currentTime < fadeIn) level *= audio.currentTime / fadeIn;
        if (fadeOut > 0 && audio.currentTime > end - fadeOut) level *= Math.max(0, (end - audio.currentTime) / fadeOut);
        audio.volume = Math.max(0, Math.min(1, level));
      });
      frame = window.requestAnimationFrame(process);
    };
    frame = window.requestAnimationFrame(process);
    return () => window.cancelAnimationFrame(frame);
  }, [clipEnds, durations, fadeIns, fadeOuts, gains, looping, loopIn, loopOut, masterVolume, transportPlaying]);

  useEffect(() => {
    if (!transportPlaying) return;
    let frame = 0;
    let lastTime = performance.now();

    const sync = () => {
      const now = performance.now();
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      setTransportTime((current) => {
        const next = current + deltaSec;
        const limit = looping ? loopOut : 360;
        if (next >= limit) {
          if (looping) {
            Object.entries(audioRefs.current).forEach(([rawIdx, audio]) => {
              if (audio) {
                const idx = Number(rawIdx);
                const offset = clipOffsets[idx] ?? 0;
                const relTime = loopIn - offset;
                if (relTime >= 0 && relTime < (durations[idx] || 360)) {
                  audio.currentTime = relTime;
                  audio.play().catch(() => {});
                } else {
                  try { audio.pause(); } catch {}
                }
              }
            });
            return loopIn;
          } else {
            setTransportPlaying(false);
            return 360;
          }
        }

        // Alignement doux des éléments audio sur le transport maître
        Object.entries(audioRefs.current).forEach(([rawIdx, audio]) => {
          if (!audio) return;
          const idx = Number(rawIdx);
          const offset = clipOffsets[idx] ?? 0;
          const rawEnd = clipEnds[idx] ?? durations[idx] ?? 360;
          const relTime = next - offset;

          if (relTime >= 0 && relTime < rawEnd) {
            if (audio.paused) {
              audio.currentTime = relTime;
              audio.play().catch(() => {});
            } else if (Math.abs(audio.currentTime - relTime) > 0.08) {
              audio.currentTime = relTime;
            }
          } else if (!audio.paused) {
            try { audio.pause(); } catch {}
          }
        });

        return next;
      });

      frame = window.requestAnimationFrame(sync);
    };

    frame = window.requestAnimationFrame(sync);
    return () => window.cancelAnimationFrame(frame);
  }, [clipEnds, clipOffsets, durations, looping, loopIn, loopOut, transportPlaying]);

  const toggleGlobalPlayback = useCallback(() => {
    if (transportPlaying) {
      if (recordingRef.current) {
        finalizeAudioRecording();
      }
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          try { audio.pause(); } catch {}
        }
      });
      midiTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      midiTimersRef.current = [];
      // Relâche visuellement les touches encore actives si on coupe la lecture en cours de route.
      setPressedMidiNotes([]);
      setTransportPlaying(false);
      return;
    }
    // Démarrage ou positionnement des pistes audio en tenant compte de leurs offsets
    Object.entries(audioRefs.current).forEach(([rawIdx, audio]) => {
      if (audio) {
        const idx = Number(rawIdx);
        const offset = clipOffsets[idx] ?? 0;
        const rawEnd = clipEnds[idx] ?? durations[idx] ?? 360;
        const relTime = transportTime - offset;

        if (relTime >= 0 && relTime < rawEnd) {
          audio.currentTime = relTime;
          audio.play().catch(() => {});
        } else {
          try { audio.pause(); } catch {}
        }
      }
    });
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
  }, [clipEnds, clipOffsets, durations, finalizeAudioRecording, midiEvents, onSendMidi, transportPlaying, transportTime]);

  const toggleTapeRecording = useCallback(async () => {
    if (recordingRef.current) {
      finalizeAudioRecording();
      return;
    }

    const startPos = transportTime;
    recordStartPosRef.current = startPos;
    setRecordingStartPos(startPos);

    try {
      // Démarre l'enregistrement direct des moteurs d'instruments sur le bus Tape
      op1AudioEngine.startTapeRecording();

      // Si MIDI disponible, capturer les événements et déclencher les moteurs
      try {
        const reqMidi = (navigator as MidiNavigator).requestMIDIAccess?.bind(navigator);
        if (reqMidi) {
          const access = await reqMidi();
          const inputs = [...access.inputs.values()];
          if (inputs.length > 0) {
            setMidiNotes(0);
            setMidiEvents([]);
            midiStartRef.current = performance.now();
            const handler = (event: EvenementMidiLu) => {
              const message = decodeMidiNote(event.data);
              if (!message) return;
              if (message.type === "note_on") {
                setMidiNotes((count) => count + 1);
                op1AudioEngine.triggerNoteOn(message.note, message.velocity || 100);
                setPressedMidiNotes((current) => current.includes(message.note) ? current : [...current, message.note]);
              } else {
                op1AudioEngine.triggerNoteOff(message.note);
                setPressedMidiNotes((current) => current.filter((note) => note !== message.note));
              }
              setMidiEvents((current) => [...current, { ...message, time: Number(((performance.now() - midiStartRef.current) / 1000).toFixed(4)) }]);
            };
            midiHandler.current = handler;
            midiInputRef.current = inputs[0];
            midiInputsRef.current = inputs;
            // Abonnement au repartiteur. L'ecriture directe rendait muets le rack
            // et les autres pages des le declenchement d'un enregistrement.
            desabonnerEnregistrementRef.current?.();
            desabonnerEnregistrementRef.current = sAbonner(({ donnees }) => {
              handler({ data: donnees } as EvenementMidiLu);
            });
          }
        }
      } catch {}

      recordingRef.current = true;
      setRecording(true);

      // Démarre la lecture globale si non active pour faire défiler la bande
      if (!transportPlaying) {
        toggleGlobalPlayback();
      }

      onNotice(`Enregistrement OP-1 en cours sur la Piste ${selectedTrackRef.current + 1} à ${startPos.toFixed(1)}s (Moteur ${selectedEngine} & Sons MIDI)...`);
    } catch (err: unknown) {
      console.warn("Recording error:", err);
      onNotice("Impossible de démarrer l'enregistrement de l'OP-1.");
    }
  }, [finalizeAudioRecording, onNotice, selectedEngine, toggleGlobalPlayback, transportPlaying, transportTime]);

  // Raccourci barre d'espace pour lancer / mettre en pause la lecture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT" || (active as HTMLElement).isContentEditable);
      if (e.code === "Space" && !isInput) {
        e.preventDefault();
        toggleGlobalPlayback();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleGlobalPlayback]);

  useEffect(() => {
    const onHubTransport = (event: Event) => {
      const message = (event as CustomEvent<HubTransportMessage>).detail;
      if (message.action === "start" && !transportPlaying) {
        setTempo(Math.max(30, Math.min(240, message.bpm)));
        toggleGlobalPlayback();
      }
      if (message.action === "stop" && transportPlaying) toggleGlobalPlayback();
    };
    window.addEventListener("hub:transport", onHubTransport);
    return () => window.removeEventListener("hub:transport", onHubTransport);
  }, [toggleGlobalPlayback, transportPlaying]);

  useEffect(() => {
    const onHubNote = (event: Event) => {
      const message = (event as CustomEvent<HubNoteMessage>).detail;
      if (message.action === "note-on") {
        op1AudioEngine.triggerNoteOn(message.note, message.velocity || 100);
        setPressedMidiNotes((current) => current.includes(message.note) ? current : [...current, message.note]);
      } else {
        op1AudioEngine.triggerNoteOff(message.note);
        setPressedMidiNotes((current) => current.filter((note) => note !== message.note));
      }
    };
    const onHubPanic = () => setPressedMidiNotes([]);
    window.addEventListener("hub:midi-note", onHubNote);
    window.addEventListener("hub:midi-panic", onHubPanic);
    return () => {
      window.removeEventListener("hub:midi-note", onHubNote);
      window.removeEventListener("hub:midi-panic", onHubPanic);
    };
  }, []);


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
      const sampleRate = 44100;
      const tapeDuration = 360;
      const context = new AudioContext();
      const decoded = await Promise.all(entries.map(async ([rawIndex, source]) => ({
        index: Number(rawIndex),
        buffer: await context.decodeAudioData(await (await fetch(source)).arrayBuffer()),
      })));
      await context.close();
      const soloed = solo !== null;
      for (const { index, buffer } of decoded) {
        if (muted[index] || (soloed && solo !== index)) continue;
        const offset = Math.max(0, Math.min(tapeDuration, clipOffsets[index] ?? 0));
        const clipDuration = Math.min(tapeDuration - offset, clipEnds[index] ?? durations[index] ?? buffer.duration);
        if (clipDuration <= 0) continue;
        const fadeIn = Math.min(clipDuration, fadeIns[index] ?? 0);
        const fadeOut = Math.min(clipDuration, fadeOuts[index] ?? 0);
        const offline = new OfflineAudioContext(1, Math.ceil(tapeDuration * sampleRate), sampleRate);
        const sourceNode = offline.createBufferSource();
        const gainNode = offline.createGain();
        sourceNode.buffer = buffer;
        const level = gains[index] ?? 1;
        gainNode.gain.setValueAtTime(fadeIn ? 0 : level, offset);
        if (fadeIn) gainNode.gain.linearRampToValueAtTime(level, offset + fadeIn);
        if (fadeOut) {
          gainNode.gain.setValueAtTime(level, Math.max(offset + fadeIn, offset + clipDuration - fadeOut));
          gainNode.gain.linearRampToValueAtTime(0, offset + clipDuration);
        }
        sourceNode.connect(gainNode).connect(offline.destination);
        sourceNode.start(offset);
        sourceNode.stop(offset + clipDuration);
        const rendered = await offline.startRendering();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(audioBufferToAiffMono(rendered));
        link.download = `track_${index + 1}.aif`;
        link.click();
        URL.revokeObjectURL(link.href);
        await new Promise((resolve) => window.setTimeout(resolve, 120));
      }
      onNotice("Stems Tape exportés sur 6 minutes : positions et fades conservés. Validation locale requise avant transfert.");
    } catch { onNotice("L'export Tape a échoué. Vérifiez les fichiers audio locaux."); }
  }

  async function exportSingleTrack(index: number) {
    const source = sources[index];
    if (!source) {
      onNotice(`La Piste ${index + 1} est vide, aucun fichier audio à exporter.`);
      return;
    }
    try {
      const sampleRate = 44100;
      const tapeDuration = 360;
      const context = new AudioContext();
      const buffer = await context.decodeAudioData(await (await fetch(source)).arrayBuffer());
      await context.close();
      const offset = Math.max(0, Math.min(tapeDuration, clipOffsets[index] ?? 0));
      const clipDuration = Math.min(tapeDuration - offset, clipEnds[index] ?? durations[index] ?? buffer.duration);
      if (clipDuration <= 0) {
        onNotice(`La Piste ${index + 1} ne contient aucune durée exportable.`);
        return;
      }
      const fadeIn = Math.min(clipDuration, fadeIns[index] ?? 0);
      const fadeOut = Math.min(clipDuration, fadeOuts[index] ?? 0);
      const offline = new OfflineAudioContext(1, Math.ceil(tapeDuration * sampleRate), sampleRate);
      const sourceNode = offline.createBufferSource();
      const gainNode = offline.createGain();
      sourceNode.buffer = buffer;
      const level = gains[index] ?? 1;
      gainNode.gain.setValueAtTime(fadeIn ? 0 : level, offset);
      if (fadeIn) gainNode.gain.linearRampToValueAtTime(level, offset + fadeIn);
      if (fadeOut) {
        gainNode.gain.setValueAtTime(level, Math.max(offset + fadeIn, offset + clipDuration - fadeOut));
        gainNode.gain.linearRampToValueAtTime(0, offset + clipDuration);
      }
      sourceNode.connect(gainNode).connect(offline.destination);
      sourceNode.start(offset);
      sourceNode.stop(offset + clipDuration);
      const rendered = await offline.startRendering();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(audioBufferToAiffMono(rendered));
      link.download = `track_${index + 1}.aif`;
      link.click();
      URL.revokeObjectURL(link.href);
      onNotice(`Piste ${index + 1} exportée avec sa position : track_${index + 1}.aif (AIFF mono 44.1 kHz).`);
    } catch {
      onNotice(`Échec de l'export de la Piste ${index + 1}.`);
    }
  }

  function clearTrack(index: number) {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setSources((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setSourceRefs((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setDurations((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setClipEnds((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setClipOffsets((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setWaveformPeaks((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    onNotice(`Piste ${index + 1} réinitialisée et vidée.`);
  }

  async function exportAlbumFaces() {
    const entries = Object.entries(sources).filter(([, source]) => Boolean(source));
    if (!entries.length) { onNotice("Chargez au moins une piste avant l'export Album."); return; }
    try {
      const sampleRate = 44100;
      const tapeDuration = 360;
      const faceLength = 180;
      const context = new AudioContext();
      const decoded = await Promise.all(entries.map(async ([rawIndex, source]) => ({
        index: Number(rawIndex),
        buffer: await context.decodeAudioData(await (await fetch(source)).arrayBuffer()),
      })));
      await context.close();
      const soloed = solo !== null;
      const maxEnd = Math.min(tapeDuration, Math.max(...decoded.map(({ index, buffer }) =>
        Math.min(tapeDuration, (clipOffsets[index] ?? 0) + (clipEnds[index] ?? durations[index] ?? buffer.duration))), 1));
      const offline = new OfflineAudioContext(2, Math.ceil(maxEnd * sampleRate), sampleRate);
      decoded.forEach(({ index, buffer }) => {
        if (muted[index] || (soloed && solo !== index)) return;
        const offset = Math.max(0, Math.min(maxEnd, clipOffsets[index] ?? 0));
        const clipDuration = Math.min(maxEnd - offset, clipEnds[index] ?? durations[index] ?? buffer.duration);
        if (clipDuration <= 0) return;
        const fadeIn = Math.min(clipDuration, fadeIns[index] ?? 0);
        const fadeOut = Math.min(clipDuration, fadeOuts[index] ?? 0);
        const sourceNode = offline.createBufferSource();
        const gainNode = offline.createGain();
        sourceNode.buffer = buffer;
        const level = gains[index] ?? 1;
        gainNode.gain.setValueAtTime(fadeIn ? 0 : level, offset);
        if (fadeIn) gainNode.gain.linearRampToValueAtTime(level, offset + fadeIn);
        if (fadeOut) {
          gainNode.gain.setValueAtTime(level, Math.max(offset + fadeIn, offset + clipDuration - fadeOut));
          gainNode.gain.linearRampToValueAtTime(0, offset + clipDuration);
        }
        sourceNode.connect(gainNode).connect(offline.destination);
        sourceNode.start(offset);
        sourceNode.stop(offset + clipDuration);
      });
      const rendered = await offline.startRendering();
      const downloads: string[] = [];
      for (let face = 0; face < 2; face += 1) {
        const start = face * faceLength;
        const length = Math.max(0, Math.min(faceLength, maxEnd - start));
        if (length <= 0) continue;
        const faceBuffer = new AudioBuffer({ length: Math.ceil(length * sampleRate), numberOfChannels: 2, sampleRate });
        const startFrame = Math.ceil(start * sampleRate);
        for (let channel = 0; channel < 2; channel += 1) {
          faceBuffer.copyToChannel(rendered.getChannelData(channel).subarray(startFrame, startFrame + faceBuffer.length), channel);
        }
        const link = document.createElement("a");
        link.href = URL.createObjectURL(audioBufferToAiffMono(faceBuffer));
        link.download = `side_${face === 0 ? "a" : "b"}.aif`;
        link.click();
        URL.revokeObjectURL(link.href);
        downloads.push(link.download);
        await new Promise((resolve) => window.setTimeout(resolve, 120));
      }
      const manifest = new Blob([JSON.stringify({
        schema: "op1-album-export", version: 1, project: projectName, tempo, sample_rate: sampleRate,
        channels: 1, tape_seconds: tapeDuration, face_seconds: faceLength, faces: downloads,
        source_tracks: entries.map(([rawIndex]) => Number(rawIndex) + 1),
      }, null, 2)], { type: "application/json" });
      const manifestLink = document.createElement("a");
      manifestLink.href = URL.createObjectURL(manifest);
      manifestLink.download = "album-manifest.json";
      manifestLink.click();
      URL.revokeObjectURL(manifestLink.href);
      onNotice("Album exporté avec positions conservées. Validation locale requise avant transfert.");
    } catch { onNotice("L'export Album a échoué. Vérifiez les sources audio locales."); }
  }

  function seekTransport(time: number) {
    setTransportTime(time);
    Object.values(audioRefs.current).forEach((audio) => { if (audio) audio.currentTime = time; });
  }

  const barSec = (60 / Math.max(30, tempo)) * 4;
  const beatSec = barSec / 4;
  const stepSec = barSec / 16;

  function snapToGrid(sec: number): number {
    return Math.max(0, Math.min(360, Math.round(sec / stepSec) * stepSec));
  }

  function setLoopInAtHead() {
    const snapped = snapToGrid(transportTime);
    const newOut = Math.max(snapped + stepSec, loopOut);
    setLoopIn(snapped);
    setLoopOut(newOut);
    onNotice(`Point IN fixé à ${snapped.toFixed(1)}s (calé tempo).`);
  }

  function setLoopOutAtHead() {
    const snapped = snapToGrid(transportTime);
    const newIn = Math.min(loopIn, Math.max(0, snapped - stepSec));
    setLoopIn(newIn);
    setLoopOut(snapped);
    onNotice(`Point OUT fixé à ${snapped.toFixed(1)}s (calé tempo).`);
  }

  const loopClipboardRef = useRef<{
    length: number;
    tracks: Record<number, { clipEnd: number; offsetRelative: number; hasFile: boolean }>;
  } | null>(null);

  function copyLoop() {
    const lIn = Math.min(loopIn, loopOut);
    const lOut = Math.max(loopIn, loopOut);
    const length = lOut - lIn;
    const tData: Record<number, { clipEnd: number; offsetRelative: number; hasFile: boolean }> = {};
    for (let i = 0; i < 4; i++) {
      const offset = clipOffsets[i] ?? 0;
      const end = clipEnds[i] ?? durations[i] ?? 0;
      tData[i] = {
        clipEnd: end,
        offsetRelative: offset - lIn,
        hasFile: Boolean(files[i]),
      };
    }
    loopClipboardRef.current = { length, tracks: tData };
    onNotice(`Boucle copiée (${lIn.toFixed(1)}s ➜ ${lOut.toFixed(1)}s, ${length.toFixed(1)}s / ${(length / barSec).toFixed(1)} bar).`);
  }

  function pasteLoop() {
    if (!loopClipboardRef.current) {
      onNotice("Aucune boucle dans le presse-papier OP-1 (utilisez d'abord Copier Boucle).");
      return;
    }
    const { length } = loopClipboardRef.current;
    const targetStart = snapToGrid(transportTime);
    for (let i = 0; i < 4; i++) {
      if (files[i]) {
        setClipOffsets((current) => ({
          ...current,
          [i]: Math.max(0, Math.min(360 - (clipEnds[i] ?? 0), targetStart)),
        }));
      }
    }
    setLoopIn(targetStart);
    setLoopOut(Math.min(360, targetStart + length));
    onNotice(`Boucle collée à ${targetStart.toFixed(1)}s calée sur les mesures.`);
  }

  function togglePlay(index: number) {
    const audio = audioRefs.current[index];
    if (!audio) {
      onNotice("Chargez d’abord une piste audio locale.");
      return;
    }
    if (playing === index) {
      try { audio.pause(); } catch {}
      setPlaying(null);
    } else {
      Object.values(audioRefs.current).forEach((item) => {
        if (item) {
          try { item.pause(); } catch {}
        }
      });
      audio.play().catch(() => {});
      setPlaying(index);
    }
  }

  const loadedTracksCount = Object.keys(files).filter((k) => Boolean(files[Number(k)])).length;

  return (
    <div className="tool-body tape-editor" onClick={() => { if (activeDropdown) setActiveDropdown(null); }}>

      {/* ── CONSOLE DE CONTRÔLE COMPACTE OP-1 STUDIO (Hauteur optimisée) ── */}
      <div className="op1-compact-console">
        {/* Ligne 1 : Navigation, Modals & Menus déroulants */}
        <div className="op1-compact-row">
          <div className="op1-compact-group">
            <div className="op1-compact-brand">
              <strong>OP-1 STUDIO</strong>
              <span>PRO</span>
            </div>

            {/* Sélecteur de mode compact Clone / MIDI */}
            <button
              type="button"
              className={`op1-pill-btn ${studioMode === "clone" ? "is-active" : ""}`}
              onClick={async () => {
                const nextMode = studioMode === "clone" ? "midi" : "clone";
                setStudioMode(nextMode);
                if (nextMode === "midi") await onConnectMidi();
              }}
              title="Basculer entre Clone local OP-1 et Contrôleur MIDI physique"
            >
              <Icon name={studioMode === "clone" ? "chip" : "plug"} size={12} />
              <span>{studioMode === "clone" ? "Mode Clone" : "Mode MIDI"}</span>
            </button>

            {/* Menu 1 : Tiroir Multi-Pistes */}
            <button
              type="button"
              className={`op1-pill-btn ${activeModal === "tracks" ? "is-active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal(activeModal === "tracks" ? null : "tracks");
                setActiveDropdown(null);
              }}
              title="Ouvrir le mixeur et l'éditeur multi-pistes 1 à 4"
            >
              <Icon name="tape" size={12} />
              <span>Mixer (1-4)</span>
              <span className="badge">{loadedTracksCount}/4</span>
            </button>

            {/* Menu 2 : Moteurs Sonores & Presets */}
            <button
              type="button"
              className={`op1-pill-btn ${activeModal === "engines" ? "is-active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal(activeModal === "engines" ? null : "engines");
                setActiveDropdown(null);
              }}
              title="Sélectionner un moteur sonore ou un patch"
            >
              <Icon name="wave" size={12} />
              <span>Moteur</span>
              <span className="badge">{selectedEngine}</span>
            </button>

            {/* Menu 3 : Projet & Exports (Dropdown) */}
            <div className="op1-pro-menu-group">
              <button
                type="button"
                className={`op1-pill-btn ${activeDropdown === "project" ? "is-active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === "project" ? null : "project");
                }}
              >
                <Icon name="archive" size={12} />
                <span>Projet & Exports</span>
                <span style={{ fontSize: "8px" }}>▼</span>
              </button>

              {activeDropdown === "project" && (
                <div className="op1-pro-dropdown-panel" onClick={(e) => e.stopPropagation()}>
                  <div style={{ padding: "4px 6px", borderBottom: "1px solid #232b33", marginBottom: "4px" }}>
                    <label style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>Nom du projet</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      style={{ width: "100%", padding: "4px 8px", background: "#0f1215", border: "1px solid #334155", borderRadius: "4px", color: "#f8fafc", fontSize: "11px" }}
                    />
                  </div>
                  <button className="op1-pro-dropdown-item" onClick={() => { setProjectName("Nouveau projet OP-1"); setFiles({}); setSources({}); setSourceRefs({}); onNotice("Nouveau projet Studio créé."); setActiveDropdown(null); }}>
                    <span>📄 Nouveau projet</span>
                  </button>
                  <button className="op1-pro-dropdown-item" onClick={() => { projectInputRef.current?.click(); setActiveDropdown(null); }}>
                    <span>📂 Ouvrir projet (.json)</span>
                  </button>
                  <input ref={projectInputRef} type="file" accept=".json,.op1studio.json" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (file) loadProject(file); }} />
                  <button className="op1-pro-dropdown-item" onClick={() => { saveProject(); setActiveDropdown(null); }}>
                    <span>💾 Enregistrer projet</span>
                  </button>
                  <div style={{ height: "1px", background: "#232b33", margin: "4px 0" }} />
                  <button className="op1-pro-dropdown-item" onClick={() => { renderOffline(); setActiveDropdown(null); }}>
                    <span style={{ color: "#29be87", fontWeight: "bold" }}>🌊 Rendu WAV Mix</span>
                  </button>
                  <button className="op1-pro-dropdown-item" onClick={() => { exportTapeStems(); setActiveDropdown(null); }}>
                    <span>📼 Exporter Stems AIFF (4 pistes)</span>
                  </button>
                  <button className="op1-pro-dropdown-item" onClick={() => { exportAlbumFaces(); setActiveDropdown(null); }}>
                    <span>💽 Exporter Album (Face A/B)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Menu 4 : MIDI & Sync (Dropdown) */}
            <div className="op1-pro-menu-group">
              <button
                type="button"
                className={`op1-pill-btn ${activeDropdown === "midi" ? "is-active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === "midi" ? null : "midi");
                }}
              >
                <Icon name="plug" size={12} />
                <span>MIDI</span>
                <span style={{ fontSize: "8px" }}>▼</span>
              </button>

              {activeDropdown === "midi" && (
                <div className="op1-pro-dropdown-panel" onClick={(e) => e.stopPropagation()}>
                  <button className="op1-pro-dropdown-item" onClick={() => { onConnectMidi(); setActiveDropdown(null); }}>
                    <span>🔌 Connecter OP-1 physique</span>
                  </button>
                  <button className="op1-pro-dropdown-item" onClick={() => { quantizeMidi(); setActiveDropdown(null); }}>
                    <span>📐 Quantifier MIDI (1/16)</span>
                  </button>
                  <button className="op1-pro-dropdown-item" onClick={() => { setPressedMidiNotes([]); onNotice("Notes MIDI relâchées (Panic)."); setActiveDropdown(null); }}>
                    <span>🛑 MIDI Panic (Reset Notes)</span>
                  </button>
                  <div style={{ padding: "6px 8px", fontSize: "10px", color: "#64748b", borderTop: "1px solid #232b33", marginTop: "4px" }}>
                    Notes capturées : <strong style={{ color: "#29be87" }}>{midiNotes}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Menu 5 : Disposition / Vue (Dropdown) */}
            <div className="op1-pro-menu-group">
              <button
                type="button"
                className={`op1-pill-btn ${activeDropdown === "view" ? "is-active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === "view" ? null : "view");
                }}
              >
                <Icon name="settings" size={12} />
                <span>Vue</span>
                <span style={{ fontSize: "8px" }}>▼</span>
              </button>

              {activeDropdown === "view" && (
                <div className="op1-pro-dropdown-panel" onClick={(e) => e.stopPropagation()}>
                  <button className="op1-pro-dropdown-item" onClick={() => { setKeyboardFolded(!keyboardFolded); setActiveDropdown(null); }}>
                    <span>{keyboardFolded ? "▲ Afficher Clavier Machine" : "▼ Replier Clavier Machine"}</span>
                  <button className="op1-pro-dropdown-item" onClick={() => { setRackFolded(!rackFolded); setActiveDropdown(null); }}>
                    <span>{rackFolded ? "▲ Afficher Rack Audio" : "▼ Replier Rack Audio"}</span>
                  </button>
                  </button>
                  <button className="op1-pro-dropdown-item" onClick={() => { setScreenFolded(!screenFolded); setActiveDropdown(null); }}>
                    <span>{screenFolded ? "▲ Afficher Écran OLED" : "▼ Replier Écran OLED"}</span>
                  </button>
                  <button className="op1-pro-dropdown-item" onClick={() => { setReversed(!reversed); setActiveDropdown(null); }}>
                    <span>{reversed ? "🔄 Sens Normal Bande" : "🔄 Inverser Bande (Tape Invert)"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Côté droit ligne 1 : Nom du projet & infos */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#94a3b8" }}>
            <span>Projet : <strong style={{ color: "#f1f5f9" }}>{projectName}</strong></span>
          </div>
        </div>

        {/* Ligne 2 : Transport direct & Outils de boucle */}
        <div className="op1-compact-row" style={{ paddingTop: "2px" }}>
          {/* Groupe Transport compact */}
          <div className="op1-compact-group">
            <div className="op1-transport-cluster">
              <button
                type="button"
                className={`op1-rec-btn ${recording ? "is-recording" : ""}`}
                onClick={toggleTapeRecording}
                title="Enregistrement multi-pistes & MIDI"
              >
                <span style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#FF3A5D",
                  display: "inline-block",
                  animation: recording ? "pulse 1s infinite" : "none"
                }} />
                <span>REC</span>
              </button>

              <button
                type="button"
                className={`op1-state-btn ${looping ? "is-active" : ""}`}
                onClick={() => setLooping(!looping)}
                title="Activer / Désactiver la lecture en boucle"
              >
                LOOP
              </button>

              <button
                type="button"
                className={`op1-state-btn ${reversed ? "is-rev-active" : ""}`}
                onClick={() => setReversed(!reversed)}
                title="Lecture bande inversée (Reverse)"
              >
                REV
              </button>

              <div className="op1-tempo-box">
                <span>BPM</span>
                <input
                  type="number"
                  min="40"
                  max="200"
                  value={tempo}
                  onChange={(e) => setTempo(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Outils de boucle In / Out / Copier / Coller */}
            <div className="op1-compact-group" style={{ marginLeft: "4px" }}>
              <button
                type="button"
                className="op1-pill-btn"
                onClick={setLoopInAtHead}
                title="Définir le début de boucle calé sur la mesure actuelle"
                style={{ color: "#00ED95", borderColor: "#00ED9544" }}
              >
                <span>📍 IN : {loopIn.toFixed(1)}s</span>
              </button>

              <button
                type="button"
                className="op1-pill-btn"
                onClick={setLoopOutAtHead}
                title="Définir la fin de boucle calée sur la mesure actuelle"
                style={{ color: "#00ED95", borderColor: "#00ED9544" }}
              >
                <span>🏁 OUT : {loopOut.toFixed(1)}s</span>
              </button>

              <button
                type="button"
                className="op1-pill-btn"
                onClick={copyLoop}
                title="Copier les clips de la zone de boucle"
                style={{ color: "#38bdf8", borderColor: "#38bdf844" }}
              >
                <span>✂️ Copier</span>
              </button>

              <button
                type="button"
                className="op1-pill-btn"
                onClick={pasteLoop}
                title="Coller les clips à la position de tête de lecture"
                style={{ color: "#d8b4fe", borderColor: "#a855f744" }}
              >
                <span>📋 Coller</span>
              </button>
            </div>
          </div>

          {/* Raccourcis rapides à droite */}
          <div className="op1-compact-group">
            <button
              type="button"
              className="op1-pill-btn"
              onClick={renderOffline}
              title="Exporter le mixage audio au format WAV"
            >
              <span>🌊 Mix WAV</span>
            </button>
            <button
              type="button"
              className="op1-pill-btn"
              onClick={exportTapeStems}
              title="Exporter les 4 pistes séparées en AIFF"
            >
              <span>📼 Stems</span>
            </button>
            <label className="op1-screen-scale-control" title="Réduire ou agrandir l’écran OP-1">
              <span>ÉCRAN</span>
              <input type="range" min="0.5" max="1" step="0.05" value={screenScale} onChange={(event) => setScreenScale(Number(event.target.value))} aria-label="Échelle de l’écran OP-1" />
              <output>{Math.round(screenScale * 100)}%</output>
            </label>
            <button
              type="button"
              className={`op1-pill-btn ${!keyboardFolded ? "is-active" : ""}`}
              onClick={() => setKeyboardFolded(!keyboardFolded)}
              title="Afficher ou masquer le châssis clavier OP-1"
            >
              <span>🎹 Clavier</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Panneau Écran OLED Clone (Centré & Immersif) ── */}
      {!screenFolded && (
        <div className="studio-slide-panel studio-screen-panel" style={{ marginTop: "12px", transform: `scale(${screenScale})`, transformOrigin: "top left", width: `${100 / screenScale}%` }}>
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
            recording={recording}
            recordingStartPos={recordingStartPos}
            onRecord={toggleTapeRecording}
            onToggleGlobalPlayback={toggleGlobalPlayback}
            looping={looping}
            loopIn={loopIn}
            loopOut={loopOut}
            onLoopChange={setLooping}
            onLoopRangeChange={(inSec, outSec) => {
              setLoopIn(inSec);
              setLoopOut(outSec);
            }}
            tempo={tempo}
            volume={masterVolume}
            onVolumeChange={setMasterVolume}
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
            onSelectTrack={(index) => {
              setSelectedTrack(index);
              setTrimTrack(index);
            }}
            onSeek={seekTransport}
            onNotice={onNotice}
            selectedEngine={selectedEngine}
            selectedPatch={selectedPatch}
            onEngineChange={setSelectedEngine}
            onPatchChange={setSelectedPatch}
            reversed={reversed}
            onExportTrack={exportSingleTrack}
            onClearTrack={clearTrack}
            onEditTrim={(index) => {
              setSelectedTrack(index);
              setTrimTrack(index);
              setActiveModal("tracks");
            }}
          />
        </div>
      )}

      {/* ── Panneau Clavier OP-1 (Châssis matériel & encodeurs) ── */}
      {!keyboardFolded && (
        <div className="studio-slide-panel studio-keyboard-panel" style={{ marginTop: "12px" }}>
          <StudioMachinePanel
            pressedNotes={pressedMidiNotes}
            mode={studioMode}
            playing={transportPlaying}
            position={transportTime}
            files={files}
            onTogglePlayback={toggleGlobalPlayback}
            onRecord={toggleTapeRecording}
            onSendMidi={onSendMidi}
            lastRawMidiIn={lastRawMidiIn}
          />
        </div>
      )}

      {/* ── Rack audio (15 moteurs, 91 patches, effets) ── */}
      {!rackFolded && (
        <div className="studio-slide-panel studio-rack-panel" style={{ marginTop: "12px" }}>
          {/* `enTiroir` retire la TopBar : elle appelle navigateMaquette et
              demonterait ce studio au moindre clic. `clavierActif` suit le
              repli — un rack ferme jouerait des notes sous les doigts. */}
          <AudioPluginRack
            enTiroir
            clavierActif={!rackFolded}
            onClose={() => setRackFolded(true)}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL DRAWER : ÉDITEUR MULTI-PISTES ET FICHIERS (PISTES 1 À 4)
          S'affiche uniquement à la demande via les menus ou boutons d'accès
         ══════════════════════════════════════════════════════════════════════ */}
      {activeModal === "tracks" && (
        <div className="op1-pro-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="op1-pro-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="op1-pro-modal-header">
              <strong>
                <Icon name="tape" size={18} />
                Éditeur Multi-Pistes & Fichiers Audio (Pistes 1 à 4 · Format AIFF Mono 44.1 kHz)
              </strong>
              <button
                type="button"
                className="op1-pro-modal-close"
                onClick={() => setActiveModal(null)}
                title="Fermer (Échap)"
              >
                ✕
              </button>
            </div>

            <div className="op1-pro-modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid #232c34" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Chargez ou déposez vos fichiers audio (WAV / AIFF / MP3) pour chaque piste de la bande. Ajustez les décalages (offsets), gains, mutes et solos.
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="op1-quick-chip" onClick={exportTapeStems}>
                    <Icon name="download" size={12} />
                    <span>Exporter Stems</span>
                  </button>
                </div>
              </div>

              {/* Contrôles de trim & fades si une piste est sélectionnée */}
              {trimTrack !== null && (
                <div style={{ marginBottom: "16px", padding: "12px", background: "#1c2229", borderRadius: "8px", border: "1px solid #2d3844" }}>
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
                </div>
              )}

              {/* Liste des 4 pistes larges */}
              <StudioTrackList
                Icon={Icon}
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
                onTrackEnd={() => { setPlaying(null); }}
                onOffsetChange={(index, offset) => setClipOffsets((current) => ({ ...current, [index]: offset }))}
                onSelectTrack={(index) => {
                  setSelectedTrack(index);
                  setTrimTrack(index);
                }}
                onExportTrack={exportSingleTrack}
                onClearTrack={clearTrack}
                onEditTrim={(index) => {
                  setSelectedTrack(index);
                  setTrimTrack(index);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL DRAWER : MOTEURS DE SYNTHÈSE ET SONS OP-1
          S'affiche à la demande via les menus ou boutons d'accès
         ══════════════════════════════════════════════════════════════════════ */}
      {activeModal === "engines" && (
        <div className="op1-pro-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="op1-pro-modal-content" style={{ maxWidth: "780px" }} onClick={(e) => e.stopPropagation()}>
            <div className="op1-pro-modal-header">
              <strong>
                <Icon name="wave" size={18} />
                Moteurs Sonores & Banque de Patchs OP-1
              </strong>
              <button
                type="button"
                className="op1-pro-modal-close"
                onClick={() => setActiveModal(null)}
                title="Fermer (Échap)"
              >
                ✕
              </button>
            </div>

            <div className="op1-pro-modal-body">
              {/* Choix du Moteur */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                  Sélection du moteur actif (Synth & Drum)
                </label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {["FM", "Cluster", "Digital", "Iter", "Pulse", "String", "Sampler", "Phase", "DNA", "Voltage", "Drum"].map((engine) => (
                    <button
                      key={engine}
                      onClick={() => {
                        setSelectedEngine(engine);
                        onNotice(`Moteur sonore sélectionné : ${engine}`);
                      }}
                      style={{
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        borderRadius: "6px",
                        border: selectedEngine === engine ? "1px solid #29be87" : "1px solid #28333e",
                        background: selectedEngine === engine ? "#29be87" : "#1a2128",
                        color: selectedEngine === engine ? "#0f1215" : "#cbd5e1",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {engine}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catégories de patchs */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                  Catégorie de son
                </label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {["Synth", "Drum", "Bass", "Lead", "Pad", "Keys", "FX"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedSoundCategory(cat)}
                      style={{
                        padding: "5px 12px",
                        fontSize: "11px",
                        borderRadius: "5px",
                        border: selectedSoundCategory === cat ? "1px solid #4cace1" : "1px solid #28333e",
                        background: selectedSoundCategory === cat ? "rgba(76, 172, 225, 0.2)" : "#181f26",
                        color: selectedSoundCategory === cat ? "#4cace1" : "#94a3b8",
                        cursor: "pointer"
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Liste des Presets */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                {[
                  { name: `${selectedEngine} Classic 01`, category: selectedSoundCategory },
                  { name: `${selectedEngine} Deep Sub`, category: "Bass" },
                  { name: `${selectedEngine} Soft Ambient`, category: "Pad" },
                  { name: `${selectedEngine} Punchy Lead`, category: "Lead" },
                  { name: `${selectedEngine} Metallic Bell`, category: "Keys" },
                  { name: `${selectedEngine} Cosmic Warp`, category: "FX" },
                ].map((preset, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 12px",
                      background: "#181e24",
                      border: "1px solid #2a3540",
                      borderRadius: "6px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", fontSize: "12px", color: "#f1f5f9" }}>{preset.name}</strong>
                      <small style={{ fontSize: "10px", color: "#64748b" }}>{selectedEngine} · {preset.category}</small>
                    </div>
                    <button
                      onClick={() => {
                        onNotice(`Patch "${preset.name}" chargé sur l'OP-1 !`);
                        setActiveModal(null);
                      }}
                      style={{
                        padding: "4px 10px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        background: "#29be87",
                        color: "#0f1215",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      LOAD
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const nav = [
  { label: "Firmware", icon: "chip" as IconName, active: true },
  { label: "Sauvegardes", icon: "archive" as IconName },
  { label: "Sons", icon: "wave" as IconName },
  { label: "Services", icon: "book" as IconName },
  { label: "Studio", icon: "tape" as IconName },
  { label: "Images", icon: "image" as IconName },
];

const recommendedFirmware = firmwareCatalog.releases[0];
const officialFirmwareUrl = recommendedFirmware.officialUrl;

// Niveau de risque : repris de data/mods/catalog.json (colonne "risk") pour
// les mods qui y sont individuellement audités ; "unclassified" pour les
// remplacements d'écran isolés et les paquets de ressources en bloc
// (Écrans/Audio/Ressources), qui ne sont pas encore passés par un audit
// mod par mod — ne pas les présenter comme "controlled" par confort. Aucun
// mod "high"/"critical" du catalogue n'est exposé dans cette UI (ils
// restent recherche/candidat, voir OP1_FIRMWARE_BIBLE.md §11) — la jauge
// ci-dessous reste donc prête à réagir le jour où l'un d'eux serait ajouté.
type FirmwareModRisk = "controlled" | "unclassified" | "high" | "critical";
type FirmwareMod = { id: string; category: string; title: string; detail: string; source: string; risk: FirmwareModRisk; availability?: string; preview?: string; isNew?: boolean };

const FIRMWARE_RISK_WEIGHT: Record<FirmwareModRisk, number> = { controlled: 1, unclassified: 2, high: 4, critical: 7 };
const FIRMWARE_RISK_LABEL: Record<FirmwareModRisk, string> = { controlled: "Vérifié", unclassified: "Non classé", high: "Risque élevé", critical: "Risque critique" };

// Jauge agrégée (pas un mod pris isolément) : la somme des poids ci-dessus
// pour tous les mods sélectionnés à la fois. Seuils choisis pour qu'une
// sélection de quelques mods "controlled" reste "faible", et qu'il faille
// une confirmation explicite avant de partir sur une combinaison chargée —
// voir docs/FIRMWARE_PAGE_ROADMAP.md.
type FirmwareRiskLevel = "aucun" | "faible" | "modere" | "eleve";
const FIRMWARE_GAUGE_LABEL: Record<FirmwareRiskLevel, string> = {
  aucun: "Aucun mod sélectionné", faible: "Risque faible", modere: "Risque modéré", eleve: "Risque élevé",
};

const firmwareMods: FirmwareMod[] = [
  { id: "playmode", category: "Écrans", title: "Écran Play Mode", detail: "Remplace l’écran du mode lecture.", source: "SOURCE_MODIFIEE/content/display/playmode.svg", preview: "/firmware-mods/playmode.svg", risk: "unclassified" },
  { id: "rymd", category: "Écrans", title: "Écran RYMD", detail: "Modifie l’écran et les repères du mode RYMD.", source: "SOURCE_MODIFIEE/content/display/rymd.svg", preview: "/firmware-mods/rymd.svg", risk: "unclassified" },
  { id: "tapeconfig", category: "Écrans", title: "Écran Tape Config", detail: "Remplace l’écran de configuration Tape.", source: "SOURCE_MODIFIEE/content/display/tapeconfig.svg", preview: "/firmware-mods/tapeconfig.svg", risk: "unclassified" },
  { id: "op1patch", category: "Audio", title: "Patch vocal OP-1", detail: "Ajoute la ressource audio de speech modifiée.", source: "SOURCE_MODIFIEE/content/audio/speech/op1patch.raw", risk: "unclassified" },
  { id: "audio", category: "Ressources", title: "Ressources audio du pack", detail: "40 RAW : synth, drum, presets et speech.", source: "SOURCE_MODIFIEE/content/audio/", risk: "unclassified" },
  { id: "display", category: "Ressources", title: "Ressources graphiques du pack", detail: "61 SVG d’interface et d’écrans.", source: "SOURCE_MODIFIEE/content/display/", risk: "unclassified" },
  { id: "iter", category: "Fonctions", title: "Synthé Iter", detail: "Active le synthé Iter caché dans le firmware original.", source: "op1repacker --options iter", availability: "Moteur local trouvé", isNew: true, risk: "controlled" },
  { id: "presets-iter", category: "Fonctions", title: "Presets Iter", detail: "Ajoute 11 presets AIF fournis avec le moteur Iter.", source: "op1repacker --options presets-iter", availability: "Moteur local trouvé · dépend de Iter", isNew: true, risk: "controlled" },
  { id: "filter", category: "Fonctions", title: "Effet Filter", detail: "Rend disponible l’effet Filter pour le traitement sonore.", source: "op1repacker --options filter", availability: "Moteur local trouvé", isNew: true, risk: "controlled" },
  { id: "subtle-fx", category: "Fonctions", title: "Subtle FX", detail: "Modifie les réglages par défaut des effets pour un rendu plus léger.", source: "op1repacker --options subtle-fx", availability: "Moteur local trouvé", isNew: true, risk: "controlled" },
  { id: "gfx-tape-invert", category: "Thèmes", title: "Tape inversé", detail: "Applique le patch graphique d’inversion de l’écran Tape.", source: "op1repacker --options gfx-tape-invert", availability: "Moteur local trouvé", isNew: true, risk: "controlled" },
  { id: "gfx-cwo-moose", category: "Thèmes", title: "CWO Moose", detail: "Applique le patch graphique Moose au visuel CWO.", source: "op1repacker --options gfx-cwo-moose", availability: "Moteur local trouvé", isNew: true, risk: "controlled" },
  { id: "gfx-iter-lab", category: "Thèmes", title: "Iter Lab", detail: "Remplace le visuel Iter par l’asset Iter Lab fourni.", source: "op1repacker --options gfx-iter-lab", availability: "Moteur local trouvé · dépend de Iter", isNew: true, risk: "controlled" },
];

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
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
  useHubInitialization();
  const [stage, setStage] = useState(0);
  const [expertOpen, setExpertOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [midiConnected, setMidiConnected] = useState(false);
  const [backupTested, setBackupTested] = useState(false);
  const [libraryFolder, setLibraryFolder] = useState<string | null>(null);
  // L’état initial doit être identique au rendu serveur et au premier rendu
  // client. Le paramètre hubTool est appliqué après hydratation pour éviter
  // qu’un lancement direct Hub → outil ne produise un mismatch SSR/client.
  const [toolWindow, setToolWindow] = useState<ToolWindow>(null);
  const [homeOpen, setHomeOpen] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  // Appliquer la cible Hub avant la première interaction possible. Le premier
  // rendu reste identique au SSR, puis l’effet de layout ouvre l’outil demandé
  // sans laisser un clic utilisateur être écrasé par l’état initial.
  useClientLayoutEffect(() => {
    const initial = initialHubTool();
    setToolWindow(initial.tool);
    setHomeOpen(initial.homeOpen);
    setIsHydrated(true);
  }, []);
  const [exerciseRunning, setExerciseRunning] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("I–V–vi–IV");
  const [firmwareOptions, setFirmwareOptions] = useState({
    verify: true,
    backup: true,
    teBoot: false,
  });
  const [studioSection] = useState<"tape" | "graphics">("tape");
  const [firmwareFile, setFirmwareFile] = useState<{ name: string; size: number } | null>(null);
  const [selectedMods, setSelectedMods] = useState<Record<string, boolean>>({});
  const [selectedMod, setSelectedMod] = useState<FirmwareMod | null>(null);
  const [firmwareRiskAck, setFirmwareRiskAck] = useState(false);
  // Explorateur de mods (feuille de route Firmware, 14 août 2026) : une
  // catégorie ouverte à la fois, comme un dossier qu'on déplie — pas toutes
  // les catégories dépliées en même temps.
  const [openModCategory, setOpenModCategory] = useState<string | null>(null);
  const [soundPackReady, setSoundPackReady] = useState(false);
  const [backupRoot] = useState("backups/");
  const [sharedSoundLibraryHandle, setSharedSoundLibraryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const midiOutputRef = useRef<MidiOutputLike | null>(null);

  useEffect(() => {
    const onHubWorkspace = (event: Event) => {
      const root = (event as CustomEvent<FileSystemDirectoryHandle | null>).detail;
      if (!root) return;
      void (async () => {
        try {
          const shared = await root.getDirectoryHandle("shared", { create: true });
          const sounds = await shared.getDirectoryHandle("sounds", { create: true });
          for (const folder of ["originals", "prepared", "packs", "quarantine"]) await sounds.getDirectoryHandle(folder, { create: true });
          setSharedSoundLibraryHandle(sounds);
          setLibraryFolder(`${root.name}/shared/sounds`);
          setNotice("Bibliothèque centrale OP‑1 connectée au workspace Hub.");
        } catch {
          setNotice("Le workspace Hub est reçu, mais la bibliothèque de sons doit être reconnectée.");
        }
      })();
    };
    window.addEventListener("hub:workspaceLoaded", onHubWorkspace);
    return () => window.removeEventListener("hub:workspaceLoaded", onHubWorkspace);
  }, []);

  // Jauge de danger (feuille de route Firmware, 14 août 2026) : la somme du
  // poids de chaque mod sélectionné, pas seulement son nombre — un mod non
  // classé pèse plus qu'un mod vérifié, un mod à risque élevé pèse
  // nettement plus. Recalculée à chaque rendu (12 mods au maximum, calcul
  // trivial) plutôt que mémoïsée.
  const selectedFirmwareModList = firmwareMods.filter((mod) => selectedMods[mod.id]);
  const firmwareRiskWeight = selectedFirmwareModList.reduce((total, mod) => total + FIRMWARE_RISK_WEIGHT[mod.risk], 0);
  const firmwareRiskLevel: FirmwareRiskLevel =
    firmwareRiskWeight === 0 ? "aucun" : firmwareRiskWeight <= 4 ? "faible" : firmwareRiskWeight <= 9 ? "modere" : "eleve";
  const firmwareRiskBlocked = firmwareRiskLevel === "eleve" && !firmwareRiskAck;

  // Un changement de sélection invalide une confirmation déjà donnée — un
  // "je confirme" ne doit jamais couvrir une sélection différente de celle
  // qui a été acquittée. Différé dans une image (requestAnimationFrame)
  // plutôt qu'appelé en direct dans le corps de l'effet, pour rester en
  // dehors du rendu synchrone (règle react-hooks/set-state-in-effect).
  useEffect(() => {
    const raf = requestAnimationFrame(() => setFirmwareRiskAck(false));
    return () => cancelAnimationFrame(raf);
  }, [selectedMods]);

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
        setSharedSoundLibraryHandle(folder);
        setLibraryFolder(folder.name);
        setNotice(`Dossier local sélectionné : ${folder.name}. Les fichiers restent sur cet appareil.`);
      } catch {
        // The user cancelled the native picker.
      }
      return;
    }
    folderInputRef.current?.click();
  }


  async function connectMidiDevice(options: { silent?: boolean } = {}) {
    const requestMIDIAccess = (navigator as MidiNavigator).requestMIDIAccess?.bind(navigator);
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
    <main className="app-shell studio-op1-page" style={{ minHeight: "100vh", background: "#0e1314", color: "#eef3ea", padding: "12px 16px" }}>
      {notice && (
        <div className="notice" role="status" style={{ marginBottom: "12px" }}>
          <Icon name="shield" size={17} />
          <span>{notice}</span>
          <button aria-label="Fermer" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      {/* Studio OP-1 Unifié : Écran Clone OLED + Éditeur Pistes Agrandies + Clavier Chassis */}
      <TapeEditor
        onNotice={setNotice}
        onConnectMidi={connectMidiDevice}
        onSendMidi={(data) => midiOutputRef.current?.send?.(data)}
      />
    </main>
  );
}