"use client";

import { useEffect, useRef, useState } from "react";

type Pixel = string | null;
type Tool = "pencil" | "eraser" | "fill" | "picker" | "line" | "rect";

const MACHINE_PALETTE = ["#010101", "#3b2d49", "#87839c", "#b4aecf", "#ff3a5d", "#00ed95", "#698eff", "#dfd9ff"];
const MAX_PIXELS = 320 * 160;

function blankPixels(width: number, height: number): Pixel[] {
  return Array.from({ length: width * height }, () => null);
}

function safeSvgSource(svg: string): string {
  if (!svg.includes("<svg")) return "";
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/<image\b[^>]*>/gi, "")
    .replace(/\s(?:href|xlink:href)\s*=\s*(["'])https?:[\s\S]*?\1/gi, "");
}

function hexFromRgba(red: number, green: number, blue: number, alpha: number): string | null {
  if (alpha < 16) return null;
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function pixelIndex(x: number, y: number, width: number) { return (y * width) + x; }

function pixelsToSvg(pixels: Pixel[], width: number, height: number) {
  const rects = pixels.flatMap((pixel, index) => {
    if (!pixel) return [];
    return [`<rect x="${index % width}" y="${Math.floor(index / width)}" width="1" height="1" fill="${pixel}"/>`];
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}px" height="${height}px"><g shape-rendering="crispEdges">${rects.join("")}</g></svg>`;
}

function examplePixels(kind: "sunset" | "wave" | "tape", width: number, height: number): Pixel[] {
  const next = blankPixels(width, height);
  const put = (x: number, y: number, pixel: string) => { if (x >= 0 && x < width && y >= 0 && y < height) next[pixelIndex(x, y, width)] = pixel; };
  if (kind === "sunset") {
    for (let y = 30; y < 122; y += 1) for (let x = 28; x < 292; x += 1) put(x, y, y < 62 ? "#3b2d49" : y < 94 ? "#87839c" : "#ff3a5d");
    for (let x = 38; x < 285; x += 1) put(x, 119 - Math.floor(Math.abs(x - 160) / 16), "#dfd9ff");
    for (let y = 95; y < 122; y += 1) for (let x = 118; x < 202; x += 1) put(x, y, "#010101");
    for (let x = 125; x < 196; x += 1) put(x, 96, "#00ed95");
  } else if (kind === "wave") {
    for (let x = 18; x < 302; x += 1) { const y = Math.round(80 + Math.sin(x / 13) * 30); put(x, y, "#00ed95"); put(x, y + 1, "#00ed95"); }
    for (let x = 18; x < 302; x += 16) for (let y = 18; y < 143; y += 16) put(x, y, "#3b2d49");
    for (let x = 18; x < 302; x += 1) { put(x, 18, "#698eff"); put(x, 142, "#698eff"); }
  } else {
    for (let y = 43; y < 117; y += 1) for (let x = 58; x < 262; x += 1) put(x, y, "#3b2d49");
    for (let x = 68; x < 252; x += 1) { put(x, 52, "#dfd9ff"); put(x, 108, "#dfd9ff"); }
    for (let y = 52; y <= 108; y += 1) { put(68, y, "#dfd9ff"); put(251, y, "#dfd9ff"); }
    for (let x = 86; x < 235; x += 1) { put(x, 80, "#ff3a5d"); if (x % 8 < 4) put(x, 81, "#ff3a5d"); }
    for (let x = 92; x < 230; x += 22) for (let y = 63; y < 99; y += 12) put(x, y, "#00ed95");
  }
  return next;
}

function linePixels(x0: number, y0: number, x1: number, y1: number): Array<[number, number]> {
  const pixels: Array<[number, number]> = [];
  let x = x0; let y = y0;
  const dx = Math.abs(x1 - x0); const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0); const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  while (true) {
    pixels.push([x, y]);
    if (x === x1 && y === y1) break;
    const twice = 2 * error;
    if (twice >= dy) { error += dy; x += sx; }
    if (twice <= dx) { error += dx; y += sy; }
  }
  return pixels;
}

function shapePixels(tool: "line" | "rect", start: [number, number], end: [number, number]): Array<[number, number]> {
  if (tool === "line") return linePixels(start[0], start[1], end[0], end[1]);
  const left = Math.min(start[0], end[0]); const right = Math.max(start[0], end[0]);
  const top = Math.min(start[1], end[1]); const bottom = Math.max(start[1], end[1]);
  const pixels: Array<[number, number]> = [];
  for (let x = left; x <= right; x += 1) { pixels.push([x, top]); pixels.push([x, bottom]); }
  for (let y = top + 1; y < bottom; y += 1) { pixels.push([left, y]); pixels.push([right, y]); }
  return pixels;
}

export function Op1PixelEditor({ width, height, sourceSvg, filename = "op1-image", onNotice }: { width: number; height: number; sourceSvg: string; filename?: string; onNotice?: (message: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ start: [number, number]; last: [number, number]; before: Pixel[] } | null>(null);
  const [pixels, setPixels] = useState<Pixel[]>(() => blankPixels(width, height));
  const [history, setHistory] = useState<Pixel[][]>([]);
  const [future, setFuture] = useState<Pixel[][]>([]);
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState(MACHINE_PALETTE[5]);
  const [zoom, setZoom] = useState(2);
  const supported = width > 0 && height > 0 && width * height <= MAX_PIXELS && Number.isInteger(width) && Number.isInteger(height);

  useEffect(() => {
    if (!supported || !sourceSvg) { setPixels(blankPixels(width, height)); return; }
    const cleaned = safeSvgSource(sourceSvg);
    if (!cleaned) { setPixels(blankPixels(width, height)); return; }
    const url = URL.createObjectURL(new Blob([cleaned], { type: "image/svg+xml" }));
    const image = new Image();
    image.onload = () => {
      const raster = document.createElement("canvas"); raster.width = width; raster.height = height;
      const context = raster.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.clearRect(0, 0, width, height); context.drawImage(image, 0, 0, width, height);
      const data = context.getImageData(0, 0, width, height).data;
      const next = Array.from({ length: width * height }, (_, index) => hexFromRgba(data[index * 4], data[index * 4 + 1], data[index * 4 + 2], data[index * 4 + 3]));
      setPixels(next); setHistory([]); setFuture([]);
    };
    image.onerror = () => onNotice?.("SVG refusé : impossible de le rasteriser dans les dimensions déclarées.");
    image.src = url;
    return () => { image.onload = null; image.onerror = null; URL.revokeObjectURL(url); };
  }, [height, sourceSvg, supported, width, onNotice]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas || !supported) return;
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d"); if (!context) return;
    context.imageSmoothingEnabled = false; context.clearRect(0, 0, width, height);
    pixels.forEach((pixel, index) => { if (!pixel) return; const x = index % width; const y = Math.floor(index / width); context.fillStyle = pixel; context.fillRect(x, y, 1, 1); });
    if (zoom >= 4) { context.strokeStyle = "rgba(255,255,255,.16)"; context.lineWidth = 1 / zoom; for (let x = 0; x <= width; x += 1) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); } for (let y = 0; y <= height; y += 1) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); } }
  }, [height, pixels, supported, width, zoom]);

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>): [number, number] | null {
    const canvas = canvasRef.current; if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return [Math.max(0, Math.min(width - 1, Math.floor(((event.clientX - rect.left) / rect.width) * width))), Math.max(0, Math.min(height - 1, Math.floor(((event.clientY - rect.top) / rect.height) * height)))];
  }

  function commit(next: Pixel[], before = pixels) { setHistory((current) => [...current.slice(-39), before]); setFuture([]); setPixels(next); }

  function applyTool(point: [number, number], base: Pixel[], selectedTool = tool): Pixel[] {
    const next = [...base]; const index = pixelIndex(point[0], point[1], width);
    if (selectedTool === "picker") { if (base[index]) setColor(base[index] as string); return base; }
    if (selectedTool === "fill") {
      const target = base[index]; if (target === color) return base;
      const queue: Array<[number, number]> = [point]; const seen = new Set<number>();
      while (queue.length) { const [x, y] = queue.shift() as [number, number]; const currentIndex = pixelIndex(x, y, width); if (seen.has(currentIndex) || next[currentIndex] !== target) continue; seen.add(currentIndex); next[currentIndex] = color; if (x > 0) queue.push([x - 1, y]); if (x < width - 1) queue.push([x + 1, y]); if (y > 0) queue.push([x, y - 1]); if (y < height - 1) queue.push([x, y + 1]); }
      return next;
    }
    next[index] = selectedTool === "eraser" ? null : color; return next;
  }

  function pointerDown(event: React.PointerEvent<HTMLCanvasElement>) { if (!supported) return; const point = pointFromEvent(event); if (!point) return; event.currentTarget.setPointerCapture(event.pointerId); const before = [...pixels]; dragRef.current = { start: point, last: point, before }; if (tool === "line" || tool === "rect") return; const next = applyTool(point, before); if (next !== before) commit(next, before); }
  function pointerMove(event: React.PointerEvent<HTMLCanvasElement>) { const drag = dragRef.current; if (!drag || tool === "line" || tool === "rect") return; const point = pointFromEvent(event); if (!point || (point[0] === drag.last[0] && point[1] === drag.last[1])) return; drag.last = point; const next = applyTool(point, pixels); if (next !== pixels) setPixels(next); }
  function pointerUp(event: React.PointerEvent<HTMLCanvasElement>) { const drag = dragRef.current; dragRef.current = null; if (!drag) return; const point = pointFromEvent(event) ?? drag.last; if (tool === "line" || tool === "rect") { const next = [...drag.before]; shapePixels(tool, drag.start, point).forEach(([x, y]) => { next[pixelIndex(x, y, width)] = color; }); commit(next, drag.before); } else if (drag.before !== pixels) { setHistory((current) => [...current.slice(-39), drag.before]); setFuture([]); } }

  function undo() { const previous = history.at(-1); if (!previous) return; setFuture((current) => [...current.slice(-39), pixels]); setHistory((current) => current.slice(0, -1)); setPixels(previous); }
  function redo() { const next = future.at(-1); if (!next) return; setHistory((current) => [...current.slice(-39), pixels]); setFuture((current) => current.slice(0, -1)); setPixels(next); }

  function loadSvgFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".svg")) { onNotice?.("Fichier refusé : seul le format SVG est autorisé."); return; }
    void file.text().then((text) => {
      const match = text.match(/viewBox\s*=\s*["']\s*(-?[\d.]+)\s+(-?[\d.]+)\s+([\d.]+)\s+([\d.]+)\s*["']/i);
      if (!match || Number(match[3]) !== width || Number(match[4]) !== height) { onNotice?.(`Fichier refusé : le viewBox doit être exactement 0 0 ${width} ${height}.`); return; }
      const cleaned = safeSvgSource(text); const url = URL.createObjectURL(new Blob([cleaned], { type: "image/svg+xml" })); const image = new Image();
      image.onload = () => { const raster = document.createElement("canvas"); raster.width = width; raster.height = height; const context = raster.getContext("2d", { willReadFrequently: true }); if (!context) return; context.drawImage(image, 0, 0, width, height); const data = context.getImageData(0, 0, width, height).data; const next = Array.from({ length: width * height }, (_, index) => hexFromRgba(data[index * 4], data[index * 4 + 1], data[index * 4 + 2], data[index * 4 + 3])); setHistory((current) => [...current.slice(-39), pixels]); setFuture([]); setPixels(next); URL.revokeObjectURL(url); onNotice?.(`Image SVG ${file.name} ouverte dans le canevas ${width}×${height}.`); };
      image.onerror = () => { URL.revokeObjectURL(url); onNotice?.("SVG refusé : rasterisation impossible."); }; image.src = url;
    });
  }

  function saveSvg() {
    const blob = new Blob([pixelsToSvg(pixels, width, height)], { type: "image/svg+xml" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${filename.replace(/\.svg$/i, "")}.pixel.svg`; link.click(); URL.revokeObjectURL(url); onNotice?.("SVG pixel sauvegardé localement. Aucun firmware n’a été modifié.");
  }

  if (!supported) return <div className="op1-pixel-locked"><span>ÉDITION PIXEL VERROUILLÉE</span><strong>{width || "?"} × {height || "?"}</strong><small>Dimensions hors profil écran sécurisé. Aucun redimensionnement automatique autorisé.</small></div>;
  return <section className="op1-pixel-editor" aria-label={`Éditeur pixel ${width} par ${height}`}>
    <div className="op1-pixel-filebar"><div><strong>{filename}</strong><small>SVG uniquement · viewBox exact {width}×{height}</small></div><div className="op1-pixel-actions"><button type="button" onClick={() => fileInputRef.current?.click()}>Ouvrir SVG</button><input ref={fileInputRef} className="visually-hidden" type="file" accept=".svg,image/svg+xml" onChange={(event) => { const file = event.target.files?.[0]; if (file) loadSvgFile(file); event.currentTarget.value = ""; }} /><button type="button" onClick={saveSvg}>Sauvegarder SVG</button></div></div>
    <div className="op1-pixel-examples"><span>Exemples :</span><button type="button" onClick={() => { setPixels(examplePixels("sunset", width, height)); setHistory([]); setFuture([]); }}>Sunset</button><button type="button" onClick={() => { setPixels(examplePixels("wave", width, height)); setHistory([]); setFuture([]); }}>Wave</button><button type="button" onClick={() => { setPixels(examplePixels("tape", width, height)); setHistory([]); setFuture([]); }}>Tape</button></div>
    <div className="op1-pixel-toolbar"><div className="op1-pixel-tools">{(["pencil", "eraser", "fill", "picker", "line", "rect"] as Tool[]).map((item) => <button type="button" key={item} className={tool === item ? "is-active" : ""} onClick={() => setTool(item)}>{item === "pencil" ? "Crayon" : item === "eraser" ? "Gomme" : item === "fill" ? "Remplir" : item === "picker" ? "Pipette" : item === "line" ? "Ligne" : "Rectangle"}</button>)}</div><div className="op1-pixel-actions"><button type="button" onClick={undo} disabled={!history.length}>↶</button><button type="button" onClick={redo} disabled={!future.length}>↷</button><label>Zoom <select value={zoom} onChange={(event) => setZoom(Number(event.target.value))}>{[1, 2, 4, 8, 16].map((value) => <option value={value} key={value}>{value}×</option>)}</select></label></div></div>
    <div className="op1-pixel-palette">{MACHINE_PALETTE.map((item) => <button type="button" key={item} aria-label={`Couleur ${item}`} className={color === item ? "is-active" : ""} style={{ background: item }} onClick={() => setColor(item)} />)}<button type="button" className={`op1-pixel-transparent ${color === "" ? "is-active" : ""}`} aria-label="Transparent" onClick={() => setTool("eraser")}>∅</button></div>
    <div className="op1-pixel-stage"><canvas ref={canvasRef} style={{ width: `${width * zoom}px`, height: `${height * zoom}px` }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} /></div>
    <div className="op1-pixel-status"><span>{width}×{height} · coordonnées entières · palette machine</span><span>{history.length} opérations annulables</span></div>
  </section>;
}
