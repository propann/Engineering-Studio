"use client";

import { useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";

type FirmwareImage = {
  file: string;
  bytes: number;
  sha256: string;
  viewBox: string;
  category: string;
  confidence: "high" | "medium" | "low";
  note: string;
  groups?: string[]; // SVG group IDs for animations
};

type AnimationFrame = {
  id: string;
  visibleGroups: string[];
  duration: number;
};

type FirmwareManifest = {
  schema: string;
  version: number;
  assetCount: number;
  categories: string[];
  assets: FirmwareImage[];
};

export default function FirmwareGallery() {
  const [profileName] = useState("AZOTH");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [manifest, setManifest] = useState<FirmwareManifest | null>(null);
  const [svgCache, setSvgCache] = useState<Map<string, string>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<FirmwareImage | null>(null);
  const [animationFrames, setAnimationFrames] = useState<AnimationFrame[]>([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const zipRef = useRef<Map<string, string>>(new Map());

  // Extract SVG groups
  function extractGroups(svgText: string): string[] {
    const groupMatches = svgText.matchAll(/<g\s+id="([^"]+)"/g);
    return Array.from(groupMatches).map(m => m[1]);
  }

  // Load firmware ZIP + manifest
  useEffect(() => {
    async function loadFirmware() {
      try {
        setNotice("⏳ Chargement firmware...");

        // Load manifest
        const manifestRes = await fetch("/firmware-original/manifest.json");
        if (!manifestRes.ok) throw new Error("Manifest not found");
        const manifestData: FirmwareManifest = await manifestRes.json();

        setManifest(manifestData);
        setSelectedCategory(manifestData.categories[0] || null);
        setNotice(`✅ Firmware chargé (${manifestData.assetCount} images)`);
      } catch (e: any) {
        setNotice(`❌ Erreur: ${e.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadFirmware();
  }, []);

  // Load SVG when image is selected
  async function loadSVG(image: FirmwareImage) {
    try {
      setNotice(`⏳ Chargement ${image.file}...`);

      const cachePath = `display-extracted/${image.category}/${image.file}`;

      // Try to fetch from ZIP
      const res = await fetch(`/firmware-original.zip`);
      if (!res.ok) throw new Error("ZIP not found");

      // For now, load from extracted folder
      const svgRes = await fetch(`/firmware-original/${image.category}/${image.file}`);

      if (svgRes.ok) {
        const svgText = await svgRes.text();
        svgCache.set(cachePath, svgText);

        // Extract groups
        const groups = extractGroups(svgText);
        const imageWithGroups: FirmwareImage = { ...image, groups };

        // Create initial animation frames
        const frames: AnimationFrame[] = groups.length > 0 ? [
          { id: "frame-1", visibleGroups: groups, duration: 200 }
        ] : [];

        setSelectedImage(imageWithGroups);
        setAnimationFrames(frames);
        setCurrentFrameIdx(0);
        setNotice(`✅ ${image.file} chargée (${groups.length} groupes)`);
      } else {
        setNotice(`⚠️ Preview non disponible`);
        setSelectedImage(image);
      }
    } catch (e: any) {
      setNotice(`❌ Erreur SVG: ${e.message}`);
    }
  }

  const filteredImages = manifest?.assets.filter(
    img => !selectedCategory || img.category === selectedCategory
  ) || [];

  const confidenceColor = {
    high: "#00ed95",
    medium: "#698eff",
    low: "#ff3a5d"
  };

  return (
    <main style={{ padding: "20px", maxWidth: "1600px", margin: "0 auto", fontFamily: "system-ui" }}>
      <TopBar profileName={profileName} onDocClick={() => {}} />

      <section style={{ marginTop: "40px" }}>
        <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>📦 Galerie Firmware OP-1</h1>
            <p style={{ color: "#666" }}>
              {loading ? "Chargement..." : `${manifest?.assetCount || 0} images • ${manifest?.categories.length || 0} catégories`}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => (window as any).navigateMaquette("firmware-compiler")}
              style={{
                padding: "10px 20px",
                background: "#698eff",
                color: "#fff",
                border: "2px solid #383572",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              ⚙️ Compiler
            </button>
            <button
              onClick={() => (window as any).navigateMaquette("outils")}
              style={{
                padding: "10px 20px",
                background: "#dfd9ff",
                border: "2px solid #383572",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              ← Retour
            </button>
          </div>
        </div>

        {notice && (
          <div style={{
            padding: "12px 15px",
            background: "#00ed95",
            border: "2px solid #383572",
            marginBottom: "20px",
            fontWeight: "bold"
          }}>
            {notice}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "20px" }}>
          {/* Left: Categories */}
          <div style={{ background: "#fff", border: "3px solid #383572", padding: "12px", height: "fit-content" }}>
            <strong style={{ display: "block", marginBottom: "12px" }}>🏷️ Catégories</strong>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {manifest?.categories.map(cat => {
                const count = manifest.assets.filter(a => a.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: "8px",
                      background: selectedCategory === cat ? "#00ed95" : "#dfd9ff",
                      color: selectedCategory === cat ? "#fff" : "#383572",
                      border: "2px solid #383572",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "12px",
                      textAlign: "left"
                    }}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Images Grid + Detail */}
          <div>
            {/* Gallery Grid */}
            <div style={{ background: "#fff", border: "3px solid #383572", padding: "12px", marginBottom: "15px" }}>
              <strong style={{ display: "block", marginBottom: "12px" }}>
                📷 Images ({filteredImages.length})
              </strong>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px" }}>
                {filteredImages.map((img, idx) => (
                  <button
                    key={`${img.category}-${img.file}`}
                    onClick={() => loadSVG(img)}
                    style={{
                      padding: "10px",
                      background: selectedImage?.file === img.file ? "#00ed95" : "#dfd9ff",
                      color: selectedImage?.file === img.file ? "#fff" : "#383572",
                      border: "2px solid #383572",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: "bold",
                      borderRadius: "0",
                      minHeight: "60px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center"
                    }}
                  >
                    <div>{img.file.replace(".svg", "")}</div>
                    <div style={{ fontSize: "10px", marginTop: "4px", opacity: 0.8 }}>
                      {img.viewBox}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Image Detail */}
            {selectedImage && (
              <div style={{ background: "#fff", border: "3px solid #383572", padding: "12px" }}>
                <div style={{ marginBottom: "12px" }}>
                  <h3>{selectedImage.file}</h3>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    <div>📐 viewBox: {selectedImage.viewBox}</div>
                    <div>📂 Catégorie: {selectedImage.category}</div>
                    <div>
                      🎯 Confiance:{" "}
                      <span
                        style={{
                          padding: "2px 6px",
                          background: confidenceColor[selectedImage.confidence],
                          color: "#383572",
                          borderRadius: "3px",
                          fontSize: "11px",
                          fontWeight: "bold"
                        }}
                      >
                        {selectedImage.confidence.toUpperCase()}
                      </span>
                    </div>
                    <div>💾 {(selectedImage.bytes / 1024).toFixed(1)} KB</div>
                    <div style={{ marginTop: "8px", fontSize: "11px", fontStyle: "italic", color: "#555" }}>
                      {selectedImage.note}
                    </div>
                  </div>
                </div>

                {/* Preview Canvas */}
                {svgCache.has(`display-extracted/${selectedImage.category}/${selectedImage.file}`) ? (
                  <PreviewCanvas
                    svgText={svgCache.get(`display-extracted/${selectedImage.category}/${selectedImage.file}`) || ""}
                    image={selectedImage}
                  />
                ) : (
                  <div style={{
                    padding: "20px",
                    background: "#dfd9ff",
                    border: "2px solid #ddd",
                    textAlign: "center",
                    color: "#666",
                    fontSize: "12px"
                  }}>
                    Cliquez pour charger preview
                  </div>
                )}

                {/* Animation Groups Editor */}
                {selectedImage?.groups && selectedImage.groups.length > 0 && (
                  <div style={{ marginTop: "12px", padding: "12px", background: "#dfd9ff", border: "2px solid #383572" }}>
                    <strong style={{ display: "block", marginBottom: "8px" }}>🎬 Groupes Animables ({selectedImage.groups.length})</strong>

                    {/* Frames */}
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ fontSize: "11px", fontWeight: "bold", display: "block", marginBottom: "6px" }}>
                        Frames ({animationFrames.length})
                      </label>
                      <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                        {animationFrames.map((frame, idx) => (
                          <button
                            key={frame.id}
                            onClick={() => setCurrentFrameIdx(idx)}
                            style={{
                              flex: 1,
                              padding: "4px",
                              background: currentFrameIdx === idx ? "#00ed95" : "#dfd9ff",
                              color: currentFrameIdx === idx ? "#fff" : "#383572",
                              border: "2px solid #383572",
                              cursor: "pointer",
                              fontSize: "10px",
                              fontWeight: "bold"
                            }}
                          >
                            {idx + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            const newFrame: AnimationFrame = {
                              id: `frame-${Date.now()}`,
                              visibleGroups: [...(animationFrames[currentFrameIdx]?.visibleGroups || [])],
                              duration: 200
                            };
                            setAnimationFrames([...animationFrames, newFrame]);
                          }}
                          style={{
                            padding: "4px 8px",
                            background: "#00ed95",
                            border: "2px solid #383572",
                            cursor: "pointer",
                            fontSize: "10px",
                            fontWeight: "bold"
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Group toggles */}
                    {animationFrames[currentFrameIdx] && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "150px", overflowY: "auto" }}>
                        {selectedImage.groups.map(groupId => (
                          <button
                            key={groupId}
                            onClick={() => {
                              const frame = animationFrames[currentFrameIdx];
                              const isVisible = frame.visibleGroups.includes(groupId);
                              const newVisibleGroups = isVisible
                                ? frame.visibleGroups.filter(g => g !== groupId)
                                : [...frame.visibleGroups, groupId];

                              const newFrames = [...animationFrames];
                              newFrames[currentFrameIdx] = {
                                ...frame,
                                visibleGroups: newVisibleGroups
                              };
                              setAnimationFrames(newFrames);
                            }}
                            style={{
                              padding: "4px 6px",
                              background: animationFrames[currentFrameIdx].visibleGroups.includes(groupId) ? "#00ed95" : "#ddd",
                              color: "#383572",
                              border: "1px solid #383572",
                              cursor: "pointer",
                              fontSize: "10px",
                              fontWeight: "bold",
                              textAlign: "left",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                            title={groupId}
                          >
                            {animationFrames[currentFrameIdx].visibleGroups.includes(groupId) ? "✓" : "○"} {groupId}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div style={{ marginTop: "12px", display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => (window as any).navigateMaquette("theme-project-editor")}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: "#698eff",
                      color: "#fff",
                      border: "2px solid #383572",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "11px"
                    }}
                  >
                    ✏️ Éditer Thème
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

// Preview component
function PreviewCanvas({ svgText, image }: { svgText: string; image: FirmwareImage }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear with transparent then white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image with proper blending
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
    img.onerror = () => {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#dfd9ff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#383572";
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Erreur chargement SVG", canvas.width / 2, canvas.height / 2);
      }
    };
    // Ensure SVG has transparent background
    const svgWithBg = svgText.replace(
      '<svg',
      '<svg style="background: white;"'
    );
    img.src = `data:image/svg+xml;base64,${btoa(svgWithBg)}`;
  }, [svgText]);

  const [w, h] = image.viewBox.split(" ").slice(2).map(Number);
  const scale = Math.min(400 / w, 200 / h);

  return (
    <div style={{ padding: "12px", background: "#dfd9ff", textAlign: "center" }}>
      <canvas
        ref={canvasRef}
        width={w}
        height={h}
        style={{
          width: `${w * scale}px`,
          height: `${h * scale}px`,
          imageRendering: "pixelated",
          border: "2px solid #383572"
        }}
      />
    </div>
  );
}
