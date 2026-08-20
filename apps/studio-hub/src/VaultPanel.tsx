import { useEffect, useMemo, useState } from "react";

export type MachineId = "op1" | "ep133";
type BackupCategory = "tape" | "album" | "drum" | "synth" | "projects" | "samples";
type DirectoryHandle = FileSystemDirectoryHandle & {
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  removeEntry?: (name: string, options?: { recursive?: boolean }) => Promise<void>;
  queryPermission?: (descriptor?: DirectoryPermission) => Promise<PermissionState>;
  requestPermission?: (descriptor?: DirectoryPermission) => Promise<PermissionState>;
};
type BackupFile = { path: string; size: number; sha256?: string; category?: BackupCategory };
type BackupManifest = {
  snapshotId?: string;
  createdAt?: string;
  sourceLabel?: string;
  fileCount?: number;
  totalBytes?: number;
  selectedCategories?: BackupCategory[];
  files?: BackupFile[];
  projects?: { file: string; bytes: number; sha256?: string }[];
  sounds?: { file: string; bytes: number; sha256?: string }[];
};
type VaultReport = {
  operation: "backup" | "restore";
  machine: MachineId;
  snapshotId?: string;
  sourceOrTarget: string;
  createdAt: string;
  categories: BackupCategory[];
  fileCount: number;
  totalBytes: number;
  files: BackupFile[];
};
type DirectoryPermission = { mode: "read" | "readwrite" };
type Snapshot = {
  id: string;
  handle: DirectoryHandle;
  contentDirectory: DirectoryHandle;
  createdAt: string;
  fileCount: number;
  totalBytes: number;
  categories: BackupCategory[];
};

const categoryInfo: Record<BackupCategory, { label: string; description: string; machines: MachineId[] }> = {
  tape: { label: "Bandes", description: "Les quatre pistes tape de l’OP‑1", machines: ["op1"] },
  album: { label: "Album", description: "Les deux faces album de l’OP‑1", machines: ["op1"] },
  drum: { label: "Sons drum", description: "La banque drum/user", machines: ["op1"] },
  synth: { label: "Sons synthé", description: "La banque synth/user", machines: ["op1"] },
  projects: { label: "Projets", description: "Les projets EP‑133", machines: ["ep133"] },
  samples: { label: "Samples", description: "Les samples de la machine", machines: ["op1", "ep133"] },
};

const categoriesForMachine: Record<MachineId, BackupCategory[]> = {
  op1: ["tape", "album", "drum", "synth"],
  ep133: ["projects", "samples"],
};

function directoryPicker() {
  return (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
}

async function permission(handle: DirectoryHandle, mode: "read" | "readwrite") {
  const descriptor = { mode } as DirectoryPermission;
  if (handle.queryPermission && await handle.queryPermission(descriptor) === "granted") return;
  if (handle.requestPermission && await handle.requestPermission(descriptor) !== "granted") {
    throw new Error("L’accès au dossier a été refusé.");
  }
}

async function childDirectory(root: DirectoryHandle, path: string, create = false): Promise<DirectoryHandle> {
  let current = root;
  for (const part of path.split("/").filter(Boolean)) {
    current = await current.getDirectoryHandle(part, { create }) as DirectoryHandle;
  }
  return current;
}

async function collectFiles(directory: DirectoryHandle, prefix = ""): Promise<{ handle: FileSystemFileHandle; path: string }[]> {
  const files: { handle: FileSystemFileHandle; path: string }[] = [];
  for await (const [name, entry] of directory.entries()) {
    const path = prefix ? `${prefix}/${name}` : name;
    if (entry.kind === "file") files.push({ handle: entry as FileSystemFileHandle, path });
    else files.push(...await collectFiles(entry as DirectoryHandle, path));
  }
  return files;
}

async function sha256(buffer: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Un fichier existe-t-il deja dans la cible ?
 *
 * Sert au prevol : sans lui, la restauration ecrase sans qu'on sache combien
 * de fichiers seront remplaces ni lesquels.
 */
export type EtatCategorie = "presente" | "vide" | "absente";

export type ScanCategorie = {
  categorie: BackupCategory;
  etat: EtatCategorie;
  fichiers: number;
  octets: number;
};

export type ScanSource = {
  categories: ScanCategorie[];
  fichiers: number;
  octets: number;
};

/**
 * Inventorie la source, categorie par categorie.
 *
 * L'ancien scan additionnait tout en un seul total et avalait les categories
 * absentes en silence : un dossier `synth` manquant se lisait comme un dossier
 * vide, et le total partiel ne le disait pas. On ne pouvait donc pas savoir
 * si une sauvegarde etait complete.
 *
 * Trois etats sont distingues :
 *   presente — le dossier existe et contient des fichiers
 *   vide     — le dossier existe mais ne contient rien
 *   absente  — le dossier n'existe pas sur la source
 */
export async function scannerSource(
  racine: DirectoryHandle,
  categories: BackupCategory[]
): Promise<ScanSource> {
  const detail: ScanCategorie[] = [];

  for (const categorie of categories) {
    let dossier: DirectoryHandle | null = null;
    try {
      dossier = (await racine.getDirectoryHandle(categorie)) as DirectoryHandle;
    } catch {
      detail.push({ categorie, etat: "absente", fichiers: 0, octets: 0 });
      continue;
    }

    const fichiers = await collectFiles(dossier);
    let octets = 0;
    for (const item of fichiers) octets += (await item.handle.getFile()).size;

    detail.push({
      categorie,
      etat: fichiers.length ? "presente" : "vide",
      fichiers: fichiers.length,
      octets,
    });
  }

  return {
    categories: detail,
    fichiers: detail.reduce((n, c) => n + c.fichiers, 0),
    octets: detail.reduce((n, c) => n + c.octets, 0),
  };
}

export async function fichierExistant(
  root: DirectoryHandle,
  relativePath: string
): Promise<FileSystemFileHandle | null> {
  const parts = relativePath.split("/");
  const name = parts.pop();
  if (!name) return null;
  try {
    const dir = await childDirectory(root, parts.join("/"));
    return await dir.getFileHandle(name);
  } catch {
    return null; // dossier ou fichier absent : ce sera une creation
  }
}

export type PrevolRestauration = {
  aCreer: string[];
  aRemplacer: { path: string; octets: number }[];
};

/**
 * Inventorie ce que la restauration va faire, avant d'ecrire quoi que ce soit.
 */
export async function prevolRestauration(
  fichiers: BackupFile[],
  cible: DirectoryHandle
): Promise<PrevolRestauration> {
  const aCreer: string[] = [];
  const aRemplacer: { path: string; octets: number }[] = [];
  for (const f of fichiers) {
    const existant = await fichierExistant(cible, f.path);
    if (existant) aRemplacer.push({ path: f.path, octets: (await existant.getFile()).size });
    else aCreer.push(f.path);
  }
  return { aCreer, aRemplacer };
}

/**
 * Point de retour : copie les fichiers qui vont etre remplaces dans un dossier
 * horodate de la cible, avant la premiere ecriture.
 *
 * Sans lui, une mauvaise cible ou une simple erreur de selection ecrase des
 * fichiers sans aucun recours — la restauration s'arrete d'ailleurs au premier
 * defaut d'integrite, laissant la cible a moitie ecrasee.
 *
 * Rend le nom du dossier cree, ou null si rien n'etait a remplacer.
 */
export async function creerPointDeRetour(
  aRemplacer: { path: string }[],
  cible: DirectoryHandle,
  onProgress?: (fait: number, total: number) => void
): Promise<string | null> {
  if (!aRemplacer.length) return null;

  const nom = `_point-de-retour/${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const dossier = await childDirectory(cible, nom, true);

  let fait = 0;
  for (const { path } of aRemplacer) {
    const source = await fichierExistant(cible, path);
    if (!source) continue; // disparu entre le prevol et maintenant
    await copyFile(source, dossier, path);
    onProgress?.((fait += 1), aRemplacer.length);
  }
  return nom;
}

async function copyFile(source: FileSystemFileHandle, destinationRoot: DirectoryHandle, relativePath: string) {
  const parts = relativePath.split("/");
  const name = parts.pop();
  if (!name) throw new Error(`Chemin invalide : ${relativePath}`);
  const destinationDirectory = await childDirectory(destinationRoot, parts.join("/"), true);
  const buffer = await (await source.getFile()).arrayBuffer();
  const expectedHash = await sha256(buffer);
  const destination = await destinationDirectory.getFileHandle(name, { create: true });
  const writable = await destination.createWritable();
  await writable.write(buffer);
  await writable.close();
  // Re-read the destination instead of trusting `write()` alone. This catches
  // partial/corrupt writes before a manifest or a restore report is declared
  // valid, which matters for large local volumes and removable media.
  const written = await (await destination.getFile()).arrayBuffer();
  const actualHash = await sha256(written);
  if (written.byteLength !== buffer.byteLength || actualHash !== expectedHash) {
    throw new Error(`Vérification impossible après copie : ${relativePath}`);
  }
  return { size: written.byteLength, sha256: actualHash };
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function downloadReport(report: VaultReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `studio-hub-${report.operation}-${report.machine}-${report.createdAt.replace(/[:.]/g, "-")}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function categoriesFromManifest(manifest: BackupManifest) {
  if (manifest.selectedCategories?.length) return manifest.selectedCategories;
  return [...new Set(manifestFiles(manifest).map((file) => file.path.split("/")[0] as BackupCategory))];
}

function manifestFiles(manifest: BackupManifest): BackupFile[] {
  if (manifest.files?.length) return manifest.files;
  return [
    ...(manifest.projects ?? []).map((file) => ({ path: file.file, size: file.bytes, sha256: file.sha256, category: "projects" as const })),
    ...(manifest.sounds ?? []).map((file) => ({ path: file.file, size: file.bytes, sha256: file.sha256, category: "samples" as const })),
  ];
}

async function snapshotFromFolder(id: string, handle: DirectoryHandle): Promise<Snapshot> {
  const manifestFile = await handle.getFileHandle("manifest.json");
  const manifest = JSON.parse(await (await manifestFile.getFile()).text()) as BackupManifest;
  const files = manifestFiles(manifest);
  const contentDirectory = manifest.files?.length
    ? await handle.getDirectoryHandle("files") as DirectoryHandle
    : handle;
  return {
    id,
    handle,
    contentDirectory,
    createdAt: manifest.createdAt ?? "",
    fileCount: manifest.fileCount ?? files.length,
    totalBytes: manifest.totalBytes ?? files.reduce((sum, file) => sum + file.size, 0),
    categories: categoriesFromManifest(manifest),
  };
}

async function readSnapshots(workspace: DirectoryHandle, machine: MachineId): Promise<Snapshot[]> {
  const snapshots: Snapshot[] = [];
  try {
      const backups = await childDirectory(workspace, `${machine}/backups`);
      for await (const [name, entry] of backups.entries()) {
        if (entry.kind !== "directory") continue;
        try {
          const folder = entry as DirectoryHandle;
          if (machine === "ep133" && name === "clone") {
            for await (const [cloneName, cloneEntry] of folder.entries()) {
              if (cloneEntry.kind !== "directory") continue;
              try { snapshots.push(await snapshotFromFolder(cloneName, cloneEntry as DirectoryHandle)); } catch { /* clone en cours ignoré */ }
            }
          } else {
            snapshots.push(await snapshotFromFolder(name, folder));
          }
        } catch {
          // Ignore incomplete folders; a snapshot is only visible once its manifest exists.
        }
      }
  } catch {
    return [];
  }
  return snapshots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function VaultPanel({
  workspaceHandle,
  onWorkspaceSelected,
  onBackupRecorded,
  initialMachine = "op1",
  compact = false,
  showWorkspace = true,
}: {
  workspaceHandle: FileSystemDirectoryHandle | null;
  onWorkspaceSelected: (handle: FileSystemDirectoryHandle, name: string) => void;
  onBackupRecorded: (machine: MachineId) => void;
  initialMachine?: MachineId;
  compact?: boolean;
  showWorkspace?: boolean;
}) {
  const [machine, setMachine] = useState<MachineId>(initialMachine);
  const [source, setSource] = useState<DirectoryHandle | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<BackupCategory[]>(categoriesForMachine.op1);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [restoreCategories, setRestoreCategories] = useState<BackupCategory[]>([]);
  const [restoreTarget, setRestoreTarget] = useState<DirectoryHandle | null>(null);
  const [restoreTargetName, setRestoreTargetName] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; bytes: number; totalBytes: number; label: string } | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [lastReport, setLastReport] = useState<VaultReport | null>(null);
  const [sourceScan, setSourceScan] = useState<ScanSource | null>(null);

  const selectedSnapshot = useMemo(() => snapshots.find((item) => item.id === selectedSnapshotId), [snapshots, selectedSnapshotId]);
  const availableCategories = categoriesForMachine[machine];

  useEffect(() => {
    setSelectedCategories(categoriesForMachine[machine]);
    setSource(null);
    setSourceName("");
    setSourceScan(null);
    setSelectedSnapshotId("");
    setRestoreCategories([]);
    void (async () => {
      if (!workspaceHandle) { setSnapshots([]); return; }
      try {
        await permission(workspaceHandle as DirectoryHandle, "read");
        const next = await readSnapshots(workspaceHandle as DirectoryHandle, machine);
        setSnapshots(next);
        if (next[0]) { setSelectedSnapshotId(next[0].id); setRestoreCategories(next[0].categories); }
      } catch (err) { setError(err instanceof Error ? err.message : "Impossible de lire le coffre."); }
    })();
  }, [machine, workspaceHandle]);

  function clearMessage() { setError(""); setStatus(""); }

  async function chooseWorkspace() {
    clearMessage();
    const picker = directoryPicker();
    if (!picker) { setError("Ce navigateur ne permet pas de choisir un dossier local."); return; }
    try {
      const handle = await picker();
      const root = handle as DirectoryHandle;
      for (const path of ["shared", "shared/sounds", "shared/sounds/originals", "shared/sounds/prepared", "shared/sounds/packs", "shared/sounds/quarantine", "op1/backups", "op1/samples", "op1/firmware", "ep133/backups", "ep133/projects", "ep133/samples"]) await childDirectory(root, path, true);
      onWorkspaceSelected(handle, handle.name);
      setStatus(`Espace ${handle.name} connecté.`);
    } catch (err) { if ((err as DOMException).name !== "AbortError") setError(err instanceof Error ? err.message : "Impossible de connecter l’espace."); }
  }

  async function chooseSource() {
    clearMessage();
    const picker = directoryPicker();
    if (!picker) { setError("Ce navigateur ne permet pas de choisir un dossier local."); return; }
    try {
      const handle = await picker();
      const root = handle as DirectoryHandle;
      const marker = machine === "op1" ? "tape" : "projects";
      await root.getDirectoryHandle(marker);
      await permission(root, "read");
      setSource(root);
      setSourceName(handle.name);
      const scan = await scannerSource(root, categoriesForMachine[machine]);
      setSourceScan(scan);

      // Les categories absentes ou vides sont annoncees : sinon une
      // sauvegarde amputee passe pour complete.
      const absentes = scan.categories.filter((c) => c.etat === "absente");
      const vides = scan.categories.filter((c) => c.etat === "vide");
      const alerte = [
        absentes.length ? `${absentes.length} absente(s) : ${absentes.map((c) => categoryInfo[c.categorie].label).join(", ")}` : "",
        vides.length ? `${vides.length} vide(s) : ${vides.map((c) => categoryInfo[c.categorie].label).join(", ")}` : "",
      ].filter(Boolean).join(" · ");

      setStatus(
        `${machine.toUpperCase()} : ${scan.fichiers} fichiers, ${formatBytes(scan.octets)}.` +
          (alerte ? ` ⚠️ ${alerte}` : " Toutes les catégories sont présentes.")
      );
    } catch (err) { if ((err as DOMException).name !== "AbortError") setError(`Dossier ${machine.toUpperCase()} invalide ou inaccessible.`); }
  }

async function createBackup() {
    clearMessage();
    if (!workspaceHandle) { setError("Connecte d’abord l’espace de travail maître."); return; }
    if (!source) { setError(`Choisis le disque ou le dossier source de ${machine.toUpperCase()}.`); return; }
    if (!selectedCategories.length) { setError("Sélectionne au moins une catégorie à sauvegarder."); return; }
    setBusy(true);
    let completed = 0;
    let total = 0;
    let snapshotId = "";
    let backups: DirectoryHandle | null = null;
    try {
      const workspace = workspaceHandle as DirectoryHandle;
      await permission(workspace, "readwrite");
      backups = await childDirectory(workspace, `${machine}/backups`, true);
      snapshotId = `${machine}_${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}_${Math.random().toString(16).slice(2, 8)}`;
      const snapshot = await backups.getDirectoryHandle(snapshotId, { create: true }) as DirectoryHandle;
      const filesRoot = await snapshot.getDirectoryHandle("files", { create: true }) as DirectoryHandle;
      const manifestFiles: BackupFile[] = [];
      const filesToCopy: { category: BackupCategory; handle: FileSystemFileHandle; path: string }[] = [];
      for (const category of selectedCategories) {
        const categorySource = await source.getDirectoryHandle(category) as DirectoryHandle;
        const files = await collectFiles(categorySource);
        filesToCopy.push(...files.map((file) => ({ category, handle: file.handle, path: `${category}/${file.path}` })));
      }
      if (!filesToCopy.length) throw new Error("Les catégories sélectionnées ne contiennent aucun fichier.");
      total = filesToCopy.length;
      let totalBytes = 0;
      for (const file of filesToCopy) totalBytes += (await file.handle.getFile()).size;
      setStatus("Copie et vérification des fichiers sélectionnés…");
      setProgress({ current: 0, total, bytes: 0, totalBytes, label: `Préparation : ${total} fichiers (${formatBytes(totalBytes)})` });
      let copiedBytes = 0;
      for (let index = 0; index < filesToCopy.length; index += 1) {
        const file = filesToCopy[index];
        setProgress({ current: index, total, bytes: copiedBytes, totalBytes, label: `Copie de ${file.path}` });
        const copied = await copyFile(file.handle, filesRoot, file.path);
        manifestFiles.push({ path: file.path, category: file.category, ...copied });
        completed = index + 1;
        copiedBytes += copied.size;
        setProgress({ current: completed, total, bytes: copiedBytes, totalBytes, label: `Vérifié : ${file.path}` });
      }
      const manifest: BackupManifest = {
        snapshotId,
        createdAt: new Date().toISOString(),
        sourceLabel: sourceName || machine,
        selectedCategories,
        fileCount: manifestFiles.length,
        totalBytes: manifestFiles.reduce((sum, file) => sum + file.size, 0),
        files: manifestFiles,
      };
      const manifestHandle = await snapshot.getFileHandle("manifest.json", { create: true });
      const writable = await manifestHandle.createWritable();
      await writable.write(JSON.stringify(manifest, null, 2));
      await writable.close();
      setSnapshots(await readSnapshots(workspace, machine));
      setSelectedSnapshotId(snapshotId);
      setRestoreCategories(selectedCategories);
      onBackupRecorded(machine);
      const report: VaultReport = { operation: "backup", machine, snapshotId, sourceOrTarget: sourceName || machine, createdAt: manifest.createdAt ?? new Date().toISOString(), categories: selectedCategories, fileCount: manifestFiles.length, totalBytes: manifest.totalBytes ?? 0, files: manifestFiles };
      setLastReport(report);
      setStatus(`Sauvegarde créée : ${manifestFiles.length} fichiers (${formatBytes(manifest.totalBytes ?? 0)}).`);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "La sauvegarde a échoué.";
      if (backups && snapshotId && backups.removeEntry) {
        try { await backups.removeEntry(snapshotId, { recursive: true }); } catch { /* nettoyage best effort */ }
      }
      setError(`${reason}${total ? ` (${completed}/${total} fichiers finalisés ; le snapshot incomplet reste masqué).` : ""}`);
    }
    finally { setBusy(false); setProgress(null); }
  }

  function chooseSnapshot(id: string) {
    setSelectedSnapshotId(id);
    const snapshot = snapshots.find((item) => item.id === id);
    setRestoreCategories(snapshot?.categories ?? []);
  }

  async function chooseRestoreTarget() {
    clearMessage();
    const picker = directoryPicker();
    if (!picker) { setError("Ce navigateur ne permet pas de choisir un dossier local."); return; }
    try {
      const handle = await picker();
      const root = handle as DirectoryHandle;
      await permission(root, "readwrite");
      setRestoreTarget(root);
      setRestoreTargetName(handle.name);
      setStatus(`Cible de restauration : ${handle.name}.`);
    } catch (err) { if ((err as DOMException).name !== "AbortError") setError(err instanceof Error ? err.message : "Impossible de choisir la cible."); }
  }

  async function restoreBackup() {
    clearMessage();
    if (!selectedSnapshot) { setError("Choisis une sauvegarde à restaurer."); return; }
    if (!restoreTarget) { setError("Choisis le disque ou le dossier cible."); return; }
    if (!restoreCategories.length) { setError("Sélectionne au moins une catégorie à restaurer."); return; }
    setBusy(true);
    let restored = 0;
    let total = 0;
    try {
      const manifestFile = await selectedSnapshot.handle.getFileHandle("manifest.json");
      const manifest = JSON.parse(await (await manifestFile.getFile()).text()) as BackupManifest;
      const files = manifestFiles(manifest).filter((file) => restoreCategories.includes((file.category ?? file.path.split("/")[0]) as BackupCategory));
      if (!files.length) throw new Error("La sauvegarde ne contient aucun fichier dans les catégories sélectionnées.");
      total = files.length;
      const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

      // Prevol : on inventorie avant d'ecrire. La confirmation precedente
      // annoncait « les fichiers portant le même nom seront remplacés » sans
      // dire ni combien ni lesquels.
      setStatus("Comparaison avec la cible…");
      setProgress({ current: 0, total, bytes: 0, totalBytes, label: "Analyse de la cible…" });
      const prevol = await prevolRestauration(files, restoreTarget);

      const detail = [
        `${prevol.aCreer.length} fichier(s) créé(s)`,
        `${prevol.aRemplacer.length} remplacé(s)`,
      ].join(" · ");
      const apercu = prevol.aRemplacer
        .slice(0, 8)
        .map((f) => `  • ${f.path} (${formatBytes(f.octets)})`)
        .join("\n");
      const reste = prevol.aRemplacer.length > 8 ? `\n  … et ${prevol.aRemplacer.length - 8} autre(s)` : "";

      if (
        !window.confirm(
          `Restaurer vers ${restoreTargetName}\n\n${detail}\n\n` +
            (prevol.aRemplacer.length
              ? `Fichiers qui seront remplacés :\n${apercu}${reste}\n\n` +
                `Une copie de ces fichiers sera d'abord placée dans _point-de-retour/ ` +
                `à l'intérieur de la cible.\n\nContinuer ?`
              : `Aucun fichier existant ne sera écrasé.\n\nContinuer ?`)
        )
      ) {
        setStatus("Restauration annulée avant toute écriture.");
        return;
      }

      // Point de retour avant la premiere ecriture.
      let pointDeRetour: string | null = null;
      if (prevol.aRemplacer.length) {
        setStatus("Création du point de retour…");
        pointDeRetour = await creerPointDeRetour(prevol.aRemplacer, restoreTarget, (fait, tot) =>
          setProgress({ current: fait, total: tot, bytes: 0, totalBytes: 0, label: `Point de retour : ${fait}/${tot}` })
        );
      }

      setStatus("Restauration des catégories sélectionnées…");
      setProgress({ current: 0, total, bytes: 0, totalBytes, label: `Préparation : ${total} fichiers (${formatBytes(totalBytes)})` });
      let restoredBytes = 0;
      for (const file of files) {
        const parts = file.path.split("/");
        const name = parts.pop();
        if (!name) continue;
        const sourceDirectory = await childDirectory(selectedSnapshot.contentDirectory, parts.join("/"));
        const sourceFile = await sourceDirectory.getFileHandle(name);
        const copied = await copyFile(sourceFile, restoreTarget, file.path);
        if (file.sha256 && copied.sha256 !== file.sha256) throw new Error(`Intégrité invalide pour ${file.path}.`);
        restored += 1;
        restoredBytes += copied.size;
        setProgress({ current: restored, total, bytes: restoredBytes, totalBytes, label: `Restauré : ${file.path}` });
      }
      const report: VaultReport = { operation: "restore", machine, snapshotId: selectedSnapshot.id, sourceOrTarget: restoreTargetName || machine, createdAt: new Date().toISOString(), categories: restoreCategories, fileCount: restored, totalBytes: restoredBytes, files };
      setLastReport(report);
      setStatus(
        `Restauration terminée : ${prevol.aCreer.length} créé(s), ${prevol.aRemplacer.length} remplacé(s) vers ${restoreTargetName}.` +
          (pointDeRetour ? ` Point de retour : ${pointDeRetour}` : "")
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : "La restauration a échoué.";
      // Sans indiquer le point de retour, une restauration interrompue laisse
      // la cible a moitie ecrasee sans que personne sache ou est l'original.
      setError(
        `${reason}${total ? ` (${restored}/${total} fichiers restaurés).` : ""}` +
          ` Les fichiers d'origine remplacés sont dans _point-de-retour/ à la racine de la cible.`
      );
    }
    finally { setBusy(false); setProgress(null); }
  }

  function toggleCategory(category: BackupCategory, restore = false) {
    const setter = restore ? setRestoreCategories : setSelectedCategories;
    setter((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  }

  return <section className={`vault-panel ${compact ? "vault-panel-compact" : ""}`} id={`atelier-vault-${machine}`}>
    <div className="vault-header"><div><span className="section-kicker">COFFRE {machine === "op1" ? "OP‑1" : "EP‑133"}</span><h2>Gérer les sauvegardes</h2><p className="muted">Coche les catégories à archiver. Les fichiers restent dans ton workspace local.</p></div>{showWorkspace && <div className="vault-workspace"><span>ESPACE MAÎTRE</span><strong>{workspaceHandle ? workspaceHandle.name : "Non connecté"}</strong><button className="secondary-button" onClick={() => void chooseWorkspace()}>{workspaceHandle ? "Changer" : "Connecter"}</button></div>}</div>
    {!compact && <div className="vault-machine-tabs" role="tablist">{(["op1", "ep133"] as MachineId[]).map((id) => <button type="button" key={id} className={machine === id ? "active" : ""} onClick={() => setMachine(id)}>{id === "op1" ? "🎛️ OP‑1" : "🥁 EP‑133"}</button>)}</div>}
    <div className="vault-grid">
      <div className="vault-card"><div className="vault-card-heading"><div><span className="section-kicker">1 · SCANNER ET SAUVEGARDER</span><h3>Créer un snapshot {machine.toUpperCase()}</h3></div><button type="button" className="secondary-button" onClick={() => void chooseSource()}>{source ? "Relancer le scan" : "Scanner la machine"}</button></div><p className="vault-warning">⏱️ Une sauvegarde peut prendre plusieurs minutes. Ne débranche pas la machine et garde cette fenêtre ouverte.</p><p className="vault-path">{source ? `Source connectée : ${sourceName}` : "Aucun disque ou dossier machine sélectionné"}</p>{sourceScan && (
        <div className="vault-scan-result" aria-live="polite">
          <span className="scan-ok">✓ DOSSIER LOCAL INSPECTÉ</span>
          <strong>{sourceScan.fichiers} fichiers</strong>
          <strong>{formatBytes(sourceScan.octets)}</strong>
          <small>Lecture seule — aucune écriture sur la source</small>
          {/* Detail par categorie : un total agrege ne disait pas si une
              categorie manquait, et une sauvegarde amputee passait donc pour
              complete. */}
          <ul className="vault-scan-categories">
            {sourceScan.categories.map((c) => (
              <li key={c.categorie} className={`scan-cat scan-cat-${c.etat}`}>
                <span className="scan-cat-nom">{categoryInfo[c.categorie].label}</span>
                <span className="scan-cat-etat">
                  {c.etat === "absente"
                    ? "absente de la source"
                    : c.etat === "vide"
                      ? "présente mais vide"
                      : `${c.fichiers} fichiers · ${formatBytes(c.octets)}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}<div className="category-list">{availableCategories.map((category) => <label className={`category-choice ${selectedCategories.includes(category) ? "selected" : ""}`} key={category}><input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => toggleCategory(category)} /><span><strong>{categoryInfo[category].label}</strong><small>{categoryInfo[category].description}</small></span></label>)}</div>{busy && progress && <div className="vault-progress" aria-live="polite"><div className="vault-progress-heading"><strong>{progress.current} / {progress.total} fichiers · {formatBytes(progress.bytes)} / {formatBytes(progress.totalBytes)}</strong><span>{Math.round((progress.current / progress.total) * 100)}%</span></div><div className="vault-progress-track"><div className="vault-progress-bar" style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }} /></div><small>{progress.label}</small></div>}<button type="button" className="primary-button vault-action" disabled={busy || !workspaceHandle} onClick={() => void createBackup()}>{busy ? "Sauvegarde en cours…" : "Sauvegarder la sélection"}<span>↓</span></button></div>
      <div className="vault-card"><div className="vault-card-heading"><div><span className="section-kicker">2 · RESTAURER</span><h3>Réinjecter une sauvegarde</h3></div><button type="button" className="secondary-button" onClick={() => void chooseRestoreTarget()}>{restoreTarget ? "Changer la cible" : "Choisir la cible"}</button></div><p className="vault-path">{restoreTarget ? `Cible : ${restoreTargetName}` : "Choisis le disque machine à restaurer"}</p><label className="snapshot-select">Sauvegarde<select value={selectedSnapshotId} onChange={(event) => chooseSnapshot(event.target.value)} disabled={!snapshots.length}><option value="">Aucune sauvegarde</option>{snapshots.map((snapshot) => <option value={snapshot.id} key={snapshot.id}>{snapshot.id} · {snapshot.fileCount} fichiers · {formatBytes(snapshot.totalBytes)}</option>)}</select></label>{selectedSnapshot && <div className="snapshot-meta">{selectedSnapshot.categories.map((category) => <span key={category}>{categoryInfo[category].label}</span>)}</div>}<div className="category-list restore-list">{(selectedSnapshot?.categories ?? []).map((category) => <label className={`category-choice ${restoreCategories.includes(category) ? "selected" : ""}`} key={category}><input type="checkbox" checked={restoreCategories.includes(category)} onChange={() => toggleCategory(category, true)} /><span><strong>{categoryInfo[category].label}</strong><small>Restaurer cette catégorie</small></span></label>)}</div>{busy && progress && <div className="vault-progress" aria-live="polite"><div className="vault-progress-heading"><strong>{progress.current} / {progress.total} fichiers · {formatBytes(progress.bytes)} / {formatBytes(progress.totalBytes)}</strong><span>{Math.round((progress.current / progress.total) * 100)}%</span></div><div className="vault-progress-track"><div className="vault-progress-bar restore-bar" style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }} /></div><small>{progress.label}</small></div>}<button type="button" className="primary-button vault-action restore" disabled={busy || !selectedSnapshot} onClick={() => void restoreBackup()}>{busy ? "Restauration en cours…" : "Restaurer la sélection"}<span>↑</span></button></div>
    </div>
    {status && <p className="vault-status success">{status}</p>}{error && <p className="vault-status error-message">{error}</p>}{lastReport && <div className="vault-report"><span>Rapport local prêt : {lastReport.fileCount} fichiers · {formatBytes(lastReport.totalBytes)}</span><button type="button" className="secondary-button" onClick={() => downloadReport(lastReport)}>Télécharger le rapport JSON</button></div>}
    <p className="vault-note">Chaque snapshot contient un manifeste, le nombre de fichiers, leur taille et leur empreinte SHA‑256. Aucune restauration ne démarre sans choix explicite de la cible.</p>
  </section>;
}
