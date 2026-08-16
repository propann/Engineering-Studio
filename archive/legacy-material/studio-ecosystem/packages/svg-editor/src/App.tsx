/**
 * SVG Drawing Editor - Main Application
 * Beautiful • Efficient • Simple
 */

import { useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { TabPanel } from './components/TabPanel';
import { LayersPanel } from './components/LayersPanel';
import { ExportPanel } from './components/ExportPanel';
import { AdvancedToolbar } from './components/AdvancedToolbar';
import { useDrawingStore } from './store/drawingStore';
import { clipboardService } from './services/clipboard';
import './App.css';

function App() {
  const { canvas, setZoom, setPan, toggleGrid, currentTool, setCurrentTool } =
    useDrawingStore();

  const { selectedShapeIds, layers, currentLayerId, deleteShape, addShape } =
    useDrawingStore();

  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tool shortcuts
      const shortcuts: Record<string, () => void> = {
        v: () => setCurrentTool('selection'),
        r: () => setCurrentTool('rectangle'),
        c: () => setCurrentTool('circle'),
        p: () => setCurrentTool('polygon'),
        l: () => setCurrentTool('line'),
        n: () => setCurrentTool('pen'),
        t: () => setCurrentTool('text'),
        e: () => setCurrentTool('eraser'),
        g: () => toggleGrid(),
      };

      if (e.key.toLowerCase() in shortcuts && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        shortcuts[e.key.toLowerCase()]();
      }

      // Zoom shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          setZoom(Math.min(5, canvas.zoom + 0.1));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoom(Math.max(0.1, canvas.zoom - 0.1));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(1);
        }

        // Copy/Paste/Delete shortcuts
        if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          const currentLayer = layers.find((l) => l.id === currentLayerId);
          const selected = currentLayer?.shapes.filter((s) =>
            selectedShapeIds.includes(s.id)
          ) || [];
          if (selected.length > 0) {
            clipboardService.copy(selected);
          }
        } else if (e.key.toLowerCase() === 'v') {
          e.preventDefault();
          const pasted = clipboardService.paste();
          pasted.forEach((shape) => {
            addShape(shape);
          });
        } else if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          const currentLayer = layers.find((l) => l.id === currentLayerId);
          const selected = currentLayer?.shapes.filter((s) =>
            selectedShapeIds.includes(s.id)
          ) || [];
          selected.forEach((shape) => {
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
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas.zoom, setZoom, setCurrentTool, toggleGrid, selectedShapeIds, layers, currentLayerId, deleteShape, addShape]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">🎨 SVG Drawing Editor</h1>
          <span className="header-subtitle">Beautiful • Efficient • Simple</span>
        </div>
        <div className="header-right">
          <div className="header-info">
            <span className="info-badge">
              <strong>Current Tool:</strong> {currentTool.toUpperCase()}
            </span>
            <span className="info-badge">
              <strong>Zoom:</strong> {Math.round(canvas.zoom * 100)}%
            </span>
            <span className="info-badge">
              <strong>Grid:</strong> {canvas.showGrid ? '✓' : '✗'}
            </span>
          </div>
          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={() => toggleGrid()}
              title="Toggle Grid (G)"
            >
              📐
            </button>
            <a
              href="#help"
              className="icon-btn"
              title="Help & Shortcuts"
            >
              ❓
            </a>
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar-left">
          <Toolbar />
        </aside>

        <main className="main-content">
          <div className="canvas-wrapper">
            <Canvas />
          </div>
          <AdvancedToolbar />
        </main>

        <aside className="sidebar-right">
          <div className="right-sidebar-content">
            <TabPanel />
          </div>
        </aside>
      </div>

      <footer className="app-footer">
        <div className="footer-left">
          <span className="footer-info">
            Made with ❤️ for creative design
          </span>
        </div>
        <div className="footer-right">
          <LayersPanel />
        </div>
        <div className="footer-export">
          <ExportPanel />
        </div>
      </footer>

      {/* Keyboard Shortcuts Helper */}
      <div className="shortcuts-helper">
        <details>
          <summary>⌨️ Keyboard Shortcuts</summary>
          <div className="shortcuts-content">
            <div className="shortcuts-column">
              <h4>Tools</h4>
              <div className="shortcut-row">
                <kbd>V</kbd> <span>Selection</span>
              </div>
              <div className="shortcut-row">
                <kbd>R</kbd> <span>Rectangle</span>
              </div>
              <div className="shortcut-row">
                <kbd>C</kbd> <span>Circle</span>
              </div>
              <div className="shortcut-row">
                <kbd>P</kbd> <span>Polygon</span>
              </div>
              <div className="shortcut-row">
                <kbd>L</kbd> <span>Line</span>
              </div>
              <div className="shortcut-row">
                <kbd>N</kbd> <span>Pen</span>
              </div>
              <div className="shortcut-row">
                <kbd>T</kbd> <span>Text</span>
              </div>
              <div className="shortcut-row">
                <kbd>E</kbd> <span>Eraser</span>
              </div>
            </div>
            <div className="shortcuts-column">
              <h4>Canvas</h4>
              <div className="shortcut-row">
                <kbd>G</kbd> <span>Toggle Grid</span>
              </div>
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>+</kbd> <span>Zoom In</span>
              </div>
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>-</kbd> <span>Zoom Out</span>
              </div>
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>0</kbd> <span>Reset Zoom</span>
              </div>
              <div className="shortcut-row">
                <kbd>Esc</kbd> <span>Deselect All</span>
              </div>
              <div className="shortcut-row">
                <kbd>Delete</kbd> <span>Delete Selected</span>
              </div>
            </div>
            <div className="shortcuts-column">
              <h4>Edit & Transform</h4>
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>C</kbd> <span>Copy</span>
              </div>
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>V</kbd> <span>Paste</span>
              </div>
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>D</kbd> <span>Duplicate</span>
              </div>
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>Z</kbd> <span>Undo</span>
              </div>
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> <span>Redo</span>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

export default App;
