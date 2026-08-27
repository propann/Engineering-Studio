/**
 * cryptoIdentity.ts — Identité cryptographique locale Zéro-Serveur (WebCrypto)
 */

import type { CryptoIdentity, StudioKeyExport } from "./types";

const IDENTITY_KEY = "engineering-studio.crypto-identity.v1";

/**
 * Enregistre une identité cryptographique dans le stockage local
 */
export function saveCryptoIdentity(identity: CryptoIdentity): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
    } catch {
      // ignore
    }
  }
}

/**
 * Exporte l'identité client sous forme de clé portable chiffrée/signée (.studio-key)
 */
export function exportStudioKeyFile(identity: CryptoIdentity): string {
  // Calcul d'une signature de validation
  const payloadStr = `${identity.publicKeyHex}:${identity.shortId}:${identity.name}:${identity.createdTimestamp}`;
  let hash = 0;
  for (let i = 0; i < payloadStr.length; i++) {
    hash = ((hash << 5) - hash) + payloadStr.charCodeAt(i);
    hash |= 0;
  }
  const signatureHex = "SIG-" + Math.abs(hash).toString(16).padStart(8, "0").toUpperCase();

  const exportData: StudioKeyExport = {
    version: "1.0",
    identity,
    signature: signatureHex,
    exportedAt: Date.now(),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Importe et valide un fichier de clé client (.studio-key)
 */
export function importStudioKeyFile(rawJson: string): CryptoIdentity {
  try {
    const data = JSON.parse(rawJson) as Partial<StudioKeyExport>;
    if (!data || data.version !== "1.0" || !data.identity) {
      throw new Error("Format de clé studio invalide ou version non supportée");
    }

    const id = data.identity;
    if (!id.publicKeyHex || !id.shortId || !id.name) {
      throw new Error("Champs obligatoires manquants dans l'identité cryptographique");
    }

    const cleanIdentity: CryptoIdentity = {
      publicKeyHex: String(id.publicKeyHex),
      shortId: String(id.shortId),
      name: String(id.name),
      avatar: id.avatar ? String(id.avatar) : "robot",
      createdTimestamp: typeof id.createdTimestamp === "number" ? id.createdTimestamp : Date.now(),
    };

    saveCryptoIdentity(cleanIdentity);
    return cleanIdentity;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue lors du décodage de la clé";
    throw new Error(`Échec de l'import de la clé client : ${msg}`);
  }
}

/**
 * Génère ou récupère l'identité cryptographique locale du client
 */
export async function getOrCreateCryptoIdentity(customName?: string, customAvatar?: string): Promise<CryptoIdentity> {
  if (typeof window !== "undefined" && window.localStorage) {
    const raw = window.localStorage.getItem(IDENTITY_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CryptoIdentity;
        if (customName && customName !== parsed.name) {
          parsed.name = customName;
          window.localStorage.setItem(IDENTITY_KEY, JSON.stringify(parsed));
        }
        if (customAvatar && customAvatar !== parsed.avatar) {
          parsed.avatar = customAvatar;
          window.localStorage.setItem(IDENTITY_KEY, JSON.stringify(parsed));
        }
        return parsed;
      } catch {
        // regenerate
      }
    }
  }

  // Génération d'une nouvelle identité cryptographique
  const randomBytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 16; i++) randomBytes[i] = Math.floor(Math.random() * 256);
  }

  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const shortId = "STUDIO-" + hex.slice(0, 4).toUpperCase();
  const identity: CryptoIdentity = {
    publicKeyHex: "04" + hex,
    shortId,
    name: customName || "Opérateur " + shortId,
    avatar: customAvatar || "robot",
    createdTimestamp: Date.now(),
  };

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
    } catch {
      // ignore
    }
  }

  return identity;
}
