/**
 * Waveform Display Component
 * Visualizes audio waveforms using wavesurfer.js
 * Ready for marker placement
 */

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useAudioStore } from '../../store/audioStore';
import './WaveformDisplay.css';

interface WaveformDisplayProps {
  height?: number;
  onMarkerPlace?: (time: number) => void;
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  height = 200,
  onMarkerPlace
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(100);

  const { audioBuffer, setIsPlaying: setStoreIsPlaying, setCurrentTime: setStoreCurrentTime } =
    useAudioStore();

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4f46e5',
      progressColor: '#06b6d4',
      cursorColor: '#ef4444',
      height: height,
      responsive: true,
      normalize: true,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
    });

    wavesurferRef.current = wavesurfer;

    // Events
    wavesurfer.on('ready', () => {
      setIsReady(true);
      setDuration(wavesurfer.getDuration());
    });

    wavesurfer.on('timeupdate', (currentTime) => {
      setCurrentTime(currentTime);
      setStoreCurrentTime(currentTime);
    });

    wavesurfer.on('play', () => {
      setIsPlaying(true);
      setStoreIsPlaying(true);
    });

    wavesurfer.on('pause', () => {
      setIsPlaying(false);
      setStoreIsPlaying(false);
    });

    wavesurfer.on('click', (relativeX) => {
      const time = relativeX * wavesurfer.getDuration();
      wavesurfer.seekTo(relativeX);
      if (onMarkerPlace) {
        onMarkerPlace(time);
      }
    });

    return () => {
      wavesurfer.destroy();
    };
  }, [setStoreIsPlaying, setStoreCurrentTime, onMarkerPlace, height]);

  // Load audio buffer when it changes
  useEffect(() => {
    if (!wavesurferRef.current || !audioBuffer) return;

    // Convert AudioBuffer to blob
    const offlineContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      length: audioBuffer.length,
      sampleRate: audioBuffer.sampleRate,
    });

    const offlineBuffer = offlineContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      offlineBuffer.copyToChannel(audioBuffer.getChannelData(ch), ch);
    }

    // Create WAV blob
    const wav = encodeWAV(offlineBuffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    wavesurferRef.current.load(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [audioBuffer]);

  // Handle zoom
  useEffect(() => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.zoom(zoom);
  }, [zoom]);

  const handlePlayPause = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.playPause();
  };

  const handleStop = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.stop();
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="waveform-display">
      <div className="waveform-header">
        <h3>Waveform Editor</h3>
        <div className="controls-row">
          <button
            className="btn btn-small"
            onClick={handlePlayPause}
            disabled={!isReady}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸️  Pause' : '▶️  Play'}
          </button>
          <button
            className="btn btn-small"
            onClick={handleStop}
            disabled={!isReady}
            title="Stop"
          >
            ⏹️  Stop
          </button>
          <div className="time-display">
            <span className="current-time">{formatTime(currentTime)}</span>
            <span className="separator">/</span>
            <span className="duration">{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className="waveform-container" ref={containerRef} />

      <div className="waveform-footer">
        <div className="zoom-control">
          <label>Zoom:</label>
          <input
            type="range"
            min="1"
            max="200"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="zoom-slider"
            disabled={!isReady}
          />
          <span className="zoom-value">{zoom}%</span>
        </div>
        <div className="status">
          {!isReady && <span className="status-loading">Loading audio...</span>}
          {isReady && <span className="status-ready">✓ Ready</span>}
        </div>
      </div>

      {/* Info Panel */}
      <div className="waveform-info">
        <div className="info-item">
          <span className="label">Duration:</span>
          <span className="value">{formatTime(duration)}</span>
        </div>
        <div className="info-item">
          <span className="label">Position:</span>
          <span className="value">{formatTime(currentTime)}</span>
        </div>
        <div className="info-item">
          <span className="label">Status:</span>
          <span className="value">{isReady ? '✓ Ready' : 'Loading...'}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Encode AudioBuffer to WAV format
 */
function encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
  const sampleRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = channels * bytesPerSample;
  const dataLength = audioBuffer.length * blockAlign;

  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // WAV header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Audio data
  const offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let ch = 0; ch < channels; ch++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[i]));
      const index = offset + i * blockAlign + ch * bytesPerSample;
      view.setInt16(index, sample * 0x7fff, true);
    }
  }

  return buffer;
}
