/**
 * File Manager Component - Save/Load/Export drawings
 */

import { useRef, useState } from 'react';
import { useDrawingStore } from '../store/drawingStore';
import { fileStorageService } from '../services/fileStorage';
import type { DrawingShape, Canvas } from '../types';
import './FileManager.css';

export const FileManager = () => {
  const { canvas, layers, setZoom } = useDrawingStore();
  const [filename, setFilename] = useState('drawing');
  const [saves, setSaves] = useState(fileStorageService.getAllSaves());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get storage info
  const storageInfo = fileStorageService.getStorageInfo();

  const handleSave = () => {
    const name = filename.trim() || 'Untitled Drawing';
    fileStorageService.save({ canvas, layers } as any, name);
    setSaves(fileStorageService.getAllSaves());
    setFilename('');
  };

  const handleLoad = (saveId: string) => {
    const save = fileStorageService.load(saveId);
    if (save) {
      // Load canvas and layers into store
      useDrawingStore.setState({
        canvas: save.data.canvas,
        layers: save.data.layers,
      });
      alert(`✓ Loaded: ${save.name}`);
    }
  };

  const handleDelete = (saveId: string) => {
    if (confirm('Delete this drawing?')) {
      fileStorageService.delete(saveId);
      setSaves(fileStorageService.getAllSaves());
    }
  };

  const handleExportJSON = () => {
    fileStorageService.exportAsJSON({ canvas, layers } as any, filename);
  };

  const handleExportSVG = () => {
    fileStorageService.exportAsSVG({ canvas, layers } as any, filename);
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await fileStorageService.importFromJSON(file);
      useDrawingStore.setState({
        canvas: data.canvas,
        layers: data.layers,
      });
      alert('✓ Drawing imported successfully!');
    } catch (error) {
      alert(`❌ Import failed: ${error}`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    for (let file of files) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        try {
          const data = await fileStorageService.importFromJSON(file);
          useDrawingStore.setState({
            canvas: data.canvas,
            layers: data.layers,
          });
          alert('✓ Drawing imported successfully!');
          return;
        } catch (error) {
          alert(`❌ Import failed: ${error}`);
        }
      }
    }
  };

  return (
    <div className="file-manager">
      <div className="file-title">💾 File Manager</div>

      {/* Save Section */}
      <div className="file-section">
        <div className="section-title">Save Drawing</div>
        <div className="save-controls">
          <input
            type="text"
            placeholder="Drawing name..."
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="filename-input"
          />
          <button onClick={handleSave} className="action-btn save-btn">
            💾 Save
          </button>
        </div>
      </div>

      {/* Load Section */}
      {saves.length > 0 && (
        <div className="file-section">
          <div className="section-title">Load Drawing ({saves.length})</div>
          <div className="saves-list">
            {saves.map((save) => (
              <div key={save.id} className="save-item">
                <div className="save-info">
                  <div className="save-name">{save.name}</div>
                  <div className="save-date">
                    {new Date(save.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="save-actions">
                  <button
                    onClick={() => handleLoad(save.id)}
                    className="icon-btn load"
                    title="Load"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleDelete(save.id)}
                    className="icon-btn delete"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="file-section">
        <div className="section-title">Export Drawing</div>
        <div className="export-controls">
          <button onClick={handleExportJSON} className="action-btn export-btn">
            📄 JSON
          </button>
          <button onClick={handleExportSVG} className="action-btn export-btn">
            🖼️ SVG
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="action-btn import-btn"
          >
            📥 Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        className="file-section drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="drop-icon">📁</div>
        <p>Drag JSON file here to import</p>
      </div>

      {/* Storage Info */}
      <div className="file-section storage-info">
        <div className="storage-bar">
          <div
            className="storage-used"
            style={{ width: `${Math.min(storageInfo.percent, 100)}%` }}
          />
        </div>
        <div className="storage-text">
          Storage: {(storageInfo.used / 1024).toFixed(1)} KB /{' '}
          {(storageInfo.available / 1024 / 1024).toFixed(1)} MB
        </div>
      </div>
    </div>
  );
};
