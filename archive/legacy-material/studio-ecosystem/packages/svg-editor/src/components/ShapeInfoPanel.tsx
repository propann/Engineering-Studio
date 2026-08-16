/**
 * Shape Info Panel - Display selected shape information
 */

import { useDrawingStore } from '../store/drawingStore';
import { transformService } from '../services/transform';
import './ShapeInfoPanel.css';

export const ShapeInfoPanel = () => {
  const { selectedShapeIds, layers, currentLayerId } = useDrawingStore();

  const currentLayer = layers.find((l) => l.id === currentLayerId);
  const selectedShapes = currentLayer?.shapes.filter((s) =>
    selectedShapeIds.includes(s.id)
  ) || [];

  if (selectedShapes.length === 0) {
    return (
      <div className="shape-info-panel">
        <div className="info-title">ℹ️ Selection Info</div>
        <div className="info-empty">
          <p>No shapes selected</p>
          <p>Select shapes to see their properties</p>
        </div>
      </div>
    );
  }

  const getShapeInfo = () => {
    if (selectedShapes.length === 1) {
      const shape = selectedShapes[0];
      const dims = transformService.getDimensions(shape);
      const center = transformService.getCenter(shape);

      return {
        type: shape.type.toUpperCase(),
        count: 1,
        points: shape.points.length,
        width: dims.width.toFixed(0),
        height: dims.height.toFixed(0),
        x: shape.points[0]?.x.toFixed(0) || '0',
        y: shape.points[0]?.y.toFixed(0) || '0',
        centerX: center.x.toFixed(0),
        centerY: center.y.toFixed(0),
        rotation: shape.style.rotation,
        opacity: Math.round(shape.style.opacity * 100),
        fill: shape.style.fill,
        stroke: shape.style.stroke,
      };
    } else {
      return {
        type: 'MULTI-SELECT',
        count: selectedShapes.length,
        points: selectedShapes.reduce((sum, s) => sum + s.points.length, 0),
      };
    }
  };

  const info = getShapeInfo();

  return (
    <div className="shape-info-panel">
      <div className="info-title">ℹ️ Selection Info</div>

      <div className="info-content">
        <div className="info-section">
          <div className="info-item">
            <span className="info-label">Type</span>
            <span className="info-value">{info.type}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Count</span>
            <span className="info-value">{info.count}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Points</span>
            <span className="info-value">{info.points}</span>
          </div>
        </div>

        {selectedShapes.length === 1 && (
          <>
            <div className="info-divider" />

            <div className="info-section">
              <strong>Position & Size</strong>
              <div className="info-item">
                <span className="info-label">X</span>
                <span className="info-value">{info.x}px</span>
              </div>
              <div className="info-item">
                <span className="info-label">Y</span>
                <span className="info-value">{info.y}px</span>
              </div>
              <div className="info-item">
                <span className="info-label">Width</span>
                <span className="info-value">{info.width}px</span>
              </div>
              <div className="info-item">
                <span className="info-label">Height</span>
                <span className="info-value">{info.height}px</span>
              </div>
            </div>

            <div className="info-divider" />

            <div className="info-section">
              <strong>Transform</strong>
              <div className="info-item">
                <span className="info-label">Center X</span>
                <span className="info-value">{info.centerX}px</span>
              </div>
              <div className="info-item">
                <span className="info-label">Center Y</span>
                <span className="info-value">{info.centerY}px</span>
              </div>
              <div className="info-item">
                <span className="info-label">Rotation</span>
                <span className="info-value">{info.rotation}°</span>
              </div>
            </div>

            <div className="info-divider" />

            <div className="info-section">
              <strong>Style</strong>
              <div className="info-item">
                <span className="info-label">Opacity</span>
                <span className="info-value">{info.opacity}%</span>
              </div>
              <div className="info-item">
                <span className="info-label">Fill</span>
                <div className="color-preview" style={{ backgroundColor: info.fill }} />
              </div>
              <div className="info-item">
                <span className="info-label">Stroke</span>
                <div className="color-preview" style={{ borderColor: info.stroke }} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
