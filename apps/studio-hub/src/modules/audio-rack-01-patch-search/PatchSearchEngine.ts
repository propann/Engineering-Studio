/**
 * Patch Search Engine
 * Fast search and filtering for audio patches
 */

import { PatchPreset, PatchSearchFilters, EnginePluginType } from "@studio-hub/core/types/audio";

export class PatchSearchEngine {
  private patches: PatchPreset[] = [];
  private indexedPatches: Map<string, PatchPreset> = new Map();

  constructor(initialPatches: PatchPreset[] = []) {
    this.setPatchesIndex(initialPatches);
  }

  /**
   * Set or update the patch index
   */
  setPatchesIndex(patches: PatchPreset[]): void {
    this.patches = patches;
    this.indexedPatches.clear();
    patches.forEach((p) => this.indexedPatches.set(p.id, p));
  }

  /**
   * Search patches by query and filters
   */
  search(query: string = "", filters?: PatchSearchFilters): PatchPreset[] {
    let results = this.patches;

    // Text search (name + tags)
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const tagsMatch = p.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        const categoryMatch = p.category.toLowerCase().includes(q);
        return nameMatch || tagsMatch || categoryMatch;
      });
    }

    // Apply filters
    if (filters?.engine) {
      results = results.filter((p) => p.engine === filters.engine);
    }

    if (filters?.category) {
      results = results.filter((p) => p.category === filters.category);
    }

    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter((p) => filters.tags!.some((t) => p.tags?.includes(t)));
    }

    if (filters?.favorites) {
      results = results.filter((p) => p.isFavorite);
    }

    return results;
  }

  /**
   * Get favorite patches
   */
  getFavorites(): PatchPreset[] {
    return this.patches.filter((p) => p.isFavorite);
  }

  /**
   * Get recently modified patches
   */
  getRecent(limit: number = 10): PatchPreset[] {
    return [...this.patches]
      .sort((a, b) => (b.lastModified ?? 0) - (a.lastModified ?? 0))
      .slice(0, limit);
  }

  /**
   * Get recently created patches
   */
  getNewPatches(limit: number = 10): PatchPreset[] {
    return [...this.patches]
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, limit);
  }

  /**
   * Get patches by engine
   */
  getByEngine(engine: EnginePluginType): PatchPreset[] {
    return this.patches.filter((p) => p.engine === engine);
  }

  /**
   * Get patches by category
   */
  getByCategory(category: string): PatchPreset[] {
    return this.patches.filter((p) => p.category === category);
  }

  /**
   * Get all unique tags across patches
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    this.patches.forEach((p) => {
      p.tags?.forEach((t) => tags.add(t));
    });
    return Array.from(tags).sort();
  }

  /**
   * Get all unique categories
   */
  getCategories(): string[] {
    const categories = new Set(this.patches.map((p) => p.category));
    return Array.from(categories).sort();
  }

  /**
   * Add tag to patch
   */
  addTag(patchId: string, tag: string): boolean {
    const patch = this.indexedPatches.get(patchId);
    if (!patch) return false;

    if (!patch.tags) patch.tags = [];
    if (!patch.tags.includes(tag)) {
      patch.tags.push(tag);
      return true;
    }
    return false;
  }

  /**
   * Remove tag from patch
   */
  removeTag(patchId: string, tag: string): boolean {
    const patch = this.indexedPatches.get(patchId);
    if (!patch || !patch.tags) return false;

    const idx = patch.tags.indexOf(tag);
    if (idx > -1) {
      patch.tags.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(patchId: string): boolean {
    const patch = this.indexedPatches.get(patchId);
    if (!patch) return false;

    patch.isFavorite = !patch.isFavorite;
    return true;
  }

  /**
   * Get patch by ID
   */
  getPatchById(patchId: string): PatchPreset | undefined {
    return this.indexedPatches.get(patchId);
  }

  /**
   * Search by similarity (basic)
   */
  searchSimilar(patchId: string, limit: number = 5): PatchPreset[] {
    const source = this.indexedPatches.get(patchId);
    if (!source) return [];

    const scored = this.patches
      .filter((p) => p.id !== patchId)
      .map((p) => {
        let score = 0;
        if (p.engine === source.engine) score += 5;
        if (p.category === source.category) score += 3;
        const commonTags = (p.tags ?? []).filter((t) => source.tags?.includes(t)).length;
        score += commonTags * 2;
        return { patch: p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map((s) => s.patch);
  }

  /**
   * Export search results as JSON
   */
  exportResults(query: string, filters?: PatchSearchFilters): string {
    const results = this.search(query, filters);
    return JSON.stringify(results, null, 2);
  }
}
