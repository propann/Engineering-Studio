"use client";

import { useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";

type Tool = "pencil" | "brush" | "eraser" | "fill" | "picker";

const OP1_COLORS = {
  dark: "#383572",
  light: "#dfd9ff",
  green: "#00ed95",
  blue: "#698eff",
  red: "#ff3a5d",
};

const PALETTE = ["#010101", "#3b2d49", "#87839c", "#b4aecf", "#ff3a5d", "#00ed95", "#698eff", "#dfd9ff"];
const OP1_WIDTH = 320;
const OP1_HEIGHT = 160;

export default function ImageEditorOP1() {
  const [profileName] = useState("AZOTH");
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<[number, number] | null>(null);

  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState(OP1_COLORS.green);
  const [brushSize, setBrushSize] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [zoom, setZoom] = useState(4);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [future, setFuture] = useState<ImageData[]>([]);
  const [animationOpen, setAnimationOpen] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OP1_WIDTH, OP1_HEIGHT);
  }, []);

  // Draw grid
  useEffect(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= OP1_WIDTH; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, OP1_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= OP1_HEIGHT; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(OP1_WIDTH, y);
      ctx.stroke();
    }
  }, []);

  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>): [number, number] | null {
    const canvas = mainCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return [
      Math.max(0, Math.min(OP1_WIDTH - 1, Math.floor(((e.clientX - rect.left) / rect.width) * OP1_WIDTH))),
      Math.max(0, Math.min(OP1_HEIGHT - 1, Math.floor(((e.clientY - rect.top) / rect.height) * OP1_HEIGHT))),
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

  function clear() {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    saveState();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OP1_WIDTH, OP1_HEIGHT);
  }

  function exportPNG() {
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
    }, "image/png");
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopBar profileName={profileName} onDocClick={() => {}} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: animationOpen ? "200px 1fr 200px" : "1fr 200px",
          flex: 1,
          gap: 0,
          overflow: "hidden",
          transition: "grid-template-columns 0.3s ease",
          position: "relative",
        }}
      >
        {/* Animation Panel Left */}
        {animationOpen && (
          <div style={{ background: "#fff", border: `3px solid ${OP1_COLORS.dark}`, borderLeft: "none", padding: "12px", overflow: "auto" }}>
            <div style={{ fontWeight: "bold", marginBottom: "12px" }}>🎬 Animation</div>
            <button style={{ width: "100%", padding: "8px", background: OP1_COLORS.green, border: `2px solid ${OP1_COLORS.dark}`, cursor: "pointer", fontWeight: "bold" }}>
              ▶ Play
            </button>
          </div>
        )}

        {/* Canvas Area */}
        <div style={{ display: "flex", flexDirection: "column", padding: "10px", gap: "10px", overflow: "hidden" }}>
          <div style={{ display: "flex", gap: "6px", background: OP1_COLORS.light, border: `2px solid ${OP1_COLORS.dark}`, padding: "8px" }}>
            {(["pencil", "brush", "eraser", "fill", "picker"] as const).map(t => (
              <button key={t} onClick={() => setTool(t)} style={{ padding: "6px 10px", background: tool === t ? OP1_COLORS.green : "#fff", border: `2px solid ${OP1_COLORS.dark}`, cursor: "pointer", fontWeight: "bold" }}>
                {t === "pencil" ? "✏️" : t === "brush" ? "🖌️" : t === "eraser" ? "🗑️" : t === "fill" ? "🪣" : "🎨"}
              </button>
            ))}
            <select value={zoom} onChange={e => setZoom(Number(e.target.value))} style={{ padding: "5px 8px", border: `2px solid ${OP1_COLORS.dark}`, fontWeight: "bold" }}>
              {[1, 2, 4, 8, 16].map(z => <option key={z} value={z}>{z}×</option>)}
            </select>
            <button onClick={undo} disabled={!history.length} style={{ padding: "6px 10px", background: OP1_COLORS.light, border: `2px solid ${OP1_COLORS.dark}`, cursor: "pointer" }}>↶</button>
            <button onClick={redo} disabled={!future.length} style={{ padding: "6px 10px", background: OP1_COLORS.light, border: `2px solid ${OP1_COLORS.dark}`, cursor: "pointer" }}>↷</button>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: `2px solid ${OP1_COLORS.dark}`, overflow: "auto", position: "relative" }}>
            <div style={{ position: "relative", width: `${OP1_WIDTH * zoom}px`, height: `${OP1_HEIGHT * zoom}px` }}>
              <canvas ref={mainCanvasRef} width={OP1_WIDTH} height={OP1_HEIGHT} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} style={{ position: "absolute", width: `${OP1_WIDTH * zoom}px`, height: `${OP1_HEIGHT * zoom}px`, imageRendering: "pixelated", border: `1px solid ${OP1_COLORS.dark}`, cursor: "crosshair", top: 0, left: 0 }} />
              <canvas ref={gridCanvasRef} width={OP1_WIDTH} height={OP1_HEIGHT} style={{ position: "absolute", width: `${OP1_WIDTH * zoom}px`, height: `${OP1_HEIGHT * zoom}px`, imageRendering: "pixelated", pointerEvents: "none", top: 0, left: 0 }} />

              <button onClick={() => setAnimationOpen(!animationOpen)} onMouseEnter={() => setButtonHovered(true)} onMouseLeave={() => setButtonHovered(false)} style={{ position: "absolute", left: animationOpen ? "-20px" : "-35px", top: "50%", transform: "translateY(-50%)", width: "50px", height: "50px", borderRadius: "50%", background: OP1_COLORS.green, color: OP1_COLORS.dark, border: `3px solid ${OP1_COLORS.dark}`, cursor: "pointer", fontWeight: "bold", fontSize: "20px", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", transition: "all 0.3s ease", opacity: buttonHovered || animationOpen ? 1 : 0.3 }}>
                {animationOpen ? "←" : "🎬"}
              </button>
            </div>
          </div>
        </div>

        {/* Control Panel Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "10px", overflow: "auto", background: OP1_COLORS.light }}>
          <div style={{ background: "#fff", border: `3px solid ${OP1_COLORS.dark}`, padding: "12px" }}>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: "100%", height: "50px", border: `2px solid ${OP1_COLORS.dark}`, cursor: "pointer" }} />
            <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "4px" }}>
              {PALETTE.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ height: "30px", background: c, border: color === c ? `2px solid ${OP1_COLORS.green}` : `1px solid ${OP1_COLORS.dark}`, cursor: "pointer" }} />
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", border: `3px solid ${OP1_COLORS.dark}`, padding: "12px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "11px" }}>Taille: {brushSize}px</label>
            <input type="range" min="1" max="20" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} style={{ width: "100%" }} />
            <label style={{ display: "block", marginTop: "12px", marginBottom: "8px", fontWeight: "bold", fontSize: "11px" }}>Opacité: {Math.round(opacity * 100)}%</label>
            <input type="range" min="0" max="1" step="0.1" value={opacity} onChange={e => setOpacity(Number(e.target.value))} style={{ width: "100%" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button onClick={exportPNG} style={{ width: "100%", padding: "8px", background: OP1_COLORS.green, border: `2px solid ${OP1_COLORS.dark}`, cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>⬇️ PNG</button>
            <button onClick={clear} style={{ width: "100%", padding: "8px", background: OP1_COLORS.red, color: "#fff", border: `2px solid ${OP1_COLORS.dark}`, cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>🗑️ Clear</button>
          </div>
        </div>
      </div>
    </div>
  );
}
