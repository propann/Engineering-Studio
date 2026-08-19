import { createLogger } from "@studio-hub/audio-bridge";
const log = createLogger("Theme");
"use client";

import { useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";

type ColorMapping = Record<string, string>; // old hex → new hex
type Theme = {
  id: string;
  name: string;
  description: string;
  colorMap: ColorMapping;
  createdAt: string;
};

type PreviewImage = {
  name: string;
  originalSvg: string;
  themeSvg: string;
};

const OP1_PALETTE = [
  { name: "Dark Violet", hex: "#383572" },
  { name: "Light White", hex: "#dfd9ff" },
  { name: "Green", hex: "#00ed95" },
  { name: "Blue", hex: "#698eff" },
  { name: "Red", hex: "#ff3a5d" },
  { name: "Text", hex: "#aeb1dc" },
  { name: "Background", hex: "#9256d7" },
  { name: "Alt Blue", hex: "#4d9eff" },
];

export default function ThemeEditor() {
  const [profileName] = useState("AZOTH");
  const [notice, setNotice] = useState("");

  // Theme state
  const [themeName, setThemeName] = useState("Mon Thème");
  const [themeDesc, setThemeDesc] = useState("Thème personnalisé pour OP-1");
  const [colorMap, setColorMap] = useState<ColorMapping>({
    "#383572": "#ff3a5d", // Dark → Red
    "#dfd9ff": "#00ed95", // Light → Green
    "#00ed95": "#698eff", // Green → Blue
    "#698eff": "#ff3a5d", // Blue → Red
  });

  // UI state
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [savedThemes, setSavedThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  // Load saved themes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("op1-themes");
      if (saved) {
        setSavedThemes(JSON.parse(saved));
      }
    } catch (e) {
      log.error("Failed to load themes");
    }
  }, []);

  // Apply color mapping to SVG
  function applyThemeToSvg(svgText: string, map: ColorMapping): string {
    let result = svgText;
    Object.entries(map).forEach(([oldColor, newColor]) => {
      // Case-insensitive hex replacement
      const regex = new RegExp(oldColor, "gi");
      result = result.replace(regex, newColor);
    });
    return result;
  }

  // Preview theme on sample images
  async function previewTheme() {
    try {
      setNotice("⏳ Génération prévisualisation...");

      const samples = ["tape", "album", "mixer"];
      const previews: PreviewImage[] = [];

      for (const name of samples) {
        try {
          const res = await fetch(`/firmware-original/tape/${name}.svg`);
          if (!res.ok) continue;

          const originalSvg = await res.text();
          const themeSvg = applyThemeToSvg(originalSvg, colorMap);

          previews.push({ name, originalSvg, themeSvg });
        } catch {
          // Skip if not found
        }
      }

      setPreviewImages(previews);
      setNotice(`✅ Prévisualisation générée (${previews.length} images)`);
    } catch (e: any) {
      setNotice(`❌ Erreur: ${e.message}`);
    }
  }

  // Save theme
  function saveTheme() {
    try {
      const newTheme: Theme = {
        id: `theme-${Date.now()}`,
        name: themeName,
        description: themeDesc,
        colorMap,
        createdAt: new Date().toISOString(),
      };

      const updated = [...savedThemes, newTheme];
      localStorage.setItem("op1-themes", JSON.stringify(updated));
      setSavedThemes(updated);
      setSelectedTheme(newTheme);
      setNotice(`✅ Thème "${themeName}" sauvegardé`);
    } catch (e: any) {
      setNotice(`❌ Erreur: ${e.message}`);
    }
  }

  // Load theme
  function loadTheme(theme: Theme) {
    setSelectedTheme(theme);
    setThemeName(theme.name);
    setThemeDesc(theme.description);
    setColorMap(theme.colorMap);
    setNotice(`✅ Thème "${theme.name}" chargé`);
  }

  // Delete theme
  function deleteTheme(themeId: string) {
    const updated = savedThemes.filter(t => t.id !== themeId);
    localStorage.setItem("op1-themes", JSON.stringify(updated));
    setSavedThemes(updated);
    if (selectedTheme?.id === themeId) {
      setSelectedTheme(null);
    }
    setNotice("✅ Thème supprimé");
  }

  // Reset to default
  function resetToDefault() {
    setColorMap({
      "#383572": "#383572",
      "#dfd9ff": "#dfd9ff",
      "#00ed95": "#00ed95",
      "#698eff": "#698eff",
    });
    setNotice("↻ Réinitialisé aux couleurs par défaut");
  }

  return (
    <main style={{ padding: "20px", maxWidth: "1600px", margin: "0 auto", fontFamily: "system-ui" }}>
      <TopBar profileName={profileName} onDocClick={() => {}} />

      <section style={{ marginTop: "40px" }}>
        <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between" }}>
          <div>
            <h1>🎨 Éditeur de Thèmes</h1>
            <p style={{ color: "#666" }}>Créer des variations de couleurs pour le firmware</p>
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
              background: "#00ed95",
              border: "2px solid #383572",
              marginBottom: "20px",
              fontWeight: "bold",
            }}
          >
            {notice}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "20px" }}>
          {/* Left: Theme Editor */}
          <div>
            {/* Theme Info */}
            <div style={{ background: "#fff", border: "3px solid #383572", padding: "15px", marginBottom: "15px" }}>
              <strong style={{ display: "block", marginBottom: "8px" }}>Thème</strong>
              <input
                type="text"
                value={themeName}
                onChange={e => setThemeName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "2px solid #383572",
                  marginBottom: "8px",
                  boxSizing: "border-box",
                  fontWeight: "bold",
                }}
                placeholder="Nom du thème"
              />
              <textarea
                value={themeDesc}
                onChange={e => setThemeDesc(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "2px solid #383572",
                  boxSizing: "border-box",
                  fontSize: "12px",
                  minHeight: "60px",
                }}
                placeholder="Description"
              />
            </div>

            {/* Color Mappings */}
            <div style={{ background: "#fff", border: "3px solid #383572", padding: "15px", marginBottom: "15px" }}>
              <strong style={{ display: "block", marginBottom: "12px" }}>Mappages de couleur</strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(colorMap).map(([oldColor, newColor]) => (
                  <div key={oldColor} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        background: oldColor,
                        border: "2px solid #383572",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>→</span>
                    <input
                      type="color"
                      value={newColor}
                      onChange={e =>
                        setColorMap({ ...colorMap, [oldColor]: e.target.value })
                      }
                      style={{
                        width: "40px",
                        height: "30px",
                        border: "2px solid #383572",
                        cursor: "pointer",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "#666" }}>{newColor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Palette Presets */}
            <div style={{ background: "#fff", border: "3px solid #383572", padding: "15px", marginBottom: "15px" }}>
              <strong style={{ display: "block", marginBottom: "8px" }}>Palettes rapides</strong>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                {OP1_PALETTE.map(color => (
                  <button
                    key={color.hex}
                    onClick={() => {
                      const oldColor = Object.keys(colorMap)[0];
                      if (oldColor) {
                        setColorMap({ ...colorMap, [oldColor]: color.hex });
                      }
                    }}
                    style={{
                      width: "100%",
                      height: "30px",
                      background: color.hex,
                      border: "2px solid #383572",
                      cursor: "pointer",
                      fontSize: "10px",
                      fontWeight: "bold",
                      color: color.hex === "#383572" ? "#dfd9ff" : "#383572",
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <button
                onClick={previewTheme}
                style={{
                  padding: "10px",
                  background: "#698eff",
                  color: "#fff",
                  border: "2px solid #383572",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                👁️ Prévisualiser
              </button>
              <button
                onClick={saveTheme}
                style={{
                  padding: "10px",
                  background: "#00ed95",
                  color: "#383572",
                  border: "2px solid #383572",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                💾 Sauvegarder
              </button>
              <button
                onClick={resetToDefault}
                style={{
                  padding: "10px",
                  background: "#dfd9ff",
                  color: "#383572",
                  border: "2px solid #383572",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ↻ Réinitialiser
              </button>
            </div>
          </div>

          {/* Right: Preview + Saved Themes */}
          <div>
            {/* Preview */}
            {previewImages.length > 0 && (
              <div style={{ background: "#fff", border: "3px solid #383572", padding: "15px", marginBottom: "15px" }}>
                <strong style={{ display: "block", marginBottom: "12px" }}>Prévisualisation</strong>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px" }}>
                  {previewImages.map(preview => (
                    <div key={preview.name}>
                      <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>{preview.name}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div>
                          <div style={{ fontSize: "10px", color: "#666", marginBottom: "4px" }}>Original</div>
                          <SvgPreview svgText={preview.originalSvg} />
                        </div>
                        <div>
                          <div style={{ fontSize: "10px", color: "#666", marginBottom: "4px" }}>Thème</div>
                          <SvgPreview svgText={preview.themeSvg} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Themes */}
            {savedThemes.length > 0 && (
              <div style={{ background: "#fff", border: "3px solid #383572", padding: "15px" }}>
                <strong style={{ display: "block", marginBottom: "12px" }}>Thèmes Sauvegardés ({savedThemes.length})</strong>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {savedThemes.map(theme => (
                    <div
                      key={theme.id}
                      style={{
                        padding: "10px",
                        background: selectedTheme?.id === theme.id ? "#00ed95" : "#dfd9ff",
                        border: "2px solid #383572",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        onClick={() => loadTheme(theme)}
                        style={{ fontWeight: "bold", marginBottom: "4px" }}
                      >
                        {theme.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px" }}>
                        {theme.description}
                      </div>
                      <button
                        onClick={() => deleteTheme(theme.id)}
                        style={{
                          padding: "4px 8px",
                          background: "#ff3a5d",
                          color: "#fff",
                          border: "2px solid #383572",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

// SVG Preview component
function SvgPreview({ svgText }: { svgText: string }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    setDataUrl(`data:image/svg+xml;base64,${btoa(svgText)}`);
  }, [svgText]);

  return (
    <img
      src={dataUrl}
      style={{
        width: "100%",
        maxHeight: "120px",
        border: "2px solid #383572",
        imageRendering: "pixelated",
        background: "#fff",
      }}
      alt="Preview"
    />
  );
}
