/**
 * PropertiesPanel Component - Shape Style Editing
 */

import { useDrawingStore } from '../store/drawingStore';
import './PropertiesPanel.css';

export const PropertiesPanel = () => {
  const { currentStyle, selectedShapeIds, setCurrentStyle, updateShape } = useDrawingStore();

  const handleColorChange = (type: 'fill' | 'stroke', value: string) => {
    const newStyle = { ...currentStyle, [type]: value };
    setCurrentStyle(newStyle);

    // Update selected shapes
    selectedShapeIds.forEach((id) => {
      updateShape(id, {
        style: { ...currentStyle, [type]: value },
      });
    });
  };

  const handleStrokeWidthChange = (value: number) => {
    const newStyle = { ...currentStyle, strokeWidth: value };
    setCurrentStyle(newStyle);

    selectedShapeIds.forEach((id) => {
      updateShape(id, {
        style: { ...currentStyle, strokeWidth: value },
      });
    });
  };

  const handleOpacityChange = (value: number) => {
    const newStyle = { ...currentStyle, opacity: value };
    setCurrentStyle(newStyle);

    selectedShapeIds.forEach((id) => {
      updateShape(id, {
        style: { ...currentStyle, opacity: value },
      });
    });
  };

  const handleRotationChange = (value: number) => {
    const newStyle = { ...currentStyle, rotation: value };
    setCurrentStyle(newStyle);

    selectedShapeIds.forEach((id) => {
      updateShape(id, {
        style: { ...currentStyle, rotation: value },
      });
    });
  };

  return (
    <div className="properties-panel">
      <div className="panel-title">🎨 Properties</div>

      {/* Fill Color */}
      <div className="property-group">
        <label htmlFor="fill-color">Fill Color</label>
        <div className="color-input-wrapper">
          <input
            id="fill-color"
            type="color"
            value={currentStyle.fill}
            onChange={(e) => handleColorChange('fill', e.target.value)}
            className="color-input"
          />
          <span className="color-value">{currentStyle.fill}</span>
        </div>
      </div>

      {/* Stroke Color */}
      <div className="property-group">
        <label htmlFor="stroke-color">Stroke Color</label>
        <div className="color-input-wrapper">
          <input
            id="stroke-color"
            type="color"
            value={currentStyle.stroke}
            onChange={(e) => handleColorChange('stroke', e.target.value)}
            className="color-input"
          />
          <span className="color-value">{currentStyle.stroke}</span>
        </div>
      </div>

      {/* Stroke Width */}
      <div className="property-group">
        <label htmlFor="stroke-width">
          Stroke Width
          <span className="value">{currentStyle.strokeWidth}px</span>
        </label>
        <input
          id="stroke-width"
          type="range"
          min="0"
          max="20"
          value={currentStyle.strokeWidth}
          onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
          className="slider"
        />
      </div>

      {/* Opacity */}
      <div className="property-group">
        <label htmlFor="opacity">
          Opacity
          <span className="value">{Math.round(currentStyle.opacity * 100)}%</span>
        </label>
        <input
          id="opacity"
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={currentStyle.opacity}
          onChange={(e) => handleOpacityChange(Number(e.target.value))}
          className="slider"
        />
      </div>

      {/* Rotation */}
      <div className="property-group">
        <label htmlFor="rotation">
          Rotation
          <span className="value">{currentStyle.rotation}°</span>
        </label>
        <input
          id="rotation"
          type="range"
          min="0"
          max="360"
          value={currentStyle.rotation}
          onChange={(e) => handleRotationChange(Number(e.target.value))}
          className="slider"
        />
      </div>

      {/* Presets */}
      <div className="property-group">
        <label>Quick Presets</label>
        <div className="preset-buttons">
          <button
            className="preset-btn"
            onClick={() => {
              setCurrentStyle({
                fill: '#6366f1',
                stroke: '#4f46e5',
                strokeWidth: 2,
                opacity: 1,
                rotation: 0,
              });
            }}
            title="Blue preset"
          >
            🔵 Blue
          </button>
          <button
            className="preset-btn"
            onClick={() => {
              setCurrentStyle({
                fill: '#ef4444',
                stroke: '#dc2626',
                strokeWidth: 2,
                opacity: 1,
                rotation: 0,
              });
            }}
            title="Red preset"
          >
            🔴 Red
          </button>
          <button
            className="preset-btn"
            onClick={() => {
              setCurrentStyle({
                fill: '#10b981',
                stroke: '#059669',
                strokeWidth: 2,
                opacity: 1,
                rotation: 0,
              });
            }}
            title="Green preset"
          >
            🟢 Green
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="property-status">
        {selectedShapeIds.length > 0 ? (
          <span className="status-info">
            ✓ {selectedShapeIds.length} shape{selectedShapeIds.length !== 1 ? 's' : ''} selected
          </span>
        ) : (
          <span className="status-hint">Select a shape to edit</span>
        )}
      </div>
    </div>
  );
};
