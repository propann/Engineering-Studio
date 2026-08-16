/**
 * History Panel - Undo/Redo Stack Visualization
 */

import { useDrawingStore } from '../store/drawingStore';
import './HistoryPanel.css';

const HISTORY_ACTIONS = [
  { id: 'add-shape', label: 'Add Shape', icon: '✚' },
  { id: 'delete-shape', label: 'Delete Shape', icon: '✕' },
  { id: 'update-shape', label: 'Modify Shape', icon: '✎' },
  { id: 'move-shape', label: 'Move Shape', icon: '➜' },
  { id: 'create-layer', label: 'Create Layer', icon: '📚' },
  { id: 'delete-layer', label: 'Delete Layer', icon: '🗑️' },
  { id: 'align', label: 'Align Shapes', icon: '⬍' },
  { id: 'distribute', label: 'Distribute', icon: '↔️' },
  { id: 'transform', label: 'Transform', icon: '🔄' },
];

export const HistoryPanel = () => {
  const { undo, redo } = useDrawingStore();

  return (
    <div className="history-panel">
      <div className="history-title">📋 History</div>

      <div className="history-controls">
        <button className="history-btn" onClick={undo} title="Undo (Ctrl+Z)">
          ↶
        </button>
        <button className="history-btn" onClick={redo} title="Redo (Ctrl+Shift+Z)">
          ↷
        </button>
      </div>

      <div className="history-info">
        <p>
          <strong>Tip:</strong> Use <kbd>Ctrl+Z</kbd> to undo and{' '}
          <kbd>Ctrl+Shift+Z</kbd> to redo.
        </p>
      </div>

      <div className="history-actions">
        <strong>Common Actions:</strong>
        <div className="actions-grid">
          {HISTORY_ACTIONS.map((action) => (
            <div key={action.id} className="action-item">
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
