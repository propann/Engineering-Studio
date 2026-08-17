/**
 * Export Button Component
 * Export audio to OP-1 or EP-133 format
 */

import React, { useState } from 'react';
import { useAudioStore } from '../../store/audioStore';
import './ExportButton.css';

export interface ExportOptions {
  filename: string;
  format: 'op1' | 'ep133' | 'wav';
  includeMetadata?: boolean;
}

interface ExportButtonProps {
  audioBuffer?: AudioBuffer;
  tags?: any;
  onExport?: (blob: Blob, filename: string) => void;
  isLoading?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  audioBuffer,
  tags,
  onExport,
  isLoading = false
}) => {
  const { audioBuffer: storeBuffer } = useAudioStore();
  const [exportDialog, setExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    filename: 'sound-export',
    format: 'op1',
    includeMetadata: true
  });

  const buffer = audioBuffer || storeBuffer;

  if (!buffer) {
    return null;
  }

  const handleExport = async () => {
    if (!buffer) return;

    setIsExporting(true);
    try {
      const blob = await encodeAudio(buffer, exportOptions.format, tags);

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportOptions.filename}.${exportOptions.format === 'op1' ? 'wav' : exportOptions.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onExport?.(blob, a.download);
      setExportDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadZip = async () => {
    // This would require a zip library
    console.log('ZIP export not yet implemented');
    alert('ZIP export coming soon!');
  };

  return (
    <div className="export-button-container">
      <button
        className="export-button"
        onClick={() => setExportDialog(!exportDialog)}
        disabled={!buffer || isLoading || isExporting}
        title="Export audio file"
      >
        {isExporting ? '⏳ Exporting...' : '📥 Export'}
      </button>

      {exportDialog && (
        <div className="export-dialog-overlay" onClick={() => setExportDialog(false)}>
          <div className="export-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="export-header">
              <h3>Export Audio</h3>
              <button
                className="export-close"
                onClick={() => setExportDialog(false)}
              >
                ✕
              </button>
            </div>

            <div className="export-body">
              {/* Format Selection */}
              <div className="export-group">
                <label>Format</label>
                <div className="format-options">
                  <label className="format-option">
                    <input
                      type="radio"
                      value="op1"
                      checked={exportOptions.format === 'op1'}
                      onChange={(e) =>
                        setExportOptions({ ...exportOptions, format: e.target.value as any })
                      }
                    />
                    <span>🎛️ OP-1 (WAV with metadata)</span>
                  </label>
                  <label className="format-option">
                    <input
                      type="radio"
                      value="ep133"
                      checked={exportOptions.format === 'ep133'}
                      onChange={(e) =>
                        setExportOptions({ ...exportOptions, format: e.target.value as any })
                      }
                    />
                    <span>🥁 EP-133 (WAV with metadata)</span>
                  </label>
                  <label className="format-option">
                    <input
                      type="radio"
                      value="wav"
                      checked={exportOptions.format === 'wav'}
                      onChange={(e) =>
                        setExportOptions({ ...exportOptions, format: e.target.value as any })
                      }
                    />
                    <span>📊 Standard WAV</span>
                  </label>
                </div>
              </div>

              {/* Filename */}
              <div className="export-group">
                <label>Filename</label>
                <input
                  type="text"
                  value={exportOptions.filename}
                  onChange={(e) =>
                    setExportOptions({ ...exportOptions, filename: e.target.value })
                  }
                  placeholder="sound-export"
                  className="export-input"
                  maxLength={50}
                />
              </div>

              {/* Metadata Options */}
              {(exportOptions.format === 'op1' || exportOptions.format === 'ep133') && (
                <div className="export-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeMetadata || false}
                      onChange={(e) =>
                        setExportOptions({
                          ...exportOptions,
                          includeMetadata: e.target.checked
                        })
                      }
                    />
                    <span>Include tags in filename</span>
                  </label>
                  {exportOptions.includeMetadata && tags && (
                    <div className="metadata-preview">
                      <p className="preview-label">Filename preview:</p>
                      <p className="preview-value">
                        {getOP1Filename(exportOptions.filename, tags)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Info */}
              <div className="export-info">
                <p className="info-item">
                  <span className="info-label">Format:</span>
                  <span className="info-value">{buffer.numberOfChannels}ch {buffer.sampleRate}Hz</span>
                </p>
                <p className="info-item">
                  <span className="info-label">Duration:</span>
                  <span className="info-value">
                    {((buffer.length / buffer.sampleRate) / 60).toFixed(2)}m
                  </span>
                </p>
                <p className="info-item">
                  <span className="info-label">Size:</span>
                  <span className="info-value">
                    {(
                      (buffer.length * buffer.numberOfChannels * 2) / 1024 / 1024
                    ).toFixed(2)}{' '}
                    MB
                  </span>
                </p>
              </div>
            </div>

            <div className="export-footer">
              <button
                className="export-btn-secondary"
                onClick={() => setExportDialog(false)}
              >
                Cancel
              </button>
              <button
                className="export-btn-primary"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? '⏳ Exporting...' : '📥 Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Encode audio to WAV format
 */
async function encodeAudio(
  audioBuffer: AudioBuffer,
  format: string,
  tags?: any
): Promise<Blob> {
  const sampleRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;
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
  view.setUint16(20, 1, true); // PCM format
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

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Generate OP-1 formatted filename with tags
 */
function getOP1Filename(baseName: string, tags: any): string {
  if (!tags) return `${baseName}.wav`;

  const parts = [baseName];

  if (tags.start !== undefined) {
    parts.push(`s${Math.round(tags.start)}`);
  }
  if (tags.end !== undefined) {
    parts.push(`e${Math.round(tags.end)}`);
  }
  if (tags.pitch !== undefined) {
    parts.push(`p${tags.pitch}`);
  }
  if (tags.loop) {
    parts.push('lyes');
  }

  return parts.join('_') + '.wav';
}
