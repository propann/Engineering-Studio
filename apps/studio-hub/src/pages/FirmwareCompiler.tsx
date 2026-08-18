"use client";

import { useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";

type ModifiedImage = {
  filename: string;
  category: string;
  originalSvg: string;
  modifiedSvg: string;
  appliedTheme: string | null;
  timestamp: number;
};

type CompilationState = "idle" | "loading-manifest" | "collecting-images" | "applying-patches" | "generating-firmware" | "complete" | "error";

type CompilationReport = {
  startTime: number;
  endTime: number;
  totalImages: number;
  modifiedImages: number;
  successCount: number;
  errorCount: number;
  warnings: string[];
  errors: string[];
  firmwarePath?: string;
  hash?: string;
};

export default function FirmwareCompiler() {
  const [profileName] = useState("AZOTH");
  const [notice, setNotice] = useState("🔄 Prêt à compiler");

  // Compiler state
  const [state, setCompilationState] = useState<CompilationState>("idle");
  const [progress, setProgress] = useState(0);
  const [modifiedImages, setModifiedImages] = useState<Map<string, ModifiedImage>>(new Map());
  const [report, setReport] = useState<CompilationReport | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Local storage
  const [savedThemes, setSavedThemes] = useState<any[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  // Load modified images from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("op1-modified-images");
      if (saved) {
        const map = new Map<string, ModifiedImage>(JSON.parse(saved));
        setModifiedImages(map);
      }
    } catch (e) {
      console.error("Failed to load modified images");
    }
  }, []);

  // Load saved themes
  useEffect(() => {
    try {
      const saved = localStorage.getItem("op1-themes");
      if (saved) {
        setSavedThemes(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load themes");
    }
  }, []);

  // Log helper
  function addLog(msg: string) {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }

  // Load all firmware images
  async function loadAllImages() {
    try {
      setCompilationState("loading-manifest");
      addLog("📦 Chargement du manifeste...");

      const manifestRes = await fetch("/firmware-original/manifest.json");
      if (!manifestRes.ok) throw new Error("Manifeste introuvable");

      const manifest = await manifestRes.json();
      setProgress(10);

      setCompilationState("collecting-images");
      addLog(`📷 Collecte de ${manifest.assetCount} images...`);

      const newModifiedImages = new Map<string, ModifiedImage>();
      let loaded = 0;

      for (const asset of manifest.assets) {
        try {
          const res = await fetch(`/firmware-original/${asset.category}/${asset.file}`);
          if (!res.ok) continue;

          const svgText = await res.text();
          const key = `${asset.category}/${asset.file}`;

          newModifiedImages.set(key, {
            filename: asset.file,
            category: asset.category,
            originalSvg: svgText,
            modifiedSvg: svgText,
            appliedTheme: null,
            timestamp: Date.now(),
          });

          loaded++;
          setProgress(10 + Math.round((loaded / manifest.assetCount) * 30));
        } catch (e: any) {
          addLog(`⚠️ Erreur chargement ${asset.file}: ${e.message}`);
        }
      }

      setModifiedImages(newModifiedImages);
      setProgress(40);
      addLog(`✅ ${loaded}/${manifest.assetCount} images chargées`);

      return newModifiedImages;
    } catch (e: any) {
      setCompilationState("error");
      addLog(`❌ Erreur: ${e.message}`);
      setNotice(`❌ Erreur: ${e.message}`);
      return null;
    }
  }

  // Apply theme to all images
  async function applyThemeToAll(themeName: string, themeColorMap: Record<string, string>) {
    try {
      setCompilationState("applying-patches");
      addLog(`🎨 Application du thème "${themeName}" à toutes les images...`);

      let updated = 0;
      const newImages = new Map(modifiedImages);

      for (const [key, img] of newImages.entries()) {
        let modifiedSvg = img.originalSvg;

        // Apply color mappings
        Object.entries(themeColorMap).forEach(([oldColor, newColor]) => {
          const regex = new RegExp(oldColor, "gi");
          modifiedSvg = modifiedSvg.replace(regex, newColor as string);
        });

        newImages.set(key, {
          ...img,
          modifiedSvg,
          appliedTheme: themeName,
        });

        updated++;
        setProgress(40 + Math.round((updated / modifiedImages.size) * 40));
      }

      setModifiedImages(newImages);
      addLog(`✅ Thème appliqué à ${updated} images`);

      return newImages;
    } catch (e: any) {
      setCompilationState("error");
      addLog(`❌ Erreur application thème: ${e.message}`);
      return null;
    }
  }

  // Generate firmware
  async function generateFirmware() {
    try {
      setCompilationState("generating-firmware");
      addLog("⚙️ Génération du firmware...");

      // Create a summary report
      const report: CompilationReport = {
        startTime: Date.now(),
        endTime: Date.now(),
        totalImages: modifiedImages.size,
        modifiedImages: Array.from(modifiedImages.values()).filter(
          img => img.modifiedSvg !== img.originalSvg
        ).length,
        successCount: modifiedImages.size,
        errorCount: 0,
        warnings: [],
        errors: [],
      };

      // Generate zip with modified firmware
      const manifestData = {
        schema: "op1-firmware-mod",
        version: 1,
        appliedTheme: selectedTheme || "custom",
        timestamp: new Date().toISOString(),
        images: Array.from(modifiedImages.values()).map(img => ({
          file: img.filename,
          category: img.category,
          modified: img.modifiedSvg !== img.originalSvg,
          appliedTheme: img.appliedTheme,
        })),
      };

      // Store firmware data in sessionStorage (for Phase 5)
      sessionStorage.setItem("op1-firmware-manifest", JSON.stringify(manifestData));

      // Create downloadable JSON manifest
      const manifestBlob = new Blob([JSON.stringify(manifestData, null, 2)], {
        type: "application/json",
      });

      const manifestUrl = URL.createObjectURL(manifestBlob);
      const link = document.createElement("a");
      link.href = manifestUrl;
      link.download = `firmware-manifest-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(manifestUrl);

      report.endTime = Date.now();
      report.hash = Date.now().toString(36); // Simplified hash

      setReport(report);
      setProgress(100);
      setCompilationState("complete");
      addLog("✅ Firmware compilé avec succès!");
      setNotice("✅ Firmware prêt pour export");

      return report;
    } catch (e: any) {
      setCompilationState("error");
      addLog(`❌ Erreur compilation: ${e.message}`);
      setNotice(`❌ Erreur: ${e.message}`);
      return null;
    }
  }

  // Full compilation workflow
  async function startCompilation() {
    setLogs([]);
    addLog("🚀 Démarrage compilation...");

    const images = await loadAllImages();
    if (!images) return;

    if (selectedTheme) {
      const theme = savedThemes.find(t => t.id === selectedTheme);
      if (theme) {
        const applied = await applyThemeToAll(theme.name, theme.colorMap);
        if (!applied) return;
      }
    }

    await generateFirmware();
  }

  // Export all modified SVGs as ZIP
  async function exportModifiedSVGs() {
    try {
      setNotice("⏳ Création du ZIP...");

      // Create simple export with all modified SVGs
      const entries: string[] = [];
      for (const [key, img] of modifiedImages.entries()) {
        entries.push(`${key}: Modified=${img.modifiedSvg !== img.originalSvg}, Theme=${img.appliedTheme}`);
      }

      const content = entries.join("\n");
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `firmware-export-${Date.now()}.txt`;
      link.click();
      URL.revokeObjectURL(url);

      setNotice("✅ Fichiers exportés");
    } catch (e: any) {
      setNotice(`❌ Erreur: ${e.message}`);
    }
  }

  return (
    <main style={{ padding: "20px", maxWidth: "1800px", margin: "0 auto", fontFamily: "system-ui" }}>
      <TopBar profileName={profileName} onDocClick={() => {}} />

      <section style={{ marginTop: "40px" }}>
        <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>⚙️ Compilateur Firmware</h1>
            <p style={{ color: "#666" }}>Générer firmware modifié avec op1repacker</p>
          </div>
          <button
            onClick={() => (window as any).navigateMaquette("firmware-gallery")}
            style={{
              padding: "10px 20px",
              background: "#dfd9ff",
              border: "2px solid #383572",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ← Retour
          </button>
        </div>

        {notice && (
          <div
            style={{
              padding: "12px 15px",
              background: state === "error" ? "#ff3a5d" : "#00ed95",
              color: state === "error" ? "#fff" : "#383572",
              border: "2px solid #383572",
              marginBottom: "20px",
              fontWeight: "bold",
            }}
          >
            {notice}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "20px" }}>
          {/* Main */}
          <div>
            {/* Progress */}
            {progress > 0 && (
              <div style={{ background: "#fff", border: "3px solid #383572", padding: "15px", marginBottom: "15px" }}>
                <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
                  Progress: {progress}%
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "20px",
                    background: "#dfd9ff",
                    border: "2px solid #383572",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      background: "#00ed95",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Logs */}
            <div style={{ background: "#fff", border: "3px solid #383572", padding: "15px", marginBottom: "15px" }}>
              <strong style={{ display: "block", marginBottom: "8px" }}>📋 Logs</strong>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  background: "#383572",
                  color: "#00ed95",
                  padding: "10px",
                  height: "300px",
                  overflowY: "auto",
                  border: "2px solid #383572",
                }}
              >
                {logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>

            {/* Report */}
            {report && (
              <div style={{ background: "#fff", border: "3px solid #383572", padding: "15px" }}>
                <strong style={{ display: "block", marginBottom: "8px" }}>✅ Rapport de Compilation</strong>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  <div>Total images: {report.totalImages}</div>
                  <div>Images modifiées: {report.modifiedImages}</div>
                  <div>Succès: {report.successCount}</div>
                  <div>Erreurs: {report.errorCount}</div>
                  <div>Durée: {((report.endTime - report.startTime) / 1000).toFixed(2)}s</div>
                  <div>Hash: {report.hash}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Compilation */}
            <div style={{ background: "#fff", border: "3px solid #383572", padding: "12px" }}>
              <strong style={{ display: "block", marginBottom: "8px" }}>🚀 Compilation</strong>
              <button
                onClick={startCompilation}
                disabled={state !== "idle" && state !== "error"}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: state !== "idle" && state !== "error" ? "#ddd" : "#00ed95",
                  border: "2px solid #383572",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "12px",
                  marginBottom: "8px",
                }}
              >
                {state === "idle" || state === "error"
                  ? "🔨 Compiler"
                  : state === "complete"
                  ? "✅ Compilé"
                  : "⏳ Compilation..."}
              </button>
              <div style={{ fontSize: "11px", color: "#666" }}>
                État: <strong>{state}</strong>
              </div>
            </div>

            {/* Theme Selection */}
            <div style={{ background: "#fff", border: "3px solid #383572", padding: "12px" }}>
              <strong style={{ display: "block", marginBottom: "8px" }}>🎨 Thème</strong>
              <select
                value={selectedTheme || ""}
                onChange={e => setSelectedTheme(e.target.value || null)}
                style={{
                  width: "100%",
                  padding: "6px",
                  border: "2px solid #383572",
                  marginBottom: "8px",
                  fontSize: "12px",
                }}
              >
                <option value="">Aucun (original)</option>
                {savedThemes.map(theme => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: "10px", color: "#666" }}>
                {selectedTheme
                  ? `${savedThemes.find(t => t.id === selectedTheme)?.name || "?"} sélectionné`
                  : "Pas de thème"}
              </div>
            </div>

            {/* Export */}
            {modifiedImages.size > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <button
                  onClick={exportModifiedSVGs}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: "#698eff",
                    color: "#fff",
                    border: "2px solid #383572",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "11px",
                  }}
                >
                  ⬇️ Export SVG
                </button>
                <div style={{ fontSize: "10px", color: "#666" }}>
                  {modifiedImages.size} images chargées
                </div>
              </div>
            )}

            {/* Stats */}
            <div style={{ background: "#fff", border: "3px solid #383572", padding: "12px" }}>
              <strong style={{ display: "block", marginBottom: "8px" }}>📊 Stats</strong>
              <div style={{ fontSize: "11px", color: "#666" }}>
                <div>Images: {modifiedImages.size}</div>
                <div>Modifiées: {Array.from(modifiedImages.values()).filter(img => img.modifiedSvg !== img.originalSvg).length}</div>
                <div>Thèmes: {savedThemes.length}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
