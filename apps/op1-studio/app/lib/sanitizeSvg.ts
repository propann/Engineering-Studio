const ALLOWED_ELEMENTS = new Set([
  "svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "text", "tspan",
]);

const ALLOWED_ATTRIBUTES = new Set([
  "viewbox", "xmlns", "x", "y", "x1", "x2", "y1", "y2", "cx", "cy", "r", "rx", "ry", "d",
  "points", "width", "height", "fill", "fill-opacity", "stroke", "stroke-width", "stroke-opacity",
  "opacity", "transform", "font-family", "font-size", "font-weight", "text-anchor", "dominant-baseline",
]);

function isSafeValue(name: string, value: string) {
  if (/^on/i.test(name)) return false;
  if (/url\s*\(|javascript:|data:/i.test(value)) return false;
  return true;
}

/** Sanitize untrusted SVG before inserting it into the application DOM. */
export function sanitizeSvg(source: string): string {
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") return "";
  const document = new DOMParser().parseFromString(source, "image/svg+xml");
  if (document.querySelector("parsererror")) return "";
  const root = document.documentElement;
  if (root.localName.toLowerCase() !== "svg") return "";

  for (const element of Array.from(document.querySelectorAll("*"))) {
    if (!ALLOWED_ELEMENTS.has(element.localName.toLowerCase())) {
      element.remove();
      continue;
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (!ALLOWED_ATTRIBUTES.has(name) || !isSafeValue(name, attribute.value)) element.removeAttribute(attribute.name);
    }
  }
  return new XMLSerializer().serializeToString(root);
}
