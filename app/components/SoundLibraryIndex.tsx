"use client";

import { useMemo, useState } from "react";

type SoundKind = "synth" | "drum";
type SoundAsset = { id: string; name: string; kind: SoundKind; origin: "ORIGINE" | "IMPORT"; duration: number | null; status: "OK" | "A VERIFIER" | "TROP LONG"; favorite: boolean };

const initialAssets: SoundAsset[] = [
  { id: "kick", name: "Kick analog 01", kind: "drum", origin: "IMPORT", duration: 0.8, status: "OK", favorite: true },
  { id: "snare", name: "Snare room 02", kind: "drum", origin: "IMPORT", duration: 1.4, status: "OK", favorite: false },
  { id: "iter", name: "Iter factory A", kind: "synth", origin: "ORIGINE", duration: 4.2, status: "OK", favorite: true },
  { id: "speech", name: "Speech texture", kind: "synth", origin: "ORIGINE", duration: 7.1, status: "TROP LONG", favorite: false },
];

export function SoundLibraryIndex() {
  const [assets, setAssets] = useState(initialAssets);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | SoundKind>("all");
  const visible = useMemo(() => assets.filter((asset) => (kind === "all" || asset.kind === kind) && asset.name.toLowerCase().includes(query.toLowerCase())), [assets, kind, query]);

  function importFiles(files: FileList | null) {
    if (!files) return;
    const imported = Array.from(files).map((file) => ({ id: `${file.name}-${file.lastModified}`, name: file.name, kind: "synth" as const, origin: "IMPORT" as const, duration: null, status: "A VERIFIER" as const, favorite: false }));
    setAssets((current) => [...imported, ...current]);
  }

  return <section className="sound-library-index" aria-labelledby="sound-library-index-title">
    <div className="mod-section-heading"><div><span className="section-label">INDEX LOCAL</span><strong id="sound-library-index-title">Bibliothèque et préflight</strong></div><small>{visible.length}/{assets.length} fichiers</small></div>
    <div className="sound-library-toolbar"><input aria-label="Rechercher un sample" placeholder="Rechercher un sample" value={query} onChange={(event) => setQuery(event.target.value)} /><div className="sound-library-filters" role="group" aria-label="Filtrer les samples"><button type="button" className={kind === "all" ? "is-active" : ""} onClick={() => setKind("all")}>Tous</button><button type="button" className={kind === "synth" ? "is-active" : ""} onClick={() => setKind("synth")}>Synth</button><button type="button" className={kind === "drum" ? "is-active" : ""} onClick={() => setKind("drum")}>Drum</button></div><label className="sound-import-button">Importer<input type="file" accept="audio/*" multiple onChange={(event) => { importFiles(event.target.files); event.currentTarget.value = ""; }} /></label></div>
    <div className="sound-library-table" role="table" aria-label="Index des samples"><div className="sound-library-row sound-library-header" role="row"><span>Nom</span><span>Type</span><span>Durée</span><span>État</span><span aria-label="Favori" /></div>{visible.map((asset) => <div className="sound-library-row" role="row" key={asset.id}><strong>{asset.name}</strong><span className="sound-kind">{asset.kind.toUpperCase()} · {asset.origin}</span><span>{asset.duration === null ? "--" : `${asset.duration.toFixed(1)} s`}</span><span className={`sound-preflight sound-preflight-${asset.status === "OK" ? "ok" : asset.status === "TROP LONG" ? "long" : "check"}`}>{asset.status}</span><button type="button" className={`sound-favorite ${asset.favorite ? "is-active" : ""}`} aria-label={`${asset.favorite ? "Retirer" : "Ajouter"} ${asset.name} des favoris`} onClick={() => setAssets((current) => current.map((item) => item.id === asset.id ? { ...item, favorite: !item.favorite } : item))}>★</button></div>)}</div>
  </section>;
}
