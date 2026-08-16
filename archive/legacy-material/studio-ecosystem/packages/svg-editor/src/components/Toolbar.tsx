/**
 * Toolbar Component - Drawing Tools Selection
 */

import { useDrawingStore } from '../store/drawingStore';
import type { ToolType } from '../types';
import './Toolbar.css';

const TOOLS: Array<{
  id: ToolType;
  label: string;
  icon: string;
  shortcut: string;
}> = [
  { id: 'selection', label: 'Selection', icon: '🔲', shortcut: 'V' },
  { id: 'rectangle', label: 'Rectangle', icon: '▭', shortcut: 'R' },
  { id: 'circle', label: 'Circle', icon: '◯', shortcut: 'C' },
  { id: 'polygon', label: 'Polygon', icon: '⬟', shortcut: 'P' },
  { id: 'line', label: 'Line', icon: '/', shortcut: 'L' },
  { id: 'pen', label: 'Pen', icon: '✎', shortcut: 'N' },
  { id: 'text', label: 'Text', icon: 'A', shortcut: 'T' },
  { id: 'eraser', label: 'Eraser', icon: '⌫', shortcut: 'E' },
];

export const Toolbar = () => {
  const { currentTool, setCurrentTool } = useDrawingStore();

  const handleToolClick = (toolId: ToolType) => {
    setCurrentTool(toolId);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-title">🎨 Tools</div>
      <div className="toolbar-tools">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`toolbar-button ${currentTool === tool.id ? 'active' : ''}`}
            onClick={() => handleToolClick(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            aria-label={tool.label}
          >
            <span className="tool-icon">{tool.icon}</span>
            <span className="tool-label">{tool.label}</span>
          </button>
        ))}
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-hint">
        <strong>Shortcuts:</strong>
        <div className="shortcuts-grid">
          {TOOLS.map((tool) => (
            <div key={tool.id} className="shortcut-item">
              <span className="shortcut-key">{tool.shortcut}</span>
              <span className="shortcut-name">{tool.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
