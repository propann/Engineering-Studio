/**
 * Advanced Toolbar - Alignment, Transform, and Edit Tools
 */

import { useDrawingStore } from '../store/drawingStore';
import { alignmentService } from '../services/alignment';
import { transformService } from '../services/transform';
import { clipboardService } from '../services/clipboard';
import type { AlignType, DistributeType } from '../services/alignment';
import './AdvancedToolbar.css';

export const AdvancedToolbar = () => {
  const {
    selectedShapeIds,
    layers,
    currentLayerId,
    updateShape,
    addShape,
    undo,
    redo,
  } = useDrawingStore();

  // Get selected shapes
  const currentLayer = layers.find((l) => l.id === currentLayerId);
  const selectedShapes = currentLayer?.shapes.filter((s) =>
    selectedShapeIds.includes(s.id)
  ) || [];

  const handleAlign = (type: AlignType) => {
    if (selectedShapes.length < 2) return;

    const aligned = alignmentService.align([...selectedShapes], type);

    aligned.forEach((shape, idx) => {
      updateShape(selectedShapes[idx].id, shape);
    });
  };

  const handleDistribute = (type: DistributeType) => {
    if (selectedShapes.length < 2) return;

    const distributed = alignmentService.distribute([...selectedShapes], type);

    distributed.forEach((shape, idx) => {
      updateShape(selectedShapes[idx].id, shape);
    });
  };

  const handleTransform = (action: string) => {
    selectedShapes.forEach((shape) => {
      let transformed = shape;

      switch (action) {
        case 'rotate-90':
          transformed = transformService.rotateShape(shape, 90);
          break;
        case 'rotate-45':
          transformed = transformService.rotateShape(shape, 45);
          break;
        case 'flip-h':
          transformed = transformService.flipShape(shape, 'horizontal');
          break;
        case 'flip-v':
          transformed = transformService.flipShape(shape, 'vertical');
          break;
        case 'scale-up':
          transformed = transformService.scaleShape(shape, 1.1);
          break;
        case 'scale-down':
          transformed = transformService.scaleShape(shape, 0.9);
          break;
      }

      updateShape(shape.id, transformed);
    });
  };

  const handleCopy = () => {
    if (selectedShapes.length === 0) return;
    clipboardService.copy(selectedShapes);
  };

  const handlePaste = () => {
    const pasted = clipboardService.paste();
    pasted.forEach((shape) => {
      addShape(shape);
    });
  };

  const handleDuplicate = () => {
    selectedShapes.forEach((shape) => {
      const duplicated = {
        ...shape,
        id: `shape-${Date.now()}-${Math.random()}`,
        createdAt: Date.now(),
        points: shape.points.map((p) => ({
          x: p.x + 20,
          y: p.y + 20,
        })),
      };
      addShape(duplicated);
    });
  };

  return (
    <div className="advanced-toolbar">
      {/* Edit Tools */}
      <div className="toolbar-section">
        <button
          className="toolbar-icon-btn"
          onClick={handleCopy}
          disabled={selectedShapes.length === 0}
          title="Copy (Ctrl+C)"
        >
          📋
        </button>
        <button
          className="toolbar-icon-btn"
          onClick={handlePaste}
          disabled={!clipboardService.hasContent()}
          title="Paste (Ctrl+V)"
        >
          📌
        </button>
        <button
          className="toolbar-icon-btn"
          onClick={handleDuplicate}
          disabled={selectedShapes.length === 0}
          title="Duplicate (Ctrl+D)"
        >
          👥
        </button>
        <button
          className="toolbar-icon-btn"
          onClick={undo}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          className="toolbar-icon-btn"
          onClick={redo}
          title="Redo (Ctrl+Shift+Z)"
        >
          ↷
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Alignment Tools */}
      <div className="toolbar-section">
        <div className="toolbar-label">Align</div>
        <button
          className="toolbar-icon-btn"
          onClick={() => handleAlign('left')}
          disabled={selectedShapes.length < 2}
          title="Align Left"
        >
          ⬅️
        </button>
        <button
          className="toolbar-icon-btn"
          onClick={() => handleAlign('center')}
          disabled={selectedShapes.length < 2}
          title="Align Center"
        >
          ⏸️
        </button>
        <button
          className="toolbar-icon-btn"
          onClick={() => handleAlign('right')}
          disabled={selectedShapes.length < 2}
          title="Align Right"
        >
          ➡️
        </button>
        <button
          className="toolbar-icon-btn"
          onClick={() => handleAlign('top')}
          disabled={selectedShapes.length < 2}
          title="Align Top"
        >
          ⬆️
        </button>
        <button
          className="toolbar-icon-btn"
          onClick={() => handleAlign('middle')}
          disabled={selectedShapes.length < 2}
          title="Align Middle"
        >
          ⬍
        </button>
        <button
          className="toolbar-icon-btn"
          onClick={() => handleAlign('bottom')}
          disabled={selectedShapes.length < 2}
          title="Align Bottom"
        >
          ⬇️
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Distribution Tools */}
      <div className="toolbar-section">
        <div className="toolbar-label">Distribute</div>
        <button
          className="toolbar-icon-btn"
          onClick={() => handleDistribute('distribute-h-centers')}
          disabled={selectedShapes.length < 2}
          title="Distribute Horizontally"
        >
          ↔️
        </button>
        <button
          className="toolbar-icon-btn"
          onClick={() => handleDistribute('distribute-v-centers')}
          disabled={selectedShapes.length < 2}
          title="Distribute Vertically"
        >
          ↕️
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Transform Tools */}
      <div className="toolbar-section">
        <div className="toolbar-label">Transform</div>
        <button
          className="toolbar-icon-btn"
          onClick={() => handleTransform('rotate-90')}
          disabled={selectedShapes.length === 0}
          title="Rotate 90° (R)"
        >
          🔄
        </button>
        <button
          className="toolbar-icon-btn"
          onClick={() => handleTransform('flip-h')}
          disabled={selectedShapes.length === 0}
          title="Flip Horizontal (H)"
        >
          ↔️
        </button>
        <button
          className="toolbar-icon-btn"
          onClick={() => handleTransform('flip-v')}
          disabled={selectedShapes.length === 0}
          title="Flip Vertical (V)"
        >
          ↕️
        </button>
        <button
          className="toolbar-icon-btn"
          onClick={() => handleTransform('scale-up')}
          disabled={selectedShapes.length === 0}
          title="Scale Up (+)"
        >
          🔍+
        </button>
        <button
          className="toolbar-icon-btn"
          onClick={() => handleTransform('scale-down')}
          disabled={selectedShapes.length === 0}
          title="Scale Down (-)"
        >
          🔍-
        </button>
      </div>

      {/* Status */}
      <div className="toolbar-status">
        {selectedShapes.length > 0 ? (
          <span>
            ✓ {selectedShapes.length} selected • Clipboard:{' '}
            {clipboardService.getCount()}
          </span>
        ) : (
          <span>Select shapes to use advanced tools</span>
        )}
      </div>
    </div>
  );
};
