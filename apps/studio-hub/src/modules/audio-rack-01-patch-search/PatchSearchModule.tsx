/**
 * Patch Search Module
 * UI for searching and filtering patches
 */

import React, { useState, useMemo } from "react";
import { useAudioRackPatches } from "@studio-hub/core/store/audioRackStore";
import { PatchSearchEngine } from "./PatchSearchEngine";
import { PatchPreset, EnginePluginType } from "@studio-hub/core/types/audio";

export function PatchSearchModule() {
  const { patches, setPatch } = useAudioRackPatches();
  const [query, setQuery] = useState("");
  const [selectedEngine, setSelectedEngine] = useState<EnginePluginType | "">("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Initialize search engine
  const searchEngine = useMemo(() => new PatchSearchEngine(patches), [patches]);

  // Get search results
  const results = useMemo(() => {
    return searchEngine.search(query, {
      engine: selectedEngine as EnginePluginType | undefined,
      category: selectedCategory || undefined,
      favorites: showFavoritesOnly,
    });
  }, [query, selectedEngine, selectedCategory, showFavoritesOnly, searchEngine]);

  const allCategories = useMemo(() => searchEngine.getCategories(), [searchEngine]);

  const handlePatchSelect = (patch: PatchPreset) => {
    setPatch(patch);
  };

  const handleToggleFavorite = (e: React.MouseEvent, patchId: string) => {
    e.stopPropagation();
    searchEngine.toggleFavorite(patchId);
    // Force re-render
    setQuery((q) => q);
  };

  return (
    <div className="patch-search-module">
      <h3>🔍 Patch Browser</h3>

      {/* Search Input */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search patches by name or tag..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button
          className={`favorite-toggle ${showFavoritesOnly ? "active" : ""}`}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          title="Show only favorites"
        >
          ⭐
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select
          value={selectedEngine}
          onChange={(e) => setSelectedEngine(e.target.value as EnginePluginType | "")}
          className="filter-select"
        >
          <option value="">All Engines</option>
          <option value="mi_plaits">Mutable Instruments Plaits</option>
          <option value="mi_braids">Mutable Instruments Braids</option>
          <option value="mi_rings">Mutable Instruments Rings</option>
          <option value="mi_clouds">Mutable Instruments Clouds</option>
          <option value="mi_elements">Mutable Instruments Elements</option>
          <option value="dexed_fm">Dexed FM</option>
          <option value="surge_xt">Surge XT</option>
          <option value="zynaddsubfx">ZynAddSubFX</option>
          <option value="helm">Helm</option>
          <option value="fluidsynth">FluidSynth</option>
          <option value="amsynth">AMSynth</option>
          <option value="amy_engine">Amy Engine</option>
          <option value="pl_synth">PL Synth</option>
          <option value="open303">Open303</option>
          <option value="faust_dsp">Faust DSP</option>
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          className="quick-btn"
          onClick={() => {
            const recent = searchEngine.getRecent(5);
            if (recent.length > 0) setQuery("");
            setSelectedEngine("");
            setSelectedCategory("");
          }}
        >
          🕐 Recent
        </button>
        <button
          className="quick-btn"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          ⭐ Favorites
        </button>
        <button
          className="quick-btn"
          onClick={() => {
            const randomIdx = Math.floor(Math.random() * patches.length);
            if (patches[randomIdx]) {
              handlePatchSelect(patches[randomIdx]);
            }
          }}
        >
          🎲 Random
        </button>
      </div>

      {/* Results */}
      <div className="patch-results">
        <div className="results-header">
          <span className="results-count">{results.length} patches</span>
        </div>

        <div className="patch-list">
          {results.length > 0 ? (
            results.map((patch) => (
              <div
                key={patch.id}
                className="patch-card"
                onClick={() => handlePatchSelect(patch)}
              >
                <div className="patch-card-header">
                  <h4 className="patch-name">{patch.name}</h4>
                  <button
                    className={`favorite-btn ${patch.isFavorite ? "active" : ""}`}
                    onClick={(e) => handleToggleFavorite(e, patch.id)}
                  >
                    {patch.isFavorite ? "⭐" : "☆"}
                  </button>
                </div>

                <div className="patch-meta">
                  <span className="patch-engine">{patch.engine}</span>
                  <span className="patch-category">{patch.category}</span>
                </div>

                {patch.tags && patch.tags.length > 0 && (
                  <div className="patch-tags">
                    {patch.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                    {patch.tags.length > 3 && (
                      <span className="tag-more">+{patch.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No patches found</p>
              <button
                className="clear-filters-btn"
                onClick={() => {
                  setQuery("");
                  setSelectedEngine("");
                  setSelectedCategory("");
                  setShowFavoritesOnly(false);
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .patch-search-module {
          padding: 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          margin-bottom: 1rem;
        }

        .patch-search-module h3 {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .search-bar {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .search-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
        }

        .favorite-toggle {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .favorite-toggle.active {
          background: #fbbf24;
          border-color: #f59e0b;
        }

        .filter-bar {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .filter-select {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.95rem;
          cursor: pointer;
        }

        .quick-actions {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .quick-btn {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .quick-btn:hover {
          background: var(--bg-tertiary);
          border-color: #4f46e5;
        }

        .patch-results {
          margin-top: 1rem;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .results-count {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .patch-list {
          max-height: 400px;
          overflow-y: auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.5rem;
        }

        .patch-card {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .patch-card:hover {
          border-color: #4f46e5;
          background: var(--bg-tertiary);
        }

        .patch-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          gap: 0.5rem;
        }

        .patch-name {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .favorite-btn {
          border: none;
          background: none;
          font-size: 1rem;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .favorite-btn.active {
          color: #fbbf24;
        }

        .patch-meta {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        .patch-engine,
        .patch-category {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-xs);
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .patch-tags {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        }

        .tag {
          font-size: 0.7rem;
          padding: 0.2rem 0.4rem;
          background: #4f46e5;
          color: white;
          border-radius: 2px;
          white-space: nowrap;
        }

        .tag-more {
          font-size: 0.7rem;
          color: var(--text-secondary);
          padding: 0.2rem 0.4rem;
        }

        .no-results {
          text-align: center;
          padding: 2rem 1rem;
          color: var(--text-secondary);
        }

        .clear-filters-btn {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 0.9rem;
        }

        .clear-filters-btn:hover {
          background: var(--bg-tertiary);
        }
      `}</style>
    </div>
  );
}

export default PatchSearchModule;
