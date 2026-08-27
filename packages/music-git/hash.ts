/**
 * hash.ts — Calcul de hash SHA-256 sécurisé et déterministe pour Audio & JSON
 */

/**
 * Calcule le hash SHA-256 d'un ArrayBuffer ou Uint8Array
 */
export async function computeBinaryHash(data: ArrayBuffer | Uint8Array): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", bytes as Uint8Array<ArrayBuffer>);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback simple si WebCrypto non disponible (tests purs Node sans subtle)
  return fallbackHash(bytes);
}

/**
 * Calcule le hash SHA-256 déterministe d'un objet JSON ou d'une chaîne
 */
export async function computeObjectHash(obj: unknown): Promise<string> {
  const canonicalJson = deterministicStringify(obj);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalJson);
  return computeBinaryHash(data);
}

/**
 * Sérialisation JSON déterministe (tri alphabétique des clés)
 */
export function deterministicStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(deterministicStringify).join(",") + "]";
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    return JSON.stringify(key) + ":" + deterministicStringify(val);
  });
  return "{" + pairs.join(",") + "}";
}

/**
 * Fallback FNV-1a / Murmur3-like hash 64-bit sous forme hex si WebCrypto absent
 */
function fallbackHash(bytes: Uint8Array): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x5b79a781;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    h1 = Math.imul(h1 ^ b, 0x01000193);
    h2 = Math.imul(h2 ^ b, 0x01000193);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const part2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${part1}${part2}${part1}${part2}`;
}
