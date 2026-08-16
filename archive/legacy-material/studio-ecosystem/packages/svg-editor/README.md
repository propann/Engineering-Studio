# 🎨 SVG Drawing Editor

> Beautiful • Efficient • Simple

A professional-grade SVG drawing editor built with **React 19**, **Fabric.js 5**, and **Zustand** for seamless vector design and music visualization.

## ✨ Features

- **Infinite Canvas** - Pan, zoom, and work on unlimited canvas space
- **8 Drawing Tools** - Selection, Rectangle, Circle, Polygon, Line, Pen, Text, Eraser
- **Layer System** - Organize, group, and manage layers with visibility controls
- **Real-time Properties** - Edit fill, stroke, opacity, rotation instantly
- **Grid & Rulers** - Precise alignment with visual guides
- **Multiple Export Formats** - SVG, PNG, PDF export
- **Keyboard Shortcuts** - Full keyboard support for power users
- **Dark Theme** - Professional dark interface with Tailwind CSS
- **State Persistence** - Auto-save to localStorage

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5175](http://localhost:5175) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## 📋 Project Structure

```
src/
├── components/          # React components
│   ├── Canvas.tsx      # Drawing canvas with Fabric.js
│   ├── Toolbar.tsx     # Tool selection panel
│   ├── PropertiesPanel.tsx # Style editor
│   ├── LayersPanel.tsx # Layer management
│   ├── ExportPanel.tsx # Export functionality
│   └── *.css           # Component styles
├── store/              # Zustand state management
│   └── drawingStore.ts # Global state store
├── types/              # TypeScript definitions
│   └── index.ts        # Type definitions
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## ⌨️ Keyboard Shortcuts

### Tools
| Key | Tool |
|-----|------|
| V | Selection |
| R | Rectangle |
| C | Circle |
| P | Polygon |
| L | Line |
| N | Pen |
| T | Text |
| E | Eraser |

### Canvas
| Shortcut | Action |
|----------|--------|
| G | Toggle Grid |
| Ctrl++ | Zoom In |
| Ctrl+- | Zoom Out |
| Ctrl+0 | Reset Zoom |
| Esc | Deselect All |
| Delete | Delete Selected |

## 🎯 State Management

Uses **Zustand** for centralized state management with localStorage persistence:

```typescript
// Access store
const { 
  layers, 
  currentTool, 
  addShape, 
  updateShape 
} = useDrawingStore();

// Undo/Redo support
const { undo, redo } = useDrawingStore();

// Export data
const { getExportData } = useDrawingStore();
```

## 📦 Dependencies

- **React 19.2.8** - UI framework
- **Fabric.js 5.3.0** - Canvas library
- **Zustand 5.0.15** - State management
- **TypeScript 5.5.0** - Type safety
- **Vite 5.4.21** - Build tool
- **Tailwind CSS** - Styling (optional)

## 🎨 Design System

Dark theme with professional color scheme:

```css
--bg-primary: #0f0f1e
--bg-secondary: #1a1a2e
--bg-tertiary: #262641
--accent-primary: #6366f1
--accent-secondary: #8b5cf6
--success: #10b981
--error: #ef4444
```

## 📱 Responsive Design

- Desktop (1024px+) - Full layout with all panels
- Tablet (768px-1024px) - Optimized panel placement
- Mobile (< 768px) - Stacked layout with collapsible panels

## 🧪 Testing

```bash
npm run test
```

## 📖 Documentation

- **Components**: See `COMPONENTS.md` for detailed API documentation
- **State Management**: Check `store/drawingStore.ts` for store methods
- **Types**: Review `types/index.ts` for type definitions

## 🔧 Configuration

### Vite Config

Edit `vite.config.ts` to customize:
- Port (default: 5175)
- Build output (default: dist/)
- Module aliases

### TypeScript

Configure `tsconfig.json` for type checking and compilation options.

## 🚀 Performance

- **Canvas Rendering**: Optimized Fabric.js integration
- **State Updates**: Efficient Zustand store subscriptions
- **Bundle Size**: ~180KB gzipped (optimized)
- **Memory**: Efficient layer management

## 🐛 Debugging

Enable debug logging:

```typescript
// In drawingStore.ts
const DEBUG = true;

if (DEBUG) {
  console.log('State updated:', state);
}
```

## 📄 License

MIT - Free to use and modify

## 🙏 Credits

Built with ❤️ for creative designers and developers.

---

**Version**: 0.1.0  
**Last Updated**: August 2026
