/**
 * Drum Pads Component (EP-133)
 * 16 interactive drum pads (4x4 grid)
 */

import React, { useState } from 'react';
import { useEP133Store } from '../../store/ep133Store';
import './DrumPads.css';

export const DrumPads: React.FC = () => {
  const { drums, selectedPad, setSelectedPad } = useEP133Store();
  const [activePad, setActivePad] = useState<number | null>(null);

  const handlePadDown = (index: number) => {
    setSelectedPad(index);
    setActivePad(index);
    // TODO: Play sound
  };

  const handlePadUp = () => {
    setActivePad(null);
  };

  const padColors = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#d946ef', // Magenta
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#84cc16', // Lime
    '#14b8a6', // Teal
    '#0891b2', // Cyan Dark
    '#6b7280', // Gray
    '#64748b'  // Slate
  ];

  return (
    <div className="drum-pads">
      <div className="pads-header">
        <h3>🥁 Drum Pads</h3>
        <div className="pad-info">
          <div className="info-item">
            <span>Selected:</span>
            <strong>{selectedPad + 1}</strong>
          </div>
          <div className="info-item">
            <span>Sound:</span>
            <strong>{drums[selectedPad]?.name}</strong>
          </div>
        </div>
      </div>

      <div className="pads-grid">
        {Array.from({ length: 16 }).map((_, index) => (
          <div
            key={index}
            className={`pad ${selectedPad === index ? 'selected' : ''} ${
              activePad === index ? 'active' : ''
            }`}
            style={{
              backgroundColor: padColors[index]
            }}
            onMouseDown={() => handlePadDown(index)}
            onMouseUp={handlePadUp}
            onMouseLeave={handlePadUp}
            onTouchStart={() => handlePadDown(index)}
            onTouchEnd={handlePadUp}
            title={`Pad ${index + 1}: ${drums[index]?.name}`}
          >
            <div className="pad-number">{index + 1}</div>
            <div className="pad-name">{drums[index]?.name.slice(0, 4)}</div>
          </div>
        ))}
      </div>

      <div className="pads-footer">
        <div className="footer-info">
          <p className="tip">💡 Click pads to select sound or drag for velocity</p>
        </div>
      </div>
    </div>
  );
};
