/**
 * Marker System Component
 * Drag-drop markers on waveform for tag placement
 */

import React, { useState, useCallback } from 'react';
import './MarkerSystem.css';

export type MarkerType = 'start' | 'end' | 'loop-start' | 'loop-end' | 'attack';

interface Marker {
  id: string;
  type: MarkerType;
  time: number; // in seconds
  label: string;
  color: string;
}

interface MarkerSystemProps {
  duration: number;
  currentTime?: number;
  onMarkersChange?: (markers: Marker[]) => void;
  onMarkerClick?: (marker: Marker) => void;
}

const MARKER_CONFIG: Record<MarkerType, { label: string; color: string; icon: string }> = {
  start: { label: 'Start', color: '#ef4444', icon: '▶' },
  end: { label: 'End', color: '#10b981', icon: '⏹' },
  'loop-start': { label: 'Loop Start', color: '#3b82f6', icon: '🔁' },
  'loop-end': { label: 'Loop End', color: '#3b82f6', icon: '🔁' },
  attack: { label: 'Attack', color: '#f59e0b', icon: '⚡' }
};

export const MarkerSystem: React.FC<MarkerSystemProps> = ({
  duration,
  currentTime = 0,
  onMarkersChange,
  onMarkerClick
}) => {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);

  // Add marker
  const addMarker = useCallback(
    (type: MarkerType, time: number) => {
      if (time < 0 || time > duration) return;

      const newMarker: Marker = {
        id: `marker-${Date.now()}`,
        type,
        time,
        label: MARKER_CONFIG[type].label,
        color: MARKER_CONFIG[type].color
      };

      const updatedMarkers = [...markers, newMarker];
      setMarkers(updatedMarkers);
      setSelectedMarker(newMarker);
      onMarkersChange?.(updatedMarkers);
    },
    [duration, markers, onMarkersChange]
  );

  // Remove marker
  const removeMarker = useCallback(
    (id: string) => {
      const updatedMarkers = markers.filter((m) => m.id !== id);
      setMarkers(updatedMarkers);
      if (selectedMarker?.id === id) {
        setSelectedMarker(null);
      }
      onMarkersChange?.(updatedMarkers);
    },
    [markers, selectedMarker, onMarkersChange]
  );

  // Update marker time
  const updateMarkerTime = useCallback(
    (id: string, newTime: number) => {
      if (newTime < 0 || newTime > duration) return;

      const updatedMarkers = markers.map((m) =>
        m.id === id ? { ...m, time: newTime } : m
      );
      setMarkers(updatedMarkers);
      onMarkersChange?.(updatedMarkers);
    },
    [duration, markers, onMarkersChange]
  );

  // Handle marker drag
  const handleMarkerMouseDown = (e: React.MouseEvent, markerId: string) => {
    e.preventDefault();
    setDraggingMarkerId(markerId);
  };

  const handleMarkerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingMarkerId) return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;

    updateMarkerTime(draggingMarkerId, newTime);
  };

  const handleMarkerMouseUp = () => {
    setDraggingMarkerId(null);
  };

  // Format time
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00.00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toFixed(2).padStart(5, '0')}`;
  };

  // Sort markers by time
  const sortedMarkers = [...markers].sort((a, b) => a.time - b.time);

  return (
    <div className="marker-system">
      <div className="marker-header">
        <h3>Markers</h3>
        <div className="marker-buttons">
          <button
            className="marker-btn"
            onClick={() => addMarker('start', currentTime)}
            title="Add Start Marker"
          >
            ▶ Start
          </button>
          <button
            className="marker-btn"
            onClick={() => addMarker('end', currentTime)}
            title="Add End Marker"
          >
            ⏹ End
          </button>
          <button
            className="marker-btn"
            onClick={() => addMarker('loop-start', currentTime)}
            title="Add Loop Start"
          >
            🔁 Loop Start
          </button>
          <button
            className="marker-btn"
            onClick={() => addMarker('loop-end', currentTime)}
            title="Add Loop End"
          >
            🔁 Loop End
          </button>
          <button
            className="marker-btn"
            onClick={() => addMarker('attack', currentTime)}
            title="Add Attack Point"
          >
            ⚡ Attack
          </button>
        </div>
      </div>

      {/* Marker Visualization Track */}
      <div
        className="marker-track"
        onMouseMove={handleMarkerMouseMove}
        onMouseUp={handleMarkerMouseUp}
        onMouseLeave={handleMarkerMouseUp}
      >
        {/* Playhead */}
        <div
          className="marker-playhead"
          style={{
            left: `${(currentTime / duration) * 100}%`
          }}
        />

        {/* Markers */}
        {sortedMarkers.map((marker) => (
          <div
            key={marker.id}
            className={`marker ${marker.type} ${
              selectedMarker?.id === marker.id ? 'selected' : ''
            } ${draggingMarkerId === marker.id ? 'dragging' : ''}`}
            style={{
              left: `${(marker.time / duration) * 100}%`
            }}
            onMouseDown={(e) => handleMarkerMouseDown(e, marker.id)}
            onClick={() => {
              setSelectedMarker(marker);
              onMarkerClick?.(marker);
            }}
            title={`${marker.label}: ${formatTime(marker.time)}`}
          >
            <div className="marker-pin" style={{ backgroundColor: marker.color }} />
            <div className="marker-label">{marker.label}</div>
          </div>
        ))}

        {/* Time ruler */}
        <div className="marker-ruler">
          {Array.from({ length: Math.ceil(duration / 5) + 1 }).map((_, idx) => (
            <div
              key={idx}
              className="ruler-mark"
              style={{
                left: `${(idx * 5 * 100) / duration}%`
              }}
            >
              <span className="ruler-time">{formatTime(idx * 5)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Marker List */}
      <div className="marker-list">
        <h4>Placed Markers ({markers.length})</h4>
        {sortedMarkers.length === 0 ? (
          <div className="marker-list-empty">
            <p>No markers placed yet. Click "Add Marker" or drag on the track.</p>
          </div>
        ) : (
          <div className="marker-list-items">
            {sortedMarkers.map((marker) => (
              <div
                key={marker.id}
                className={`marker-list-item ${selectedMarker?.id === marker.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedMarker(marker);
                  onMarkerClick?.(marker);
                }}
              >
                <div className="marker-list-content">
                  <div className="marker-list-icon" style={{ color: marker.color }}>
                    {MARKER_CONFIG[marker.type].icon}
                  </div>
                  <div className="marker-list-info">
                    <div className="marker-list-label">{marker.label}</div>
                    <div className="marker-list-time">{formatTime(marker.time)}</div>
                  </div>
                </div>
                <button
                  className="marker-list-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMarker(marker.id);
                  }}
                  title="Delete marker"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Marker Details */}
      {selectedMarker && (
        <div className="marker-details">
          <h4>Selected Marker</h4>
          <div className="marker-details-content">
            <div className="detail-row">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{selectedMarker.label}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Time:</span>
              <input
                type="number"
                className="detail-input"
                value={selectedMarker.time.toFixed(2)}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  if (!isNaN(newTime)) {
                    updateMarkerTime(selectedMarker.id, newTime);
                  }
                }}
                min="0"
                max={duration}
                step="0.01"
              />
              <span className="detail-unit">s</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Position:</span>
              <span className="detail-value">
                {((selectedMarker.time / duration) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          <button
            className="marker-details-delete"
            onClick={() => removeMarker(selectedMarker.id)}
          >
            🗑️  Delete Marker
          </button>
        </div>
      )}
    </div>
  );
};
