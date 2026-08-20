import { createLogger } from "@studio-hub/audio-bridge";
const log = createLogger("ThemeEditor");
"use client";

import { useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";

type ProjectImage = {
  filename: string;
  category: string;
  originalSvg: string;
  modifiedSvg: string;
  isModified: boolean;
  pixelData?: ImageData;
};

type ThemeProject = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  modifiedAt: string;
  images: Map<string, ProjectImage>;
};

type EditorMode = "gallery" | "edit-pixel" | "edit-svg";
type Tool = "pencil" | "brush" | "eraser" | "line" | "rect" | "circle" | "fill" | "picker";

const TOOLS: Tool[] = ["pencil", "brush", "eraser", "line", "rect", "circle", "fill", "picker"];
const PALETTE = ["#010101", "#3b2d49", "#87839c", "#b4aecf", "#ff3a5d", "#00ed95", "#698eff", "#dfd9ff"];
const OP1_WIDTH = 320;
const OP1_HEIGHT = 160;

export default function ThemeProjectEditor() {
  const [profileName] = useState("INVITÉ");
  const [notice, setNotice] = useState("Créez ou ouvrez un projet thème");

  // Project state
  const [projects, setProjects] = useState<ThemeProject[]>([]);
  const [currentProject, setCurrentProject] = useState<ThemeProject | null>(null);
  const [mode, setMode] = useState<EditorMode>("gallery");

  // Editor state
  const [selectedImage, setSelectedImage] = useState<ProjectImage | null>(null);
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#00ed95");
  const [brushSize, setBrushSize] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [zoom, setZoom] = useState(2);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [future, setFuture] = useState<ImageData[]>([]);
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [animationCollapsed, setAnimationCollapsed] = useState(false);

  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<[number, number] | null>(null);

  // Load projects from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("op1-theme-projects");
      if (saved) {
        const parsed = JSON.parse(saved);
        setProjects(parsed);
      }
    } catch (e) {
      log.error("Failed to load projects");
    }
  }, []);

  // Animation loop
  useEffect(() => {
    if (!animationPlaying || !selectedImage || !animationCanvasRef.current) return;

    let frame = 0;
    const interval = setInterval(() => {
      const canvas = animationCanvasRef.current;
      if (!canvas) return;

      // Redraw current frame from main canvas
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const mainCanvas = mainCanvasRef.current;
      if (!mainCanvas) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OP1_WIDTH, OP1_HEIGHT);
      ctx.drawImage(mainCanvas, 0, 0, OP1_WIDTH, OP1_HEIGHT);

      frame = (frame + 1) % 6; // Loop every 6 frames
    }, 200);

    return () => clearInterval(interval);
  }, [animationPlaying, selectedImage]);

  // Create new project
  async function createProject(name: string) {
    try {
      setNotice("⏳ Chargement du firmware...");

      // Load all firmware images
      const manifestRes = await fetch("/firmware-original/manifest.json");
      if (!manifestRes.ok) throw new Error("Manifeste introuvable");
      const manifest = await manifestRes.json();

      const imageMap = new Map<string, ProjectImage>();
      let loaded = 0;

      for (const asset of manifest.assets) {
        try {
          const res = await fetch(`/firmware-original/${asset.category}/${asset.file}`);
          if (!res.ok) continue;

          const svgText = await res.text();
          const key = `${asset.category}/${asset.file}`;

          imageMap.set(key, {
            filename: asset.file,
            category: asset.category,
            originalSvg: svgText,
            modifiedSvg: svgText,
            isModified: false,
          });

          loaded++;
        } catch (e) {
          log.error(`Failed to load ${asset.file}`);
        }
      }

      const newProject: ThemeProject = {
        id: `project-${Date.now()}`,
        name,
        description: "Projet thème personnalisé",
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        images: imageMap,
      };

      const updated = [...projects, newProject];
      localStorage.setItem("op1-theme-projects", JSON.stringify(updated));
      setProjects(updated);
      setCurrentProject(newProject);
      setNotice(`✅ Projet "${name}" créé (${loaded} images)`);
      setMode("gallery");
    } catch (e: any) {
      setNotice(`❌ Erreur: ${e.message}`);
    }
  }

  // Open project
  function openProject(project: ThemeProject) {
    setCurrentProject(project);
    setMode("gallery");
    setNotice(`✅ Projet "${project.name}" ouvert`);
  }

  // Save project
  function saveProject() {
    if (!currentProject) return;

    try {
      const updated = projects.map(p =>
        p.id === currentProject.id
          ? { ...currentProject, modifiedAt: new Date().toISOString() }
          : p
      );
      localStorage.setItem("op1-theme-projects", JSON.stringify(updated));
      setProjects(updated);
      setNotice(`✅ Projet sauvegardé`);
    } catch (e: any) {
      setNotice(`❌ Erreur: ${e.message}`);
    }
  }

  // Delete project
  function deleteProject(projectId: string) {
    const updated = projects.filter(p => p.id !== projectId);
    localStorage.setItem("op1-theme-projects", JSON.stringify(updated));
    setProjects(updated);
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
      setMode("gallery");
    }
    setNotice("✅ Projet supprimé");
  }

  // Open image for editing
  async function editImage(projectImage: ProjectImage) {
    setSelectedImage(projectImage);
    setMode("edit-pixel");
    setHistory([]);
    setFuture([]);

    // Render SVG to canvas
    const img = new Image();
    img.onload = () => {
      const canvas = mainCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OP1_WIDTH, OP1_HEIGHT);
      ctx.drawImage(img, 0, 0, OP1_WIDTH, OP1_HEIGHT);
    };

    const svgWithBg = projectImage.modifiedSvg.replace(
      "<svg",
      '<svg style="background: white;"'
    );
    img.src = `data:image/svg+xml;base64,${btoa(svgWithBg)}`;
  }

  // Save image changes back to project
  function saveImageChanges() {
    if (!currentProject || !selectedImage) return;

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Get pixel data as PNG and store
    const imageData = ctx.getImageData(0, 0, OP1_WIDTH, OP1_HEIGHT);

    const key = `${selectedImage.category}/${selectedImage.filename}`;
    const updated = new Map(currentProject.images);
    updated.set(key, {
      ...selectedImage,
      isModified: true,
      pixelData: imageData,
    });

    const newProject = { ...currentProject, images: updated };
    setCurrentProject(newProject);

    // Update in projects array
    const projectsUpdated = projects.map(p =>
      p.id === currentProject.id ? newProject : p
    );
    localStorage.setItem("op1-theme-projects", JSON.stringify(projectsUpdated));
    setProjects(projectsUpdated);

    setNotice(`✅ ${selectedImage.filename} sauvegardé`);
  }

  // Drawing functions
  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>): [number, number] | null {
    const canvas = mainCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return [
      Math.max(
        0,
        Math.min(
          OP1_WIDTH - 1,
          Math.floor(((e.clientX - rect.left) / rect.width) * OP1_WIDTH)
        )
      ),
      Math.max(
        0,
        Math.min(
          OP1_HEIGHT - 1,
          Math.floor(((e.clientY - rect.top) / rect.height) * OP1_HEIGHT)
        )
      ),
    ];
  }

  function saveState() {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    setHistory(h => [...h.slice(-39), ctx.getImageData(0, 0, OP1_WIDTH, OP1_HEIGHT)]);
    setFuture([]);
  }

  function undo() {
    if (history.length === 0) return;
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setFuture(f => [...f.slice(-39), ctx.getImageData(0, 0, OP1_WIDTH, OP1_HEIGHT)]);
    const prev = history[history.length - 1];
    ctx.putImageData(prev, 0, 0);
    setHistory(h => h.slice(0, -1));
  }

  function redo() {
    if (future.length === 0) return;
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setHistory(h => [...h.slice(-39), ctx.getImageData(0, 0, OP1_WIDTH, OP1_HEIGHT)]);
    const next = future[future.length - 1];
    ctx.putImageData(next, 0, 0);
    setFuture(f => f.slice(0, -1));
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const point = pointFromEvent(e);
    if (!point) return;

    isDrawingRef.current = true;
    lastPointRef.current = point;

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    saveState();

    if (tool === "pencil" || tool === "brush") {
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(point[0], point[1], brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (tool === "picker") {
      const imageData = ctx.getImageData(point[0], point[1], 1, 1);
      const [r, g, b] = imageData.data;
      setColor(`#${[r, g, b].map(x => x.toString(16).padStart(2, "0")).join("")}`);
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const point = pointFromEvent(e);
    if (!point || !lastPointRef.current) return;

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (tool === "pencil" || tool === "brush") {
      ctx.strokeStyle = color;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current[0], lastPointRef.current[1]);
      ctx.lineTo(point[0], point[1]);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    lastPointRef.current = point;
  }

  function handlePointerUp() {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }

  // GALLERY MODE
  if (!currentProject) {
    return (
      <main style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "system-ui" }}>
        <TopBar profileName={profileName} onDocClick={() => {}} />

        <section style={{ marginTop: "40px" }}>
          <h1>📁 Projets Thème</h1>
          <p style={{ color: "#666" }}>Créer et gérer des thèmes firmware</p>

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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", marginTop: "20px" }}>
            {/* Existing projects */}
            <div style={{ background: "#fff", border: "3px solid #383572", padding: "15px" }}>
              <strong style={{ display: "block", marginBottom: "12px" }}>Vos Projets ({projects.length})</strong>
              {projects.length === 0 ? (
                <div style={{ color: "#666" }}>Aucun projet. Créez un nouveau projet pour commencer!</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {projects.map(project => (
                    <div
                      key={project.id}
                      style={{
                        padding: "12px",
                        background: "#dfd9ff",
                        border: "2px solid #383572",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "bold" }}>{project.name}</div>
                        <div style={{ fontSize: "11px", color: "#666" }}>
                          {project.images.size} images • Modifiées:{" "}
                          {Array.from(project.images.values()).filter(i => i.isModified).length}
                        </div>
                      </div>
                      <button
                        onClick={() => openProject(project)}
                        style={{
                          padding: "6px 12px",
                          background: "#00ed95",
                          border: "2px solid #383572",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "11px",
                        }}
                      >
                        Ouvrir
                      </button>
                      <button
                        onClick={() => deleteProject(project.id)}
                        style={{
                          padding: "6px 12px",
                          background: "#ff3a5d",
                          color: "#fff",
                          border: "2px solid #383572",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "11px",
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create new */}
            <div style={{ background: "#fff", border: "3px solid #383572", padding: "15px" }}>
              <strong style={{ display: "block", marginBottom: "8px" }}>➕ Nouveau Projet</strong>
              <CreateProjectForm onCreate={createProject} />
              <button
                onClick={() => (window as any).navigateMaquette("firmware-gallery")}
                style={{
                  width: "100%",
                  marginTop: "12px",
                  padding: "8px",
                  background: "#dfd9ff",
                  border: "2px solid #383572",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "11px",
                }}
              >
                ← Retour
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // GALLERY/EDIT MODE
  return (
    <main style={{ padding: "20px", maxWidth: "1800px", margin: "0 auto", fontFamily: "system-ui" }}>
      <TopBar profileName={profileName} onDocClick={() => {}} />

      <section style={{ marginTop: "40px" }}>
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>
              {mode === "gallery"
                ? `📷 ${currentProject.name} — ${currentProject.images.size} images`
                : `✏️ Édition: ${selectedImage?.filename}`}
            </h1>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {mode !== "gallery" && (
              <button
                onClick={() => {
                  saveImageChanges();
                  setMode("gallery");
                }}
                style={{
                  padding: "8px 12px",
                  background: "#00ed95",
                  border: "2px solid #383572",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✓ Valider & Retour
              </button>
            )}
            <button
              onClick={saveProject}
              style={{
                padding: "8px 12px",
                background: "#698eff",
                color: "#fff",
                border: "2px solid #383572",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              💾 Sauvegarder
            </button>
            <button
              onClick={() => {
                setCurrentProject(null);
                setMode("gallery");
              }}
              style={{
                padding: "8px 12px",
                background: "#dfd9ff",
                border: "2px solid #383572",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ← Projets
            </button>
          </div>
        </div>

        {notice && (
          <div
            style={{
              padding: "12px 15px",
              background: mode === "gallery" ? "#00ed95" : "#698eff",
              color: mode === "gallery" ? "#383572" : "#fff",
              border: "2px solid #383572",
              marginBottom: "20px",
              fontWeight: "bold",
            }}
          >
            {notice}
          </div>
        )}

        {mode === "gallery" ? (
          <GalleryView
            images={Array.from(currentProject.images.values())}
            onEditImage={editImage}
          />
        ) : (
          <EditorView
            image={selectedImage}
            tool={tool}
            color={color}
            brushSize={brushSize}
            opacity={opacity}
            zoom={zoom}
            mainCanvasRef={mainCanvasRef}
            animationCanvasRef={animationCanvasRef}
            animationPlaying={animationPlaying}
            animationCollapsed={animationCollapsed}
            canUndo={history.length > 0}
            canRedo={future.length > 0}
            onToolChange={setTool}
            onColorChange={setColor}
            onBrushSizeChange={setBrushSize}
            onOpacityChange={setOpacity}
            onZoomChange={setZoom}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onUndo={undo}
            onRedo={redo}
            onAnimationToggle={() => setAnimationPlaying(!animationPlaying)}
            onAnimationCollapse={() => setAnimationCollapsed(!animationCollapsed)}
          />
        )}
      </section>
    </main>
  );
}

// GALLERY VIEW
function GalleryView({
  images,
  onEditImage,
}: {
  images: ProjectImage[];
  onEditImage: (img: ProjectImage) => void;
}) {
  const [filter, setFilter] = useState("");
  const filtered = images.filter(
    img =>
      img.filename.toLowerCase().includes(filter.toLowerCase()) ||
      img.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="Filtrer images..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            border: "2px solid #383572",
            fontSize: "12px",
          }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
        {filtered.map(img => (
          <button
            key={`${img.category}/${img.filename}`}
            onClick={() => onEditImage(img)}
            style={{
              padding: "12px",
              background: img.isModified ? "#00ed95" : "#dfd9ff",
              border: "2px solid #383572",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: "bold",
              textAlign: "left",
              minHeight: "100px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "12px" }}>{img.filename}</div>
              <div style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}>
                {img.category}
              </div>
            </div>
            <div style={{ fontSize: "9px", marginTop: "8px" }}>
              {img.isModified ? "✏️ Modifié" : "—"}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// EDITOR VIEW
function EditorView({
  image,
  tool,
  color,
  brushSize,
  opacity,
  zoom,
  mainCanvasRef,
  animationCanvasRef,
  animationPlaying,
  animationCollapsed,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onBrushSizeChange,
  onOpacityChange,
  onZoomChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onUndo,
  onRedo,
  onAnimationToggle,
  onAnimationCollapse,
}: {
  image: ProjectImage | null;
  tool: Tool;
  color: string;
  brushSize: number;
  opacity: number;
  zoom: number;
  mainCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  animationCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  animationPlaying: boolean;
  animationCollapsed: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: Tool) => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onOpacityChange: (opacity: number) => void;
  onZoomChange: (zoom: number) => void;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onAnimationToggle: () => void;
  onAnimationCollapse: () => void;
}) {
  if (!image) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>
      {/* Canvas */}
      <div>
        {/* Toolbar */}
        <div
          style={{
            background: "#fff",
            border: "3px solid #383572",
            padding: "12px",
            marginBottom: "15px",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {TOOLS.map(t => (
            <button
              key={t}
              onClick={() => onToolChange(t)}
              style={{
                padding: "8px 12px",
                background: tool === t ? "#00ed95" : "#dfd9ff",
                color: tool === t ? "#383572" : "#111",
                border: "2px solid #383572",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "12px",
              }}
            >
              {t === "pencil"
                ? "✏️"
                : t === "brush"
                ? "🖌️"
                : t === "eraser"
                ? "🗑️"
                : t === "line"
                ? "📏"
                : t === "rect"
                ? "▭"
                : t === "circle"
                ? "●"
                : t === "fill"
                ? "🪣"
                : "🎨"}
            </button>
          ))}
          <select
            value={zoom}
            onChange={e => onZoomChange(Number(e.target.value))}
            style={{ padding: "5px", border: "2px solid #383572" }}
          >
            {[1, 2, 4, 8, 16].map(z => (
              <option key={z} value={z}>
                {z}×
              </option>
            ))}
          </select>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            style={{
              padding: "5px 10px",
              background: "#dfd9ff",
              border: "2px solid #383572",
              cursor: "pointer",
            }}
          >
            ↶
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            style={{
              padding: "5px 10px",
              background: "#dfd9ff",
              border: "2px solid #383572",
              cursor: "pointer",
            }}
          >
            ↷
          </button>
        </div>

        {/* Canvas */}
        <div style={{ background: "#fff", border: "3px solid #383572", padding: "20px", textAlign: "center" }}>
          <canvas
            ref={mainCanvasRef}
            width={OP1_WIDTH}
            height={OP1_HEIGHT}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
              width: `${OP1_WIDTH * zoom}px`,
              height: `${OP1_HEIGHT * zoom}px`,
              imageRendering: "pixelated",
              border: "2px solid #383572",
              background: "#fff",
              cursor: "crosshair",
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Color */}
        <div style={{ background: "#fff", border: "3px solid #383572", padding: "12px" }}>
          <strong style={{ display: "block", marginBottom: "8px" }}>🎨 Couleur</strong>
          <input
            type="color"
            value={color}
            onChange={e => onColorChange(e.target.value)}
            style={{
              width: "100%",
              height: "50px",
              border: "2px solid #383572",
              cursor: "pointer",
            }}
          />
          <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "4px" }}>
            {PALETTE.map(c => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                style={{
                  width: "100%",
                  height: "30px",
                  background: c,
                  border: color === c ? "3px solid #00ed95" : "2px solid #383572",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>

        {/* Brush */}
        <div style={{ background: "#fff", border: "3px solid #383572", padding: "12px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            <strong>Taille: {brushSize}px</strong>
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={e => onBrushSizeChange(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <label style={{ display: "block", marginTop: "12px", marginBottom: "8px" }}>
            <strong>Opacité: {Math.round(opacity * 100)}%</strong>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity}
            onChange={e => onOpacityChange(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        {/* Animation Preview */}
        {!animationCollapsed && (
          <div style={{ background: "#fff", border: "3px solid #383572", padding: "12px", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong>🎬 Aperçu</strong>
              <button
                onClick={onAnimationCollapse}
                style={{
                  padding: "2px 6px",
                  background: "#dfd9ff",
                  border: "1px solid #383572",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
              >
                -
              </button>
            </div>
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <canvas
                ref={animationCanvasRef}
                width={OP1_WIDTH}
                height={OP1_HEIGHT}
                style={{
                  width: "100px",
                  height: "50px",
                  imageRendering: "pixelated",
                  border: "2px solid #383572",
                  background: "#fff",
                }}
              />
            </div>
            <button
              onClick={onAnimationToggle}
              style={{
                width: "100%",
                padding: "8px",
                background: animationPlaying ? "#ff3a5d" : "#00ed95",
                color: animationPlaying ? "#fff" : "#383572",
                border: "2px solid #383572",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "12px",
              }}
            >
              {animationPlaying ? "⏹️ Stop" : "▶️ Play"}
            </button>
          </div>
        )}

        {animationCollapsed && (
          <button
            onClick={onAnimationCollapse}
            style={{
              width: "100%",
              padding: "8px",
              background: "#dfd9ff",
              border: "3px solid #383572",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "11px",
            }}
          >
            + Aperçu
          </button>
        )}
      </div>
    </div>
  );
}

// CREATE PROJECT FORM
function CreateProjectForm({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState("Mon Thème");

  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nom du thème..."
        style={{
          width: "100%",
          padding: "8px",
          border: "2px solid #383572",
          marginBottom: "8px",
          boxSizing: "border-box",
          fontWeight: "bold",
        }}
      />
      <button
        onClick={() => onCreate(name)}
        style={{
          width: "100%",
          padding: "8px",
          background: "#00ed95",
          border: "2px solid #383572",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "11px",
        }}
      >
        ➕ Créer Projet
      </button>
    </div>
  );
}
