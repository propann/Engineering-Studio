import { useMemo, useState, type ReactNode } from "react";

type CreatorIcon = (props: { name: "download" | "shield"; size?: number }) => ReactNode;
type Shape = "circle" | "cross" | "bars";

function escapeXml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

export function buildDisplayArtwork(label: string, color: string, shape: Shape, scale: number) {
  const safeLabel = escapeXml(label.trim() || "OP-1 STUDIO");
  const size = Math.max(18, Math.min(72, scale));
  const graphic = shape === "circle"
    ? `<circle cx="160" cy="72" r="${size}" fill="none" stroke="${color}" stroke-width="3"/><circle cx="160" cy="72" r="${Math.max(4, size / 5)}" fill="${color}"/>`
    : shape === "cross"
      ? `<path d="M${160 - size} 72H${160 + size}M160 ${72 - size}V${72 + size}" stroke="${color}" stroke-width="3"/>`
      : `<path d="M${160 - size} ${72 - size / 2}H${160 + size}M${160 - size} 72H${160 + size}M${160 - size} ${72 + size / 2}H${160 + size}" stroke="${color}" stroke-width="3"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160"><rect width="320" height="160" fill="#101418"/>${graphic}<text x="160" y="132" fill="${color}" font-family="monospace" font-size="12" text-anchor="middle">${safeLabel}</text></svg>`;
}

export function DisplayCreatorPanel({ Icon, onNotice }: { Icon: CreatorIcon; onNotice: (message: string) => void }) {
  const [label, setLabel] = useState("OP-1 STUDIO");
  const [color, setColor] = useState("#dfd9ff");
  const [shape, setShape] = useState<Shape>("circle");
  const [scale, setScale] = useState(42);
  const svg = useMemo(() => buildDisplayArtwork(label, color, shape, scale), [label, color, shape, scale]);

  function exportSvg() {
    if (!svg.includes('viewBox="0 0 320 160"') || svg.includes("<script")) {
      onNotice("Validation SVG refusée : écran OP-1 ou balise non conforme.");
      return;
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    link.download = "op1-studio-screen.svg";
    link.click();
    URL.revokeObjectURL(link.href);
    onNotice("SVG créé et validé localement. Il peut ensuite être chargé dans l’éditeur d’écrans.");
  }

  return <section className="display-creator" aria-labelledby="display-creator-title">
    <div className="mod-section-heading"><div><span className="section-label">CRÉATEUR ORIGINAL</span><strong id="display-creator-title">Dessiner un écran OP-1</strong></div><small>320 × 160 · export local</small></div>
    <div className="display-creator-grid"><div className="display-creator-controls">
      <label>Texte de l’écran<input value={label} maxLength={28} onChange={(event) => setLabel(event.target.value)} /></label>
      <label>Motif<select value={shape} onChange={(event) => setShape(event.target.value as Shape)}><option value="circle">Cercle</option><option value="cross">Croix</option><option value="bars">Barres</option></select></label>
      <label>Couleur <input className="display-color-input" type="color" value={color} onChange={(event) => setColor(event.target.value)} /></label>
      <label>Taille <input type="range" min="18" max="72" value={scale} onChange={(event) => setScale(Number(event.target.value))} /><output>{scale}</output></label>
      <div className="editor-footer"><span><Icon name="shield" size={14} /> SVG contrôlé</span><button className="primary-action" type="button" onClick={exportSvg}><Icon name="download" size={14} />Exporter le SVG</button></div>
    </div><div className="display-creator-preview" dangerouslySetInnerHTML={{ __html: svg }} /></div>
  </section>;
}
