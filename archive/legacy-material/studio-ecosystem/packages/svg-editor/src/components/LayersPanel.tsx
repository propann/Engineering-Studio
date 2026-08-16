/**
 * LayersPanel Component - Layer Management
 */

import { useRef, useState } from 'react';
import { useDrawingStore } from '../store/drawingStore';
import './LayersPanel.css';

export const LayersPanel = () => {
  const {
    layers,
    currentLayerId,
    createLayer,
    deleteLayer,
    setCurrentLayer,
    renameLayer,
    toggleLayerVisibility,
  } = useDrawingStore();

  const [newLayerName, setNewLayerName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleCreateLayer = () => {
    const name = newLayerName.trim() || `Layer ${layers.length + 1}`;
    createLayer(name);
    setNewLayerName('');
  };

  const handleRenameLayer = (id: string, newName: string) => {
    if (newName.trim()) {
      renameLayer(id, newName.trim());
    }
    setEditingId(null);
  };

  const handleStartEdit = (layerId: string, currentName: string) => {
    setEditingId(layerId);
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.value = currentName;
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 0);
  };

  return (
    <div className="layers-panel">
      <div className="panel-title">📚 Layers</div>

      {/* Create New Layer */}
      <div className="new-layer-group">
        <input
          type="text"
          placeholder="Layer name..."
          value={newLayerName}
          onChange={(e) => setNewLayerName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleCreateLayer();
          }}
          className="layer-input"
        />
        <button
          onClick={handleCreateLayer}
          className="add-layer-btn"
          title="Create new layer (Shift+Ctrl+N)"
        >
          +
        </button>
      </div>

      {/* Layers List */}
      <div className="layers-list">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`layer-item ${currentLayerId === layer.id ? 'active' : ''}`}
          >
            {/* Layer Content */}
            <div
              className="layer-content"
              onClick={() => setCurrentLayer(layer.id)}
            >
              {/* Visibility Toggle */}
              <button
                className="layer-visibility"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
                title="Toggle visibility"
              >
                {layer.visible ? '👁️' : '🙈'}
              </button>

              {/* Layer Name */}
              {editingId === layer.id ? (
                <input
                  ref={editInputRef}
                  type="text"
                  className="layer-name-input"
                  onBlur={(e) => handleRenameLayer(layer.id, e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameLayer(layer.id, e.currentTarget.value);
                    }
                  }}
                />
              ) : (
                <span
                  className="layer-name"
                  onDoubleClick={() => handleStartEdit(layer.id, layer.name)}
                >
                  {layer.name}
                </span>
              )}

              {/* Shape Count */}
              <span className="layer-count">
                {layer.shapes.length} shapes
              </span>
            </div>

            {/* Layer Controls */}
            <div className="layer-controls">
              <button
                className="layer-control-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit(layer.id, layer.name);
                }}
                title="Rename layer"
              >
                ✏️
              </button>

              {layers.length > 1 && (
                <button
                  className="layer-control-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete layer "${layer.name}"?`)) {
                      deleteLayer(layer.id);
                    }
                  }}
                  title="Delete layer"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Layer Info */}
      <div className="layer-info">
        <div className="info-row">
          <span>Total Layers:</span>
          <strong>{layers.length}</strong>
        </div>
        <div className="info-row">
          <span>Total Shapes:</span>
          <strong>{layers.reduce((sum, l) => sum + l.shapes.length, 0)}</strong>
        </div>
      </div>
    </div>
  );
};
