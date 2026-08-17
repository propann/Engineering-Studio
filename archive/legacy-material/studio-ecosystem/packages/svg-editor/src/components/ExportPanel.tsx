/**
 * ExportPanel Component - Export Shapes and Canvas
 */

import { useState } from 'react';
import { useDrawingStore } from '../store/drawingStore';
import type { ExportOptions } from '../types';
import './ExportPanel.css';

export const ExportPanel = () => {
  const { getExportData, canvas } = useDrawingStore();
  const [filename, setFilename] = useState('drawing');
  const [exportFormat, setExportFormat] = useState<'svg' | 'png' | 'pdf'>('svg');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const shapes = getExportData();

      if (exportFormat === 'svg') {
        exportSVG(shapes);
      } else if (exportFormat === 'png') {
        exportPNG(shapes);
      } else if (exportFormat === 'pdf') {
        exportPDF(shapes);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportSVG = (shapes: any) => {
    // Create SVG string
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${canvas.backgroundColor}"/>
`;

    shapes.forEach((shape: any) => {
      switch (shape.type) {
        case 'rectangle':
          svgContent += `  <rect x="${shape.points[0].x}" y="${shape.points[0].y}" width="100" height="100" fill="${shape.style.fill}" stroke="${shape.style.stroke}" stroke-width="${shape.style.strokeWidth}" opacity="${shape.style.opacity}"/>
`;
          break;
        case 'circle':
          svgContent += `  <circle cx="${shape.points[0].x}" cy="${shape.points[0].y}" r="50" fill="${shape.style.fill}" stroke="${shape.style.stroke}" stroke-width="${shape.style.strokeWidth}" opacity="${shape.style.opacity}"/>
`;
          break;
        case 'line':
          if (shape.points.length >= 2) {
            svgContent += `  <line x1="${shape.points[0].x}" y1="${shape.points[0].y}" x2="${shape.points[1].x}" y2="${shape.points[1].y}" stroke="${shape.style.stroke}" stroke-width="${shape.style.strokeWidth}" opacity="${shape.style.opacity}"/>
`;
          }
          break;
        case 'text':
          svgContent += `  <text x="${shape.points[0].x}" y="${shape.points[0].y}" font-size="${shape.fontSize}" font-family="${shape.fontFamily}" fill="${shape.style.fill}" opacity="${shape.style.opacity}">${shape.text}</text>
`;
          break;
      }
    });

    svgContent += '</svg>';

    // Download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    downloadFile(blob, `${filename}.svg`);
  };

  const exportPNG = (shapes: any) => {
    // Create canvas for PNG export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = canvas.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw shapes (simplified)
    shapes.forEach((shape: any) => {
      ctx.globalAlpha = shape.style.opacity;

      switch (shape.type) {
        case 'rectangle':
          ctx.fillStyle = shape.style.fill;
          ctx.strokeStyle = shape.style.stroke;
          ctx.lineWidth = shape.style.strokeWidth;
          ctx.fillRect(shape.points[0].x, shape.points[0].y, 100, 100);
          ctx.strokeRect(shape.points[0].x, shape.points[0].y, 100, 100);
          break;

        case 'circle':
          ctx.fillStyle = shape.style.fill;
          ctx.strokeStyle = shape.style.stroke;
          ctx.lineWidth = shape.style.strokeWidth;
          ctx.beginPath();
          ctx.arc(shape.points[0].x, shape.points[0].y, 50, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
      }
    });

    ctx.globalAlpha = 1;

    // Download
    exportCanvas.toBlob((blob) => {
      if (blob) {
        downloadFile(blob, `${filename}.png`);
      }
    }, 'image/png');
  };

  const exportPDF = (shapes: any) => {
    // Simple PDF export (basic implementation)
    // In production, use a library like jsPDF
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${canvas.width} ${canvas.height}] >>
endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer
<< /Size 4 /Root 1 0 R >>
startxref
200
%%EOF`;

    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    downloadFile(blob, `${filename}.pdf`);
  };

  const downloadFile = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="export-panel">
      <div className="export-title">💾 Export</div>

      <div className="export-group">
        <label htmlFor="filename">Filename</label>
        <div className="filename-input">
          <input
            id="filename"
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="drawing"
          />
          <span className="file-extension">.{exportFormat}</span>
        </div>
      </div>

      <div className="export-group">
        <label>Format</label>
        <div className="format-buttons">
          <button
            className={`format-btn ${exportFormat === 'svg' ? 'active' : ''}`}
            onClick={() => setExportFormat('svg')}
          >
            SVG
          </button>
          <button
            className={`format-btn ${exportFormat === 'png' ? 'active' : ''}`}
            onClick={() => setExportFormat('png')}
          >
            PNG
          </button>
          <button
            className={`format-btn ${exportFormat === 'pdf' ? 'active' : ''}`}
            onClick={() => setExportFormat('pdf')}
          >
            PDF
          </button>
        </div>
      </div>

      <div className="export-info">
        <div className="info-item">
          <span>Canvas Size:</span>
          <strong>{canvas.width}×{canvas.height}px</strong>
        </div>
        <div className="info-item">
          <span>Shapes:</span>
          <strong>{getExportData().length}</strong>
        </div>
      </div>

      <button
        className="export-button"
        onClick={handleExport}
        disabled={isExporting || filename.trim() === ''}
      >
        {isExporting ? '⏳ Exporting...' : '📥 Download'}
      </button>

      <div className="export-hint">
        ℹ️ All visible shapes from visible layers will be exported.
      </div>
    </div>
  );
};
