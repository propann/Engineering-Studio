/**
 * Playback Controls Component
 * Control audio playback, volume, and speed
 */

import React, { useState, useEffect } from 'react';
import { useAudioStore } from '../../store/audioStore';
import './PlaybackControls.css';

interface PlaybackControlsProps {
  duration?: number;
  onSpeedChange?: (speed: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  duration = 0,
  onSpeedChange
}) => {
  const { isPlaying, setIsPlaying, volume, setVolume, currentTime, setCurrentTime } =
    useAudioStore();
  const [speed, setSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [lastVolume, setLastVolume] = useState(volume);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(lastVolume || 0.5);
      setIsMuted(false);
    } else {
      setLastVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseFloat(e.target.value);
    setSpeed(newSpeed);
    onSpeedChange?.(newSpeed);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(e.target.value));
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00.00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toFixed(2).padStart(5, '0')}`;
  };

  const displayVolume = Math.round(volume * 100);

  return (
    <div className="playback-controls">
      {/* Main Playback */}
      <div className="playback-main">
        <button
          className="playback-btn btn-play"
          onClick={handlePlayPause}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button
          className="playback-btn btn-stop"
          onClick={handleStop}
          title="Stop"
        >
          ⏹️
        </button>

        <div className="playback-time">
          <span className="current-time">{formatTime(currentTime)}</span>
          <span className="separator">/</span>
          <span className="total-time">{formatTime(duration / 1000)}</span>
        </div>

        {/* Timeline Scrubber */}
        <input
          type="range"
          min="0"
          max={duration / 1000}
          value={currentTime}
          onChange={handleTimeChange}
          className="playback-slider"
          title="Seek to time"
        />
      </div>

      {/* Volume Controls */}
      <div className="playback-volume">
        <button
          className="volume-btn"
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : volume === 0 ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="volume-slider"
          title="Volume"
        />
        <span className="volume-value">{displayVolume}%</span>
      </div>

      {/* Speed Control */}
      <div className="playback-speed">
        <label>Speed</label>
        <select
          value={speed}
          onChange={handleSpeedChange}
          className="speed-select"
          title="Playback speed"
        >
          <option value={0.5}>0.5x</option>
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>
      </div>
    </div>
  );
};
