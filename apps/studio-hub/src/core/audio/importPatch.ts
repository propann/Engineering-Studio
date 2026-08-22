import type { EnginePluginType, PatchPreset } from "../types/audio";

/**
 * Lecture d'un patch importé.
 *
 * Le rack savait exporter trois formats et n'en savait relire aucun : une
 * paire cassée — on pouvait produire un fichier que rien ne reprenait.
 *
 * Ce module existe surtout parce que `applyPatch` écrit **toutes** les clés
 * reçues dans les réglages :
 *
 * ```ts
 * Object.keys(p).forEach((k) => { (paramsRef.current as any)[k] = p[k]; });
 * ```
 *
 * Un fichier venu d'ailleurs est une entrée non fiable. Sans filtre, il y
 * verse ce qu'il veut — des clés inconnues qui s'accumulent, un `NaN` qui rend
 * une voix muette sans lever, ou une chaîne là où le moteur attend un nombre.
 * Aucun de ces défauts ne se voit avant qu'on appuie sur une touche.
 */

/** Les quinze moteurs. Un identifiant hors de cette liste ne rend aucun son. */
export const MOTEURS_CONNUS: EnginePluginType[] = [
  "mi_plaits", "mi_braids", "mi_rings", "mi_clouds", "mi_elements",
  "dexed_fm", "surge_xt", "zynaddsubfx", "helm", "fluidsynth",
  "amsynth", "amy_engine", "pl_synth", "open303", "faust_dsp",
];

export type ResultatImport =
  | { ok: true; patch: PatchPreset; ignores: string[] }
  | { ok: false; raison: string };

/**
 * Clés acceptées dans `params`.
 *
 * La liste est fournie par l'appelant — c'est lui qui connaît les réglages
 * réellement déclarés. La passer plutôt que de la deviner évite le piège
 * classique : une liste recopiée ici, qui diverge de celle du rack au premier
 * paramètre ajouté, et un import qui perd silencieusement le nouveau réglage.
 */
export function lirePatchImporte(
  texte: string,
  clesAutorisees: readonly string[]
): ResultatImport {
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    return { ok: false, raison: "Ce fichier n'est pas du JSON valide." };
  }

  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) {
    return { ok: false, raison: "Ce fichier ne contient pas un patch." };
  }

  const objet = brut as Record<string, unknown>;

  // Les trois formats d'export ne rangent pas le moteur au même endroit :
  // « standard » et « op1 » à la racine, « ep133 » sous sample_map.
  const carte = objet.sample_map as Record<string, unknown> | undefined;
  const moteur = (objet.engine ?? carte?.engine) as unknown;

  if (typeof moteur !== "string") {
    return { ok: false, raison: "Aucun moteur indiqué dans ce fichier." };
  }
  if (!MOTEURS_CONNUS.includes(moteur as EnginePluginType)) {
    return { ok: false, raison: `Moteur inconnu : « ${moteur} ». Ce patch vient sans doute d'une autre version.` };
  }

  const source = (objet.parameters ?? objet.params ?? carte?.params) as unknown;
  const params: Record<string, number | string | boolean> = {};
  const ignores: string[] = [];

  if (typeof source === "object" && source !== null && !Array.isArray(source)) {
    const autorisees = new Set(clesAutorisees);
    // `Object.entries` d'un littéral n'inclut pas la chaîne de prototypes :
    // un `__proto__` dans le JSON arrive comme une clé ordinaire, que le
    // filtre ci-dessous rejette comme n'importe quelle autre inconnue.
    for (const [cle, valeur] of Object.entries(source)) {
      if (cle === "activeEngine") continue; // traité à part, et déjà validé
      if (!autorisees.has(cle)) {
        ignores.push(cle);
        continue;
      }
      // Un NaN ou un Infinity traverse `setValueAtTime` sans lever et rend la
      // voix muette : le pire des défauts, silencieux et sans trace.
      if (typeof valeur === "number" && Number.isFinite(valeur)) {
        params[cle] = valeur;
      } else if (typeof valeur === "string" || typeof valeur === "boolean") {
        params[cle] = valeur;
      } else {
        ignores.push(cle);
      }
    }
  }

  const nom = typeof objet.name === "string" && objet.name.trim()
    ? objet.name.trim()
    : `Importé ${moteur}`;

  return {
    ok: true,
    ignores,
    patch: {
      // Identifiant propre : réutiliser celui du fichier écraserait un patch
      // d'usine portant le même, ou ferait croire à une sélection existante.
      id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: nom,
      engine: moteur as EnginePluginType,
      category: "Importé",
      isUserPatch: true,
      params,
    },
  };
}
