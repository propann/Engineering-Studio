/**
 * Pattern Editor Component
 * Pattern management and playback controls
 */

import React, { useState } from 'react';
import { useEP133Store } from '../../store/ep133Store';
import './PatternEditor.css';

export const PatternEditor: React.FC = () => {
  const {
    patterns,
    currentPattern,
    isPlaying,
    bpm,
    stepCount,
    createPattern,
    deletePattern,
    loadPattern,
    setBPM,
    setStepCount,
    setIsPlaying,
    clearPattern,
    resetStep,
    advanceStep
  } = useEP133Store();

  const [patternName, setPatternName] = useState('New Pattern');
  const [playInterval, setPlayInterval] = useState<NodeJS.Timeout | null>(null);

  const handlePlayClick = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playInterval) clearInterval(playInterval);
    } else {
      setIsPlaying(true);
      // Calculate delay between steps in ms
      const msPerBeat = (60 / bpm) * 1000;
      const stepDuration = msPerBeat / 4; // Sixteenth notes

      const interval = setInterval(() => {
        advanceStep();
      }, stepDuration);

      setPlayInterval(interval);
    }
  };

  const handleStopClick = () => {
    setIsPlaying(false);
    resetStep();
    if (playInterval) clearInterval(playInterval);
  };

  const handleCreatePattern = () => {
    createPattern(patternName);
    setPatternName('');
  };

  return (
    <div className="pattern-editor">
      {/* Playback Controls */}
      <div className="playback-section">
        <div className="section-title">▶️ Playback</div>

        <div className="playback-buttons">
          <button
            className={`play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlayClick}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          <button className="stop-btn" onClick={handleStopClick}>
            ⏹️ Stop
          </button>
        </div>

        {/* BPM Control */}
        <div className="control-group">
          <label>Tempo (BPM)</label>
          <div className="input-row">
            <input
              type="range"
              min="40"
              max="300"
              value={bpm}
              onChange={(e) => setBPM(Number(e.target.value))}
              className="slider"
            />
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBPM(Number(e.target.value))}
              min="40"
              max="300"
              className="number-input"
            />
            <span className="unit">bpm</span>
          </div>
        </div>

        {/* Step Count */}
        <div className="control-group">
          <label>Pattern Length</label>
          <div className="step-buttons">
            {[4, 8, 16, 32].map((steps) => (
              <button
                key={steps}
                className={`step-btn ${stepCount === steps ? 'active' : ''}`}
                onClick={() => setStepCount(steps)}
              >
                {steps}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pattern Management */}
      <div className="patterns-section">
        <div className="section-title">💾 Patterns</div>

        <div className="new-pattern">
          <input
            type="text"
            value={patternName}
            onChange={(e) => setPatternName(e.target.value)}
            placeholder="Pattern name..."
            className="pattern-input"
            maxLength={30}
          />
          <button onClick={handleCreatePattern} className="create-btn">
            + New
          </button>
        </div>

        {patterns.length > 0 ? (
          <div className="patterns-list">
            {patterns.map((pattern) => (
              <div
                key={pattern.id}
                className={`pattern-item ${
                  currentPattern?.id === pattern.id ? 'active' : ''
                }`}
              >
                <div
                  className="pattern-info"
                  onClick={() => loadPattern(pattern.id)}
                >
                  <div className="pattern-name">{pattern.name}</div>
                  <div className="pattern-meta">
                    {pattern.steps} steps @ {pattern.bpm} bpm
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => deletePattern(pattern.id)}
                  title="Delete pattern"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="patterns-empty">No patterns yet. Create one to start!</div>
        )}
      </div>

      {/* Actions */}
      <div className="actions-section">
        <button className="action-btn" onClick={clearPattern}>
          🔄 Clear Pattern
        </button>
        <button className="action-btn secondary">
          📥 Load
        </button>
        <button className="action-btn secondary">
          📤 Export
        </button>
      </div>
    </div>
  );
};
