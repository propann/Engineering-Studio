import React, { useState } from 'react';
import { useAudioStore } from './store/audioStore';
import { loadAudioFile } from './services/audioProcessing';
import { WaveformDisplay } from './components/Waveform/WaveformDisplay';
import { MarkerSystem, Marker } from './components/Waveform/MarkerSystem';
import './App.css';

export function App() {
  const { audioBuffer, setAudioBuffer, currentTime, volume } = useAudioStore();
  const [selectedMode, setSelectedMode] = useState<'op1' | 'ep133'>('op1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const buffer = await loadAudioFile(file);
      setAudioBuffer(buffer);
    } catch (err) {
      setError(`Error loading file: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎵 Sound Editor</h1>
        <p>Create OP-1 & EP-133 sounds with ease</p>
      </header>

      <div className="container">
        <div className="mode-selector">
          <button
            className={`mode-btn ${selectedMode === 'op1' ? 'active' : ''}`}
            onClick={() => setSelectedMode('op1')}
          >
            🎛️ OP-1 Editor
          </button>
          <button
            className={`mode-btn ${selectedMode === 'ep133' ? 'active' : ''}`}
            onClick={() => setSelectedMode('ep133')}
          >
            🥁 EP-133 Editor
          </button>
        </div>

        <div className="editor-area">
          {!audioBuffer ? (
            <div className="upload-section">
              <label className="upload-box">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
                <div className="upload-content">
                  {isLoading ? (
                    <>
                      <div className="spinner">⏳</div>
                      <p>Loading audio...</p>
                    </>
                  ) : (
                    <>
                      <div className="upload-icon">📁</div>
                      <p>Drag audio file here or click to upload</p>
                      <small>Supported: MP3, WAV, OGG, M4A</small>
                    </>
                  )}
                </div>
              </label>
              {error && <div className="error-message">{error}</div>}
            </div>
          ) : (
            <div className="editor-content">
              <div className="editor-main">
                <div className="editor-header">
                  <div>
                    <h2>{selectedMode === 'op1' ? '🎛️ OP-1 Sound Editor' : '🥁 EP-133 Pattern Editor'}</h2>
                    <p>
                      Editing: {(audioBuffer.length / audioBuffer.sampleRate).toFixed(2)}s @{' '}
                      {audioBuffer.sampleRate}Hz
                    </p>
                  </div>
                  <button onClick={() => setAudioBuffer(null)} className="btn-clear">
                    ← Load Different Audio
                  </button>
                </div>

                {selectedMode === 'op1' ? (
                  <div className="op1-editor">
                    <WaveformDisplay
                      height={250}
                      onMarkerPlace={(time) => {
                        console.log('Marker placed at:', time);
                      }}
                    />
                    <MarkerSystem
                      duration={audioBuffer.length / audioBuffer.sampleRate}
                      currentTime={currentTime}
                      onMarkersChange={(newMarkers) => setMarkers(newMarkers)}
                    />
                  </div>
                ) : (
                  <div className="ep133-editor">
                    <p>EP-133 Pattern Editor coming soon...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
