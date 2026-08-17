/**
 * File Storage Service - Save/Load drawings as JSON
 */

import type { EditorState } from '../types';

interface SavedDrawing {
  id: string;
  name: string;
  timestamp: number;
  data: {
    canvas: EditorState['canvas'];
    layers: EditorState['layers'];
  };
  thumbnail?: string;
}

class FileStorageService {
  private readonly STORAGE_KEY = 'svg-drawings';
  private readonly MAX_SAVES = 20;

  /**
   * Save drawing to localStorage
   */
  save(state: EditorState, name: string): SavedDrawing {
    const drawing: SavedDrawing = {
      id: `drawing-${Date.now()}`,
      name,
      timestamp: Date.now(),
      data: {
        canvas: state.canvas,
        layers: state.layers,
      },
    };

    const saves = this.getAllSaves();
    saves.unshift(drawing);

    // Keep only latest MAX_SAVES
    if (saves.length > this.MAX_SAVES) {
      saves.pop();
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
      console.log(`✓ Saved drawing: "${name}"`);
      return drawing;
    } catch (error) {
      console.error('Failed to save drawing:', error);
      throw new Error('Storage quota exceeded or unavailable');
    }
  }

  /**
   * Load drawing from localStorage
   */
  load(id: string): SavedDrawing | null {
    try {
      const saves = this.getAllSaves();
      return saves.find((s) => s.id === id) || null;
    } catch (error) {
      console.error('Failed to load drawing:', error);
      return null;
    }
  }

  /**
   * Export drawing as JSON file
   */
  exportAsJSON(state: EditorState, filename: string): void {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      canvas: state.canvas,
      layers: state.layers,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    this.downloadFile(blob, `${filename}.json`);
  }

  /**
   * Import drawing from JSON file
   */
  async importFromJSON(file: File): Promise<{
    canvas: EditorState['canvas'];
    layers: EditorState['layers'];
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);

          if (!json.canvas || !json.layers) {
            throw new Error('Invalid drawing format');
          }

          resolve({
            canvas: json.canvas,
            layers: json.layers,
          });
        } catch (error) {
          reject(new Error('Failed to parse JSON file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Export as SVG file
   */
  exportAsSVG(state: EditorState, filename: string): void {
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${state.canvas.width}" height="${state.canvas.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .shape { fill-opacity: 1; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="${state.canvas.backgroundColor}"/>
`;

    state.layers.forEach((layer) => {
      if (!layer.visible) return;

      svgContent += `  <!-- Layer: ${layer.name} -->\n`;
      layer.shapes.forEach((shape) => {
        if (!shape.visible) return;

        const opacity = Math.min(1, layer.opacity * shape.style.opacity);

        switch (shape.type) {
          case 'rectangle':
            svgContent += `  <rect x="${shape.points[0].x}" y="${shape.points[0].y}" width="100" height="100" fill="${shape.style.fill}" stroke="${shape.style.stroke}" stroke-width="${shape.style.strokeWidth}" opacity="${opacity}" transform="rotate(${shape.style.rotation} ${shape.points[0].x + 50} ${shape.points[0].y + 50})"/>\n`;
            break;
          case 'circle':
            svgContent += `  <circle cx="${shape.points[0].x}" cy="${shape.points[0].y}" r="50" fill="${shape.style.fill}" stroke="${shape.style.stroke}" stroke-width="${shape.style.strokeWidth}" opacity="${opacity}"/>\n`;
            break;
          case 'line':
            if (shape.points.length >= 2) {
              svgContent += `  <line x1="${shape.points[0].x}" y1="${shape.points[0].y}" x2="${shape.points[1].x}" y2="${shape.points[1].y}" stroke="${shape.style.stroke}" stroke-width="${shape.style.strokeWidth}" opacity="${opacity}"/>\n`;
            }
            break;
          case 'text':
            svgContent += `  <text x="${shape.points[0].x}" y="${shape.points[0].y}" font-size="${shape.fontSize}" font-family="${shape.fontFamily}" fill="${shape.style.fill}" opacity="${opacity}">${this.escapeXML(shape.text || '')}</text>\n`;
            break;
        }
      });
    });

    svgContent += '</svg>';

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    this.downloadFile(blob, `${filename}.svg`);
  }

  /**
   * Get all saved drawings
   */
  getAllSaves(): SavedDrawing[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load saves:', error);
      return [];
    }
  }

  /**
   * Delete saved drawing
   */
  delete(id: string): boolean {
    try {
      const saves = this.getAllSaves();
      const filtered = saves.filter((s) => s.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      console.log(`✓ Deleted drawing: ${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete drawing:', error);
      return false;
    }
  }

  /**
   * Clear all saves
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('✓ Cleared all drawings');
    } catch (error) {
      console.error('Failed to clear drawings:', error);
    }
  }

  /**
   * Get storage size estimate
   */
  getStorageInfo(): { used: number; available: number; percent: number } {
    const data = localStorage.getItem(this.STORAGE_KEY);
    const used = data ? new Blob([data]).size : 0;
    const available = 5 * 1024 * 1024; // 5MB typical quota

    return {
      used,
      available,
      percent: (used / available) * 100,
    };
  }

  /**
   * Private helper to download file
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export const fileStorageService = new FileStorageService();
