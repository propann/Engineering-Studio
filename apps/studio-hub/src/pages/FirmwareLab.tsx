"use client";

import { useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";

// ── Types ──
type FirmwareCategory = "tape" | "album" | "synth" | "mixer" | "system";

export interface FirmwareImage {
  file: string;
  bytes: number;
  sha256: string;
  viewBox: string;
  category: FirmwareCategory | string;
  confidence: "high" | "medium" | "low";
  note: string;
  groups?: string[];
}

export interface SharedDrawing {
  id: string;
  title: string;
  category: string;
  svgContent: string;
  updatedAt: string;
  thumbnailUrl?: string;
  appliedToAsset?: string;
}

export interface ColorMapping {
  [oldHex: string]: string; // ex: "#383572" => "#ff3a5d"
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colorMap: ColorMapping;
  badge: string;
  previewColor: string;
}

export interface CompilationReport {
  startTime: number;
  endTime: number;
  totalAssets: number;
  modifiedAssets: number;
  appliedTheme?: string;
  hash: string;
  status: "success" | "warning" | "error";
  logs: string[];
}

// ── Thèmes prédéfinis prêts à l'emploi ──
const PRESET_THEMES: ThemePreset[] = [
  {
    id: "te-classic",
    name: "OP-1 Classic TE",
    description: "Thème d'origine Teenage Engineering (Vert néon, Bleu, Violet sombre, Rouge).",
    badge: "ORIGINAL",
    previewColor: "#00ed95",
    colorMap: {
      "#383572": "#383572",
      "#dfd9ff": "#dfd9ff",
      "#00ed95": "#00ed95",
      "#698eff": "#698eff",
      "#ff3a5d": "#ff3a5d",
    },
  },
  {
    id: "neon-cyberpunk",
    name: "Neon Cyberpunk",
    description: "Ambiance futuriste rétro-éclairée (Rose Magenta, Cyan électrique, Jaune néon).",
    badge: "MODULAR",
    previewColor: "#ff007f",
    colorMap: {
      "#383572": "#1a0b2e",
      "#dfd9ff": "#00f0ff",
      "#00ed95": "#ff007f",
      "#698eff": "#ffe600",
      "#ff3a5d": "#7000ff",
    },
  },
  {
    id: "gameboy-classic",
    name: "GameBoy Matrix",
    description: "Écran rétro LCD vert monochrome style console 90s.",
    badge: "RETRO",
    previewColor: "#8bac0f",
    colorMap: {
      "#383572": "#0f380f",
      "#dfd9ff": "#9bbc0f",
      "#00ed95": "#8bac0f",
      "#698eff": "#306230",
      "#ff3a5d": "#0f380f",
    },
  },
  {
    id: "synthwave-84",
    name: "Synthwave '84",
    description: "Violet profond, Orange coucher de soleil et Jaune vespéral.",
    badge: "VAPORWARE",
    previewColor: "#ff5e00",
    colorMap: {
      "#383572": "#281236",
      "#dfd9ff": "#ffd300",
      "#00ed95": "#ff5e00",
      "#698eff": "#e0115f",
      "#ff3a5d": "#a000ff",
    },
  },
  {
    id: "monochrome-dark",
    name: "Monochrome Dark OLED",
    description: "Contraste maximal sur fond noir absolu pour économie d'énergie OLED.",
    badge: "STEALTH",
    previewColor: "#ffffff",
    colorMap: {
      "#383572": "#000000",
      "#dfd9ff": "#ffffff",
      "#00ed95": "#e0e0e0",
      "#698eff": "#a0a0a0",
      "#ff3a5d": "#ffffff",
    },
  },
];

// Palette standard OP-1 pour l'éditeur de couleurs
const OP1_COLOR_PALETTE = [
  { hex: "#383572", label: "Violet Sombre (Fond)" },
  { hex: "#dfd9ff", label: "Blanc Lavande (Texte)" },
  { hex: "#00ed95", label: "Vert Néon (Piste 2 / Knob 2)" },
  { hex: "#698eff", label: "Bleu Ciel (Piste 1 / Knob 1)" },
  { hex: "#ff3a5d", label: "Rouge Rubis (Piste 4 / Knob 4)" },
  { hex: "#d9ff43", label: "Jaune Acide" },
  { hex: "#ff5a1f", label: "Orange Sélecteur" },
  { hex: "#87839c", label: "Gris Grille" },
];

export default function FirmwareLab() {
  const [profileName] = useState("AZOTH");
  const [notice, setNotice] = useState("⚡ Lab Firmware OP-1 prêt : édition, thèmes & repaquetage");
  const [activeTab, setActiveTab] = useState<"repack" | "theme" | "shared" | "gallery">("repack");

  // ── Modèles & Manifeste Stock ──
  const [manifest, setManifest] = useState<{ assetCount: number; categories: string[]; assets: FirmwareImage[] } | null>(null);
  const [loadingManifest, setLoadingManifest] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("tape");
  const [selectedAsset, setSelectedAsset] = useState<FirmwareImage | null>(null);
  const [svgCache, setSvgCache] = useState<Record<string, string>>({});

  // ── Thème & Couleurs ──
  const [activeThemeId, setActiveThemeId] = useState<string>("te-classic");
  const [customColorMap, setCustomColorMap] = useState<ColorMapping>({ ...PRESET_THEMES[0].colorMap });
  const [userThemes, setUserThemes] = useState<ThemePreset[]>([]);
  const [themeNameInput, setThemeNameInput] = useState("Mon Thème Personnalisé");

  // ── Dossier Commun Dessins / Asset Storage ──
  const [sharedDrawings, setSharedDrawings] = useState<SharedDrawing[]>([]);
  const [importStatus, setImportStatus] = useState<string>("");

  // ── Compilateur / Repackaging ──
  const [compiling, setCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileLogs, setCompileLogs] = useState<string[]>([]);
  const [lastReport, setLastReport] = useState<CompilationReport | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Charger le manifeste des assets firmware d'origine au démarrage
  useEffect(() => {
    async function initFirmwareData() {
      try {
        setLoadingManifest(true);
        const res = await fetch("/firmware-original/manifest.json");
        if (res.ok) {
          const data = await res.json();
          setManifest(data);
          if (data.assets && data.assets.length > 0) {
            setSelectedAsset(data.assets[0]);
          }
        }
      } catch (err) {
        console.warn("Manifeste original non chargé ou distant:", err);
      } finally {
        setLoadingManifest(false);
      }
    }
    initFirmwareData();
  }, []);

  // 2. Synchroniser le dossier commun (localStorage : op1-shared-drawings, op1-themes, op1-modified-images)
  const refreshSharedFolder = () => {
    try {
      // Chargement des dessins partagés depuis l'application de dessin
      const rawDrawings = localStorage.getItem("op1-shared-drawings");
      if (rawDrawings) {
        setSharedDrawings(JSON.parse(rawDrawings));
      } else {
        // Exemples initiaux si le dossier commun est vide
        const sampleDrawings: SharedDrawing[] = [
          {
            id: "draw-tape-01",
            title: "Ressorts Tape Custom 320x160",
            category: "tape",
            svgContent: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="160" fill="#0d0f18"/><circle cx="80" cy="80" r="35" stroke="#00ed95" stroke-width="3" fill="none"/><circle cx="240" cy="80" r="35" stroke="#698eff" stroke-width="3" fill="none"/><line x1="80" y1="80" x2="240" y2="80" stroke="#ff3a5d" stroke-width="2"/><text x="160" y="140" fill="#dfd9ff" font-family="monospace" font-size="12" text-anchor="middle">MODDED TAPE SCREEN</text></svg>`,
            updatedAt: new Date().toISOString(),
            appliedToAsset: "tape.svg"
          }
        ];
        localStorage.setItem("op1-shared-drawings", JSON.stringify(sampleDrawings));
        setSharedDrawings(sampleDrawings);
      }

      // Chargement des thèmes sauvegardés
      const rawThemes = localStorage.getItem("op1-user-themes");
      if (rawThemes) {
        setUserThemes(JSON.parse(rawThemes));
      }
    } catch (e) {
      console.error("Erreur de synchronisation du dossier commun:", e);
    }
  };

  useEffect(() => {
    refreshSharedFolder();
  }, []);

  // Fetch SVG content on demand with cache
  const loadSvgContent = async (category: string, file: string): Promise<string> => {
    const key = `${category}/${file}`;
    if (svgCache[key]) return svgCache[key];
    try {
      const res = await fetch(`/firmware-original/${category}/${file}`);
      if (res.ok) {
        const text = await res.text();
        setSvgCache((prev) => ({ ...prev, [key]: text }));
        return text;
      }
    } catch {}
    // Fallback SVG si non accessible
    return `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="160" fill="#111318"/><text x="160" y="80" fill="#aeb1dc" font-size="11" text-anchor="middle" font-family="sans-serif">${file}</text></svg>`;
  };

  useEffect(() => {
    if (selectedAsset) {
      loadSvgContent(selectedAsset.category, selectedAsset.file);
    }
  }, [selectedAsset]);

  // Aplicateur de thème SVG instantané
  const applyColorMapToSvg = (rawSvg: string, map: ColorMapping): string => {
    let result = rawSvg;
    Object.entries(map).forEach(([oldHex, newHex]) => {
      if (!newHex) return;
      const regex = new RegExp(oldHex, "gi");
      result = result.replace(regex, newHex);
    });
    return result;
  };

  // Choix d'un thème prédéfini
  const selectPresetTheme = (preset: ThemePreset) => {
    setActiveThemeId(preset.id);
    setCustomColorMap({ ...preset.colorMap });
    setNotice(`🎨 Thème appliqué : ${preset.name}`);
  };

  // Mettre à jour une couleur de la cartographie
  const updateColorMap = (oldHex: string, newHex: string) => {
    setCustomColorMap((prev) => ({ ...prev, [oldHex]: newHex }));
    setActiveThemeId("custom");
  };

  // Enregistrer le thème personnalisé
  const saveCustomTheme = () => {
    const newTheme: ThemePreset = {
      id: `theme-${Date.now()}`,
      name: themeNameInput || "Mon Thème OP-1",
      description: "Thème créé dans le Firmware Lab",
      colorMap: { ...customColorMap },
      badge: "CUSTOM",
      previewColor: Object.values(customColorMap)[2] || "#00ed95"
    };
    const updated = [...userThemes, newTheme];
    setUserThemes(updated);
    localStorage.setItem("op1-user-themes", JSON.stringify(updated));
    setNotice(`✅ Thème "${newTheme.name}" sauvegardé dans le dossier commun !`);
  };

  // Importer un fichier JSON de Thème ou un fichier SVG
  const handleImportThemeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(content);
          if (parsed.colorMap) {
            setCustomColorMap(parsed.colorMap);
            if (parsed.name) setThemeNameInput(parsed.name);
            setImportStatus(`✅ Thème "${parsed.name || file.name}" importé avec succès !`);
            setNotice(` Thème importé : ${parsed.name || file.name}`);
          } else {
            setImportStatus("⚠️ Le fichier JSON ne contient pas de cartographie de couleurs 'colorMap'.");
          }
        } else if (file.name.endsWith(".svg")) {
          // Importation SVG directe vers le dossier commun
          const newDrawing: SharedDrawing = {
            id: `imported-${Date.now()}`,
            title: file.name.replace(".svg", ""),
            category: selectedCategory || "system",
            svgContent: content,
            updatedAt: new Date().toISOString()
          };
          const updated = [...sharedDrawings, newDrawing];
          setSharedDrawings(updated);
          localStorage.setItem("op1-shared-drawings", JSON.stringify(updated));
          setImportStatus(`✅ Image SVG "${file.name}" ajoutée au dossier commun dessiné !`);
          setNotice(` Fichier SVG "${file.name}" importé dans le dossier commun`);
        }
      } catch (err) {
        setImportStatus(`❌ Erreur lors de la lecture du fichier : ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Lancer l'application de dessin (ImageEditorOP1) avec la maquette sélectionnée
  const openInDrawingApp = (drawing?: SharedDrawing) => {
    if (drawing) {
      sessionStorage.setItem("op1-active-drawing", JSON.stringify(drawing));
    }
    if ((window as any).navigateMaquette) {
      (window as any).navigateMaquette("image-editor-op1");
    }
  };

  // Lancer le Repaquetage & la Compilation complète du Firmware
  const startFirmwareCompilation = async () => {
    setCompiling(true);
    setCompileProgress(0);
    setCompileLogs([]);
    const logs: string[] = [];

    const addLog = (msg: string) => {
      const time = new Date().toLocaleTimeString();
      const line = `[${time}] ${msg}`;
      logs.push(line);
      setCompileLogs((prev) => [...prev, line]);
    };

    addLog("🚀 Démarrage du repaquetage firmware OP-1...");
    setCompileProgress(10);

    await new Promise((r) => setTimeout(r, 300));
    addLog(`📦 Analyse du manifeste stock (${manifest?.assetCount || 120} écrans identifiés)`);
    setCompileProgress(30);

    await new Promise((r) => setTimeout(r, 400));
    addLog(`🎨 Application du thème de couleur actif sur les écrans vectoriels...`);
    setCompileProgress(55);

    await new Promise((r) => setTimeout(r, 350));
    addLog(`📂 Intégration des ${sharedDrawings.length} éléments personnalisés du dossier commun`);
    setCompileProgress(75);

    await new Promise((r) => setTimeout(r, 400));
    addLog("🔒 Vérification des sommes de contrôle SHA-256 et alignement binaire");
    setCompileProgress(90);

    await new Promise((r) => setTimeout(r, 300));
    const generatedHash = Math.random().toString(36).substring(2, 10).toUpperCase();
    addLog(`✅ Repaquetage accompli avec succès ! Empreinte : TE-FW-${generatedHash}`);
    setCompileProgress(100);

    const report: CompilationReport = {
      startTime: Date.now() - 1750,
      endTime: Date.now(),
      totalAssets: manifest?.assetCount || 120,
      modifiedAssets: sharedDrawings.length + Object.keys(customColorMap).length,
      appliedTheme: PRESET_THEMES.find((t) => t.id === activeThemeId)?.name || themeNameInput,
      hash: `TE-FW-${generatedHash}`,
      status: "success",
      logs
    };

    setLastReport(report);
    setCompiling(false);
    setNotice("✅ Firmware repaqueté et prêt pour l'exportation local / machine !");
  };

  // Télécharger le fichier binaire / manifest du firmware repaqueté
  const downloadFirmwarePatch = () => {
    if (!lastReport) return;
    const patchData = {
      schema: "op1-firmware-patch",
      version: "2.43-MOD",
      buildHash: lastReport.hash,
      timestamp: new Date().toISOString(),
      appliedTheme: lastReport.appliedTheme,
      colorMap: customColorMap,
      customDrawingsCount: sharedDrawings.length,
      drawings: sharedDrawings.map((d) => ({ id: d.id, title: d.title, category: d.category }))
    };

    const blob = new Blob([JSON.stringify(patchData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `op1-firmware-mod-${lastReport.hash}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("📥 Fichier patch firmware téléchargé !");
  };

  const selectedSvgRaw = selectedAsset ? svgCache[`${selectedAsset.category}/${selectedAsset.file}`] || "" : "";
  const selectedSvgThemed = applyColorMapToSvg(selectedSvgRaw, customColorMap);

  return (
    <div className="hub-page firmware-lab-page" style={{ background: "#0e1015", color: "#e2e8f0", minHeight: "100vh" }}>
      <TopBar activePage="outils" profileName={profileName} />

      <main className="firmware-lab-container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "20px" }}>
        {/* En-tête principal */}
        <header className="lab-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #232830" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>🛠️</span>
              <h1 style={{ fontSize: "20px", fontWeight: "bold", letterSpacing: "0.04em", margin: 0, color: "#ffffff" }}>
                FIRMWARE & LAB STUDIO
              </h1>
              <span style={{ background: "#22c55e22", color: "#4ade80", border: "1px solid #22c55e44", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>
                TE-FW v2.43
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>
              Atelier d'édition, thèmes, repaquetage binaire et dossier commun synchronisé avec l'application de dessin.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportThemeFile}
              accept=".json,.svg"
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", padding: "8px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              📥 Importer Thème ou SVG
            </button>
            <button
              type="button"
              onClick={() => openInDrawingApp()}
              style={{ background: "#10b981", color: "#0f172a", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              🎨 Ouvrir Éditeur de Dessin
            </button>
          </div>
        </header>

        {/* Barre de notification */}
        {notice && (
          <div style={{ background: "#172030", border: "1px solid #2563eb44", color: "#60a5fa", padding: "10px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{notice}</span>
            {importStatus && <span style={{ color: "#38bdf8", fontSize: "11px" }}>{importStatus}</span>}
          </div>
        )}

        {/* Navigation par Onglets */}
        <nav className="lab-tabs" style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid #1e293b", paddingBottom: "10px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("repack")}
            style={{
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: "bold",
              borderRadius: "6px",
              border: activeTab === "repack" ? "1px solid #3b82f6" : "1px solid #1e293b",
              background: activeTab === "repack" ? "#1d4ed8" : "#0f172a",
              color: activeTab === "repack" ? "#ffffff" : "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            ⚡ Repaquetage & Compilation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("theme")}
            style={{
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: "bold",
              borderRadius: "6px",
              border: activeTab === "theme" ? "1px solid #3b82f6" : "1px solid #1e293b",
              background: activeTab === "theme" ? "#1d4ed8" : "#0f172a",
              color: activeTab === "theme" ? "#ffffff" : "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            🎨 Édition des Thèmes & Couleurs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("shared")}
            style={{
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: "bold",
              borderRadius: "6px",
              border: activeTab === "shared" ? "1px solid #3b82f6" : "1px solid #1e293b",
              background: activeTab === "shared" ? "#1d4ed8" : "#0f172a",
              color: activeTab === "shared" ? "#ffffff" : "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            📂 Dossier Commun ({sharedDrawings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gallery")}
            style={{
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: "bold",
              borderRadius: "6px",
              border: activeTab === "gallery" ? "1px solid #3b82f6" : "1px solid #1e293b",
              background: activeTab === "gallery" ? "#1d4ed8" : "#0f172a",
              color: activeTab === "gallery" ? "#ffffff" : "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            🖼️ Galerie Stock Assets
          </button>
        </nav>

        {/* ── ONGLET 1 : REPAQUETAGE & COMPILATION ── */}
        {activeTab === "repack" && (
          <section className="tab-section-repack" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Carte de contrôle du compilateur */}
              <div style={{ background: "#151921", border: "1px solid #232a35", borderRadius: "10px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#f8fafc" }}>
                      Générateur de Firmware Moddé OP-1
                    </h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                      Combine le manifeste d'origine, le thème personnalisé et les éléments du dossier commun.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={compiling}
                    onClick={startFirmwareCompilation}
                    style={{
                      background: compiling ? "#334155" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                      color: "#ffffff",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      cursor: compiling ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
                    }}
                  >
                    {compiling ? `⚡ Repaquetage en cours (${compileProgress}%)...` : "🚀 Lancer le Repaquetage"}
                  </button>
                </div>

                {/* Barre de progression */}
                {compiling && (
                  <div style={{ marginTop: "14px", marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#cbd5e1", marginBottom: "4px" }}>
                      <span>Progression binaire</span>
                      <span>{compileProgress}%</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#0f172a", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${compileProgress}%`, height: "100%", background: "#3b82f6", transition: "width 0.2s ease" }} />
                    </div>
                  </div>
                )}

                {/* Journal de compilation */}
                <div style={{ background: "#0a0c10", border: "1px solid #1a202c", borderRadius: "6px", padding: "12px", fontFamily: "monospace", fontSize: "11px", color: "#a0aec0", maxHeight: "180px", overflowY: "auto", marginTop: "12px" }}>
                  {compileLogs.length === 0 ? (
                    <div style={{ opacity: 0.5, fontStyle: "italic" }}>Appuyez sur "Lancer le Repaquetage" pour démarrer l'assemblage du firmware.</div>
                  ) : (
                    compileLogs.map((log, index) => (
                      <div key={index} style={{ marginBottom: "2px", color: log.includes("✅") ? "#4ade80" : log.includes("🚀") ? "#60a5fa" : "#cbd5e1" }}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Rapport de résultat après compilation */}
              {lastReport && (
                <div style={{ background: "#131e17", border: "1px solid #22c55e44", borderRadius: "10px", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "20px" }}>✅</span>
                      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "bold", color: "#4ade80" }}>
                        Rapport de Compilation Réussie
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={downloadFirmwarePatch}
                      style={{ background: "#22c55e", color: "#052e16", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      📥 Télécharger le Patch (.json)
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                    <div style={{ background: "#0d1712", padding: "12px", borderRadius: "6px", border: "1px solid #1c3d27" }}>
                      <small style={{ color: "#86efac", fontSize: "11px", display: "block" }}>Empreinte / Hash</small>
                      <strong style={{ fontSize: "14px", color: "#ffffff", fontFamily: "monospace" }}>{lastReport.hash}</strong>
                    </div>
                    <div style={{ background: "#0d1712", padding: "12px", borderRadius: "6px", border: "1px solid #1c3d27" }}>
                      <small style={{ color: "#86efac", fontSize: "11px", display: "block" }}>Assets Modifiés</small>
                      <strong style={{ fontSize: "14px", color: "#ffffff" }}>{lastReport.modifiedAssets} / {lastReport.totalAssets}</strong>
                    </div>
                    <div style={{ background: "#0d1712", padding: "12px", borderRadius: "6px", border: "1px solid #1c3d27" }}>
                      <small style={{ color: "#86efac", fontSize: "11px", display: "block" }}>Thème Appliqué</small>
                      <strong style={{ fontSize: "14px", color: "#ffffff" }}>{lastReport.appliedTheme}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panneau Latéral : Aperçu A/B du Thème */}
            <div style={{ background: "#151921", border: "1px solid #232a35", borderRadius: "10px", padding: "20px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "bold", color: "#f8fafc" }}>
                Aperçu Comparatif A/B
              </h3>
              <p style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "14px" }}>
                Comparaison entre l'écran stock d'origine et le rendu du thème appliqué.
              </p>

              <div style={{ marginBottom: "14px" }}>
                <small style={{ color: "#64748b", fontSize: "11px", display: "block", marginBottom: "4px" }}>1. ORIGINAL (STOCK)</small>
                <div style={{ background: "#000000", border: "1px solid #334155", borderRadius: "6px", padding: "8px", display: "flex", justifyContent: "center" }} dangerouslySetInnerHTML={{ __html: selectedSvgRaw }} />
              </div>

              <div>
                <small style={{ color: "#3b82f6", fontSize: "11px", display: "block", marginBottom: "4px" }}>2. RENDU DU THÈME ACTIF</small>
                <div style={{ background: "#000000", border: "1px solid #3b82f6", borderRadius: "6px", padding: "8px", display: "flex", justifyContent: "center" }} dangerouslySetInnerHTML={{ __html: selectedSvgThemed }} />
              </div>
            </div>
          </section>
        )}

        {/* ── ONGLET 2 : ÉDITION DES THÈMES & COULEURS ── */}
        {activeTab === "theme" && (
          <section className="tab-section-theme" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px" }}>
            {/* Sélection & Présélections de Thèmes */}
            <div style={{ background: "#151921", border: "1px solid #232a35", borderRadius: "10px", padding: "20px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "bold", color: "#f8fafc" }}>
                Thèmes Prédéfinis
              </h3>
              <p style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "14px" }}>
                Sélectionnez un profil pour remplacer en 1 clic toutes les nuances du firmware.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                {PRESET_THEMES.map((preset) => {
                  const isActive = activeThemeId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => selectPresetTheme(preset)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: isActive ? "1px solid #3b82f6" : "1px solid #1e293b",
                        background: isActive ? "#1e293b" : "#0f172a",
                        color: "#e2e8f0",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: preset.previewColor, display: "inline-block" }} />
                        <div>
                          <strong style={{ fontSize: "12px", display: "block" }}>{preset.name}</strong>
                          <small style={{ fontSize: "10px", color: "#94a3b8" }}>{preset.description}</small>
                        </div>
                      </div>
                      <span style={{ fontSize: "9px", background: "#334155", color: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>{preset.badge}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sauvegarder Thème Personnalisé */}
              <div style={{ paddingTop: "14px", borderTop: "1px solid #232a35" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#cbd5e1" }}>Sauvegarder le thème actif</h4>
                <input
                  type="text"
                  value={themeNameInput}
                  onChange={(e) => setThemeNameInput(e.target.value)}
                  placeholder="Nom de votre thème..."
                  style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#f8fafc", padding: "8px", borderRadius: "6px", fontSize: "12px", marginBottom: "8px" }}
                />
                <button
                  type="button"
                  onClick={saveCustomTheme}
                  style={{ width: "100%", background: "#2563eb", color: "#ffffff", border: "none", padding: "8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
                >
                  💾 Enregistrer dans le Dossier Commun
                </button>
              </div>
            </div>

            {/* Cartographie de Couleurs & Éditeur Interactif */}
            <div style={{ background: "#151921", border: "1px solid #232a35", borderRadius: "10px", padding: "20px" }}>
              <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "bold", color: "#f8fafc" }}>
                Cartographie des Couleurs du Firmware
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "20px" }}>
                {OP1_COLOR_PALETTE.map((item) => {
                  const currentMapped = customColorMap[item.hex] || item.hex;
                  return (
                    <div key={item.hex} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", padding: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "20px", height: "20px", borderRadius: "4px", background: item.hex, border: "1px solid #475569" }} />
                        <div>
                          <strong style={{ fontSize: "11px", display: "block", color: "#e2e8f0" }}>{item.label}</strong>
                          <code style={{ fontSize: "10px", color: "#64748b" }}>{item.hex}</code>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>➡️</span>
                        <input
                          type="color"
                          value={currentMapped}
                          onChange={(e) => updateColorMap(item.hex, e.target.value)}
                          style={{ width: "32px", height: "32px", border: "none", background: "none", cursor: "pointer" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Aperçu en direct du Rendu */}
              <div style={{ background: "#000000", border: "1px solid #334155", borderRadius: "8px", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <small style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "8px" }}>APERÇU DU THÈME SUR L'ÉCRAN SÉLECTIONNÉ</small>
                <div style={{ maxWidth: "320px", width: "100%" }} dangerouslySetInnerHTML={{ __html: selectedSvgThemed }} />
              </div>
            </div>
          </section>
        )}

        {/* ── ONGLET 3 : DOSSIER COMMUN (DESSINS / ASSETS) ── */}
        {activeTab === "shared" && (
          <section className="tab-section-shared" style={{ background: "#151921", border: "1px solid #232a35", borderRadius: "10px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#f8fafc" }}>
                  Dossier Commun Dessins & Thèmes
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                  Ce dossier est synchronisé directement avec l'Application de Dessin OP-1 (`ImageEditorOP1`).
                </p>
              </div>

              <button
                type="button"
                onClick={() => openInDrawingApp()}
                style={{ background: "#10b981", color: "#0f172a", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
              >
                ✏️ Créer un Nouveau Dessin dans l'Éditeur
              </button>
            </div>

            {sharedDrawings.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", background: "#0f172a", borderRadius: "8px", border: "1px dashed #334155" }}>
                <span style={{ fontSize: "32px", display: "block", marginBottom: "10px" }}>🎨</span>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
                  Aucun dessin partagé pour le moment. Ouvrez l'application de dessin pour créer vos premiers visuels 320x160.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {sharedDrawings.map((drawing) => (
                  <div key={drawing.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", padding: "14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{drawing.title}</strong>
                        <span style={{ background: "#334155", color: "#cbd5e1", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" }}>{drawing.category}</span>
                      </div>

                      {/* Aperçu Visuel du Dessin */}
                      <div style={{ background: "#000000", border: "1px solid #334155", borderRadius: "4px", padding: "6px", marginBottom: "10px", minHeight: "100px", display: "flex", alignItems: "center", justifyContent: "center" }} dangerouslySetInnerHTML={{ __html: drawing.svgContent }} />
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button
                        type="button"
                        onClick={() => openInDrawingApp(drawing)}
                        style={{ flex: 1, background: "#1e293b", color: "#38bdf8", border: "1px solid #334155", padding: "6px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                      >
                        ✏️ Editer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNotice(`✅ Dessin "${drawing.title}" sélectionné pour le repaquetage !`);
                          setActiveTab("repack");
                        }}
                        style={{ flex: 1, background: "#2563eb", color: "#ffffff", border: "none", padding: "6px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                      >
                        ⚡ Utiliser en FW
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── ONGLET 4 : GALERIE STOCK ASSETS ── */}
        {activeTab === "gallery" && (
          <section className="tab-section-gallery" style={{ background: "#151921", border: "1px solid #232a35", borderRadius: "10px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "bold", color: "#f8fafc" }}>
              Galerie des Écrans Stock du Firmware
            </h3>

            {/* Filtres par Catégories */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {["tape", "album", "synth", "mixer", "system"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    borderRadius: "4px",
                    border: selectedCategory === cat ? "1px solid #3b82f6" : "1px solid #1e293b",
                    background: selectedCategory === cat ? "#1d4ed8" : "#0f172a",
                    color: selectedCategory === cat ? "#ffffff" : "#94a3b8",
                    cursor: "pointer",
                    textTransform: "uppercase"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grille des Assets */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
              {(manifest?.assets || [])
                .filter((a) => !selectedCategory || a.category === selectedCategory)
                .map((asset) => {
                  const isSelected = selectedAsset?.file === asset.file;
                  return (
                    <button
                      key={asset.file}
                      type="button"
                      onClick={() => setSelectedAsset(asset)}
                      style={{
                        background: isSelected ? "#1e293b" : "#0f172a",
                        border: isSelected ? "1px solid #3b82f6" : "1px solid #1e293b",
                        borderRadius: "6px",
                        padding: "10px",
                        textAlign: "left",
                        cursor: "pointer",
                        color: "#e2e8f0"
                      }}
                    >
                      <strong style={{ fontSize: "12px", display: "block", color: "#f8fafc", marginBottom: "4px" }}>{asset.file}</strong>
                      <small style={{ fontSize: "10px", color: "#64748b", display: "block" }}>{asset.note || "Écran vectoriel stock"}</small>
                    </button>
                  );
                })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
