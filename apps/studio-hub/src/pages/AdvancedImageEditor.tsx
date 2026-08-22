"use client";

import { useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";

type EditorMode = "pixel" | "svg";
type Tool = "pencil" | "brush" | "eraser" | "line" | "rect" | "circle" | "fill" | "picker" | "select";
type FilterType = "none" | "grayscale" | "invert" | "brightness" | "contrast" | "blur" | "sepia";

interface EditorState {
  canvas: HTMLCanvasElement | null;
  tool: Tool;
  color: string;
  brushSize: number;
  opacity: number;
  zoom: number;
  history: ImageData[];
  future: ImageData[];
  mode: EditorMode;
  filters: {
    grayscale: number;
    brightness: number;
    contrast: number;
    blur: number;
    sepia: number;
  };
}

const TOOLS: Tool[] = ["pencil", "brush", "eraser", "line", "rect", "circle", "fill", "picker", "select"];
const PALETTE = ["#010101", "#3b2d49", "#87839c", "#b4aecf", "#ff3a5d", "#00ed95", "#698eff", "#dfd9ff"];
const OP1_WIDTH = 320;
const OP1_HEIGHT = 160;

export default function AdvancedImageEditor() {
  const [profileName] = useState("NOUVEAU MEMBRE");
  const [notice, setNotice] = useState("Chargez une image pour commencer");

  // Canvas refs
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Editor state
  const [mode, setMode] = useState<EditorMode>("pixel");
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#00ed95");
  const [brushSize, setBrushSize] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [zoom, setZoom] = useState(2);

  // Image state
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [future, setFuture] = useState<ImageData[]>([]);

  // Filters
  const [filters, setFilters] = useState({
    grayscale: 0,
    brightness: 0,
    contrast: 0,
    blur: 0,
    sepia: 0,
  });

  // Drawing state
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<[number, number] | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OP1_WIDTH, OP1_HEIGHT);
  }, []);

  // Render with filters
  function renderWithFilters() {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Apply filters via CSS filter property or canvas filters
    canvas.style.filter = [
      filters.grayscale > 0 ? `grayscale(${filters.grayscale}%)` : "",
      filters.brightness !== 0 ? `brightness(${100 + filters.brightness}%)` : "",
      filters.contrast !== 0 ? `contrast(${100 + filters.contrast}%)` : "",
      filters.blur > 0 ? `blur(${filters.blur}px)` : "",
      filters.sepia > 0 ? `sepia(${filters.sepia}%)` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  // Load image from firmware
  async function loadImage(category: string, filename: string) {
    try {
      setNotice(`⏳ Chargement ${filename}...`);

      const res = await fetch(`/firmware-original/${category}/${filename}`);
      if (!res.ok) throw new Error("Image not found");

      const svgText = await res.text();
      setSvgContent(svgText);

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

        setNotice(`✅ ${filename} chargée`);
        setHistory([]);
        setFuture([]);
      };

      img.src = `data:image/svg+xml;base64,${btoa(svgText)}`;
    } catch (e: any) {
      setNotice(`❌ Erreur: ${e.message}`);
    }
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

    setFuture(f => [
      ...f.slice(-39),
      ctx.getImageData(0, 0, OP1_WIDTH, OP1_HEIGHT),
    ]);
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

    setHistory(h => [
      ...h.slice(-39),
      ctx.getImageData(0, 0, OP1_WIDTH, OP1_HEIGHT),
    ]);
    const next = future[future.length - 1];
    ctx.putImageData(next, 0, 0);
    setFuture(f => f.slice(0, -1));
  }

  // Pointer handlers
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

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }

  // Export
  function exportImage() {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `image-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice("✅ Image exportée en PNG");
    }, "image/png");
  }

  function clear() {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    saveState();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OP1_WIDTH, OP1_HEIGHT);
  }

  return (
    <main style={{ padding: "20px", maxWidth: "1800px", margin: "0 auto", fontFamily: "system-ui" }}>
      <TopBar activePage="outils" profileName={profileName} onDocClick={() => {}} />

      <section style={{ marginTop: "40px" }}>
        <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between" }}>
          <div>
            <h1>🖼️ Éditeur Image Avancé</h1>
            <p style={{ color: "#666" }}>Édition complète avec outils professionnels et filtres</p>
          </div>
          <button
            onClick={() => (window as any).navigateMaquette("firmware-lab")}
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px" }}>
          {/* Main editor */}
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
                  onClick={() => setTool(t)}
                  style={{
                    padding: "8px 12px",
                    background: tool === t ? "#00ed95" : "#dfd9ff",
                    color: tool === t ? "#383572" : "#111",
                    border: "2px solid #383572",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                  title={t}
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
                    : t === "picker"
                    ? "🎨"
                    : "🔲"}
                </button>
              ))}
              <select
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                style={{ padding: "5px", border: "2px solid #383572" }}
              >
                {[1, 2, 4, 8, 16].map(z => (
                  <option key={z} value={z}>
                    {z}×
                  </option>
                ))}
              </select>
              <button
                onClick={undo}
                disabled={!history.length}
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
                onClick={redo}
                disabled={!future.length}
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
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
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

          {/* Right panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Color */}
            <div style={{ background: "#fff", border: "3px solid #383572", padding: "12px" }}>
              <strong style={{ display: "block", marginBottom: "8px" }}>🎨 Couleur</strong>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
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
                    onClick={() => setColor(c)}
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
                onChange={e => setBrushSize(Number(e.target.value))}
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
                onChange={e => setOpacity(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            {/* Filters */}
            <div style={{ background: "#fff", border: "3px solid #383572", padding: "12px" }}>
              <strong style={{ display: "block", marginBottom: "8px" }}>🎬 Filtres</strong>
              {Object.entries(filters).map(([key, value]) => (
                <div key={key} style={{ marginBottom: "8px" }}>
                  <label style={{ fontSize: "11px", display: "block" }}>
                    <strong>{key}: {value}</strong>
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={value}
                    onChange={e => {
                      setFilters({ ...filters, [key]: Number(e.target.value) });
                      renderWithFilters();
                    }}
                    style={{ width: "100%", fontSize: "11px" }}
                  />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <button
                onClick={exportImage}
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
                ⬇️ Exporter PNG
              </button>
              <button
                onClick={clear}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#ff3a5d",
                  color: "#fff",
                  border: "2px solid #383572",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "11px",
                }}
              >
                🗑️ Effacer
              </button>
            </div>

            {/* Load quick images */}
            <div style={{ background: "#fff", border: "3px solid #383572", padding: "12px" }}>
              <strong style={{ display: "block", marginBottom: "8px" }}>📂 Charger</strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <button
                  onClick={() => loadImage("tape", "tape.svg")}
                  style={{
                    width: "100%",
                    padding: "6px",
                    background: "#dfd9ff",
                    border: "2px solid #383572",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  Tape
                </button>
                <button
                  onClick={() => loadImage("modes_principaux", "playmode.svg")}
                  style={{
                    width: "100%",
                    padding: "6px",
                    background: "#dfd9ff",
                    border: "2px solid #383572",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  PlayMode
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
