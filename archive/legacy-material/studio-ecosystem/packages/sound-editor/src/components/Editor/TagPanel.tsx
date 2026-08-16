/**
 * Tag Panel Component
 * Manual tag editing and adjustment
 */

import React, { useState, useEffect } from 'react';
import { detectAudioTags, getSuggestionsForAudio } from '../../services/tagCalculation';
import { useAudioStore } from '../../store/audioStore';
import './TagPanel.css';

export interface AudioTags {
  start: number; // ms
  end: number; // ms
  pitch: number; // semitones
  loop: boolean;
  loopStart?: number; // ms
  loopEnd?: number; // ms
  rate: number; // playback rate multiplier
  attack?: number; // ms
  release?: number; // ms
}

interface TagPanelProps {
  tags: AudioTags;
  duration: number;
  onTagsChange?: (tags: AudioTags) => void;
  onAutoDetect?: () => Promise<AudioTags>; // For custom detection
  isLoading?: boolean;
}

const DEFAULT_TAGS: AudioTags = {
  start: 0,
  end: 0,
  pitch: 0,
  loop: false,
  rate: 1,
  attack: 0,
  release: 0
};

export const TagPanel: React.FC<TagPanelProps> = ({
  tags: initialTags = DEFAULT_TAGS,
  duration,
  onTagsChange,
  onAutoDetect,
  isLoading = false
}) => {
  const { audioBuffer } = useAudioStore();
  const [tags, setTags] = useState<AudioTags>(initialTags);
  const [editMode, setEditMode] = useState<keyof AudioTags | null>(null);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const handleTagChange = (key: keyof AudioTags, value: any) => {
    const newTags = { ...tags, [key]: value };

    // Validate constraints
    if (key === 'start') {
      newTags.start = Math.max(0, Math.min(value, duration));
      if (newTags.start > newTags.end) {
        newTags.end = newTags.start + 100;
      }
    }
    if (key === 'end') {
      newTags.end = Math.max(newTags.start, Math.min(value, duration));
    }
    if (key === 'pitch') {
      newTags.pitch = Math.max(-12, Math.min(12, value));
    }
    if (key === 'rate') {
      newTags.rate = Math.max(0.25, Math.min(4, value));
    }
    if (key === 'attack' || key === 'release') {
      newTags[key] = Math.max(0, value);
    }

    setTags(newTags);
    onTagsChange?.(newTags);
  };

  const handleAutoDetect = async () => {
    setAutoDetecting(true);
    try {
      let detectedTags: AudioTags;

      // Use custom detector if provided, otherwise use built-in engine
      if (onAutoDetect) {
        detectedTags = await onAutoDetect();
      } else if (audioBuffer) {
        detectedTags = await detectAudioTags(audioBuffer);

        // Get suggestions
        const result = await getSuggestionsForAudio(audioBuffer);
        setSuggestions(result.suggestions);
      } else {
        throw new Error('No audio buffer available');
      }

      setTags(detectedTags);
      onTagsChange?.(detectedTags);
    } catch (error) {
      console.error('Auto-detect failed:', error);
      setSuggestions([`Error: ${(error as Error).message}`]);
    } finally {
      setAutoDetecting(false);
    }
  };

  const formatMs = (ms: number) => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  };

  const toggleLoop = () => {
    const newTags = {
      ...tags,
      loop: !tags.loop,
      loopStart: !tags.loop ? tags.start : undefined,
      loopEnd: !tags.loop ? tags.end : undefined
    };
    setTags(newTags);
    onTagsChange?.(newTags);
  };

  return (
    <div className="tag-panel">
      <div className="tag-header">
        <h3>Audio Tags</h3>
        <div className="tag-controls">
          <button
            className="tag-btn"
            onClick={handleAutoDetect}
            disabled={!onAutoDetect || autoDetecting || isLoading}
            title="Auto-detect tags using algorithms"
          >
            {autoDetecting ? '⏳ Detecting...' : '✨ Auto-Detect'}
          </button>
          <button
            className="tag-btn tag-btn-secondary"
            onClick={() => {
              setTags(DEFAULT_TAGS);
              onTagsChange?.(DEFAULT_TAGS);
            }}
            title="Reset to defaults"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      <div className="tag-grid">
        {/* Start Time */}
        <div className="tag-group">
          <label>Start Time</label>
          <div className="tag-input-row">
            <input
              type="range"
              min="0"
              max={duration}
              value={tags.start}
              onChange={(e) => handleTagChange('start', parseFloat(e.target.value))}
              className="tag-slider"
              disabled={isLoading || autoDetecting}
            />
            <input
              type="number"
              value={Math.round(tags.start)}
              onChange={(e) => handleTagChange('start', parseInt(e.target.value))}
              className="tag-number-input"
              min="0"
              max={duration}
              disabled={isLoading || autoDetecting}
            />
            <span className="tag-unit">ms</span>
          </div>
          <div className="tag-info">{formatMs(tags.start)}</div>
        </div>

        {/* End Time */}
        <div className="tag-group">
          <label>End Time</label>
          <div className="tag-input-row">
            <input
              type="range"
              min={tags.start}
              max={duration}
              value={tags.end}
              onChange={(e) => handleTagChange('end', parseFloat(e.target.value))}
              className="tag-slider"
              disabled={isLoading || autoDetecting}
            />
            <input
              type="number"
              value={Math.round(tags.end)}
              onChange={(e) => handleTagChange('end', parseInt(e.target.value))}
              className="tag-number-input"
              min={tags.start}
              max={duration}
              disabled={isLoading || autoDetecting}
            />
            <span className="tag-unit">ms</span>
          </div>
          <div className="tag-info">{formatMs(tags.end)}</div>
        </div>

        {/* Pitch */}
        <div className="tag-group">
          <label>Pitch Shift</label>
          <div className="tag-input-row">
            <input
              type="range"
              min="-12"
              max="12"
              value={tags.pitch}
              onChange={(e) => handleTagChange('pitch', parseInt(e.target.value))}
              className="tag-slider"
              disabled={isLoading || autoDetecting}
            />
            <input
              type="number"
              value={tags.pitch}
              onChange={(e) => handleTagChange('pitch', parseInt(e.target.value))}
              className="tag-number-input"
              min="-12"
              max="12"
              disabled={isLoading || autoDetecting}
            />
            <span className="tag-unit">st</span>
          </div>
          <div className="tag-info">
            {tags.pitch === 0 ? 'No shift' : `${tags.pitch > 0 ? '+' : ''}${tags.pitch} semitones`}
          </div>
        </div>

        {/* Rate */}
        <div className="tag-group">
          <label>Playback Rate</label>
          <div className="tag-input-row">
            <input
              type="range"
              min="0.25"
              max="4"
              step="0.01"
              value={tags.rate}
              onChange={(e) => handleTagChange('rate', parseFloat(e.target.value))}
              className="tag-slider"
              disabled={isLoading || autoDetecting}
            />
            <input
              type="number"
              value={tags.rate.toFixed(2)}
              onChange={(e) => handleTagChange('rate', parseFloat(e.target.value))}
              className="tag-number-input"
              min="0.25"
              max="4"
              step="0.01"
              disabled={isLoading || autoDetecting}
            />
            <span className="tag-unit">x</span>
          </div>
          <div className="tag-info">
            {tags.rate === 1 ? 'Normal speed' : `${tags.rate > 1 ? 'Speed up' : 'Slow down'}`}
          </div>
        </div>

        {/* Attack */}
        <div className="tag-group">
          <label>Attack Time</label>
          <div className="tag-input-row">
            <input
              type="range"
              min="0"
              max="1000"
              value={tags.attack || 0}
              onChange={(e) => handleTagChange('attack', parseFloat(e.target.value))}
              className="tag-slider"
              disabled={isLoading || autoDetecting}
            />
            <input
              type="number"
              value={Math.round(tags.attack || 0)}
              onChange={(e) => handleTagChange('attack', parseInt(e.target.value))}
              className="tag-number-input"
              min="0"
              max="1000"
              disabled={isLoading || autoDetecting}
            />
            <span className="tag-unit">ms</span>
          </div>
          <div className="tag-info">{formatMs(tags.attack || 0)}</div>
        </div>

        {/* Release */}
        <div className="tag-group">
          <label>Release Time</label>
          <div className="tag-input-row">
            <input
              type="range"
              min="0"
              max="1000"
              value={tags.release || 0}
              onChange={(e) => handleTagChange('release', parseFloat(e.target.value))}
              className="tag-slider"
              disabled={isLoading || autoDetecting}
            />
            <input
              type="number"
              value={Math.round(tags.release || 0)}
              onChange={(e) => handleTagChange('release', parseInt(e.target.value))}
              className="tag-number-input"
              min="0"
              max="1000"
              disabled={isLoading || autoDetecting}
            />
            <span className="tag-unit">ms</span>
          </div>
          <div className="tag-info">{formatMs(tags.release || 0)}</div>
        </div>
      </div>

      {/* Loop Settings */}
      <div className="tag-loop-section">
        <div className="loop-toggle">
          <label>
            <input
              type="checkbox"
              checked={tags.loop}
              onChange={toggleLoop}
              disabled={isLoading || autoDetecting}
              className="loop-checkbox"
            />
            <span>Enable Loop</span>
          </label>
        </div>

        {tags.loop && (
          <div className="loop-settings">
            <div className="tag-group">
              <label>Loop Start</label>
              <div className="tag-input-row">
                <input
                  type="range"
                  min={tags.start}
                  max={tags.end}
                  value={tags.loopStart || tags.start}
                  onChange={(e) =>
                    handleTagChange('loopStart', parseFloat(e.target.value))
                  }
                  className="tag-slider"
                  disabled={isLoading || autoDetecting}
                />
                <input
                  type="number"
                  value={Math.round(tags.loopStart || tags.start)}
                  onChange={(e) =>
                    handleTagChange('loopStart', parseInt(e.target.value))
                  }
                  className="tag-number-input"
                  min={tags.start}
                  max={tags.end}
                  disabled={isLoading || autoDetecting}
                />
                <span className="tag-unit">ms</span>
              </div>
              <div className="tag-info">{formatMs(tags.loopStart || tags.start)}</div>
            </div>

            <div className="tag-group">
              <label>Loop End</label>
              <div className="tag-input-row">
                <input
                  type="range"
                  min={tags.loopStart || tags.start}
                  max={tags.end}
                  value={tags.loopEnd || tags.end}
                  onChange={(e) => handleTagChange('loopEnd', parseFloat(e.target.value))}
                  className="tag-slider"
                  disabled={isLoading || autoDetecting}
                />
                <input
                  type="number"
                  value={Math.round(tags.loopEnd || tags.end)}
                  onChange={(e) =>
                    handleTagChange('loopEnd', parseInt(e.target.value))
                  }
                  className="tag-number-input"
                  min={tags.loopStart || tags.start}
                  max={tags.end}
                  disabled={isLoading || autoDetecting}
                />
                <span className="tag-unit">ms</span>
              </div>
              <div className="tag-info">{formatMs(tags.loopEnd || tags.end)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tag Summary */}
      <div className="tag-summary">
        <h4>Tag Summary</h4>
        <div className="summary-grid">
          <div className="summary-item">
            <span>Duration:</span>
            <strong>{formatMs(tags.end - tags.start)}</strong>
          </div>
          <div className="summary-item">
            <span>Pitch:</span>
            <strong>{tags.pitch === 0 ? 'Standard' : `${tags.pitch > 0 ? '+' : ''}${tags.pitch}st`}</strong>
          </div>
          <div className="summary-item">
            <span>Loop:</span>
            <strong>{tags.loop ? '✓ Enabled' : '✗ Disabled'}</strong>
          </div>
          <div className="summary-item">
            <span>Rate:</span>
            <strong>{tags.rate.toFixed(2)}x</strong>
          </div>
        </div>
      </div>

      {/* Auto-Detect Suggestions */}
      {suggestions.length > 0 && (
        <div className="tag-suggestions">
          <h4>✨ Auto-Detection Results</h4>
          <div className="suggestions-list">
            {suggestions.map((suggestion, idx) => (
              <div key={idx} className="suggestion-item">
                <span className="suggestion-icon">💡</span>
                <span className="suggestion-text">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
