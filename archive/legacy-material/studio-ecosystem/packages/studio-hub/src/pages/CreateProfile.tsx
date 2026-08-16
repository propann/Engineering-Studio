import { useState } from 'react';
import { usePlayerProfileStore } from '../store/playerProfileStore';
import {
  pickWorkspaceFolder,
  createWorkspaceStructure,
  isFileSystemAccessAvailable,
} from '../core/storage/webFileSystem';

interface CreateProfileProps {
  onComplete: () => void;
}

export function CreateProfile({ onComplete }: CreateProfileProps) {
  const [formData, setFormData] = useState({
    name: '',
    avatar: '🎵',
    op1: { enabled: false, storage: 8 },
    ep133: { enabled: false, storage: 64 }, // 64 Mo ou 128 Mo
    folderPath: '',
    folderHandle: null as FileSystemDirectoryHandle | null,
  });

  const [step, setStep] = useState<'basic' | 'machines' | 'complete'>('basic');
  const [isCreatingFolders, setIsCreatingFolders] = useState(false);
  const [folderError, setFolderError] = useState('');
  const { updateProfile } = usePlayerProfileStore();

  const avatarOptions = ['🎵', '🎛️', '🥁', '🎸', '🎹', '🎤', '⚡', '🎭', '🌟', '🚀'];

  const handlePickFolder = async () => {
    if (!isFileSystemAccessAvailable()) {
      setFolderError('File System Access not available in your browser');
      return;
    }

    setIsCreatingFolders(true);
    setFolderError('');

    try {
      const folderHandle = await pickWorkspaceFolder();
      if (folderHandle) {
        setFormData({
          ...formData,
          folderPath: folderHandle.name || 'Workspace',
          folderHandle,
        });
      }
    } catch (error) {
      setFolderError(`Error selecting folder: ${(error as Error).message}`);
    } finally {
      setIsCreatingFolders(false);
    }
  };

  const handleCreateProfile = async () => {
    setIsCreatingFolders(true);
    setFolderError('');

    try {
      let workspace: any = {
        folderName: formData.folderPath || 'Workspace',
      };

      // Create folder structure if a folder was selected
      if (formData.folderHandle) {
        const structure = await createWorkspaceStructure(
          formData.folderHandle,
          formData.op1.enabled,
          formData.ep133.enabled,
        );
        workspace = { ...workspace, ...structure };
        console.log('✅ Workspace structure created:', workspace);
      }

      // Create the profile
      const profile = {
        id: `player-${Date.now()}`,
        name: formData.name,
        avatar: formData.avatar,
        avatarEmoji: formData.avatar,
        createdAt: new Date().toISOString(),

        ownedMachines: {
          op1: formData.op1.enabled ? { enabled: true } : undefined,
          ep133: formData.ep133.enabled ? { enabled: true } : undefined,
        },

        settings: {
          theme: 'auto' as const,
        },

        stats: {
          lastActiveAt: new Date().toISOString(),
          op1: formData.op1.enabled
            ? {
                backupsCreated: 0,
                keyboardConfigs: 0,
              }
            : undefined,
          ep133: formData.ep133.enabled
            ? {
                patternsEdited: 0,
                trainingProgress: 0,
              }
            : undefined,
        },

        workspace,
      };

      updateProfile(profile);
      setStep('complete');
    } catch (error) {
      setFolderError(`Error creating profile: ${(error as Error).message}`);
    } finally {
      setIsCreatingFolders(false);
    }
  };

  return (
    <div className="create-profile">
      {/* STEP 1: BASIC INFO */}
      {step === 'basic' && (
        <div className="profile-step fade-in">
          <h1>👤 Create Your Profile</h1>
          <p className="step-subtitle">Step 1 of 2</p>

          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              placeholder="e.g., Alex"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Choose Your Avatar</label>
            <div className="avatar-grid">
              {avatarOptions.map((emoji) => (
                <button
                  key={emoji}
                  className={`avatar-btn ${formData.avatar === emoji ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, avatar: emoji })}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={() => setStep('machines')}
            disabled={!formData.name.trim()}
          >
            Configure Machines →
          </button>
        </div>
      )}

      {/* STEP 2: MACHINES & FOLDER */}
      {step === 'machines' && (
        <div className="profile-step fade-in">
          <h1>🎛️ Configure Your Machines</h1>
          <p className="step-subtitle">Step 2 of 2</p>

          {/* WORKSPACE FOLDER */}
          <div className="form-group">
            <label>📁 Workspace Folder</label>
            <p className="folder-hint">Where to save all projects and samples</p>
            <button
              className="btn-folder"
              onClick={handlePickFolder}
              disabled={isCreatingFolders}
            >
              {isCreatingFolders ? '⏳ Selecting...' : '📁 Choose Folder'}
            </button>
            {folderError && <div className="error-message">{folderError}</div>}
            {formData.folderPath && (
              <div className="folder-path">
                ✅ {formData.folderPath}
                <span className="folder-hint" style={{ marginTop: '0.3rem' }}>
                  Sub-folders will be created automatically
                </span>
              </div>
            )}
          </div>

          {/* MACHINES GRID */}
          <div className="machines-config">
            {/* OP-1 */}
            <div className={`machine-config op1 ${formData.op1.enabled ? 'active' : ''}`}>
              <div className="machine-header">
                <div className="machine-icon">🎛️</div>
                <div className="machine-info">
                  <h3>OP-1 Original</h3>
                  <p>Synthesizer & Tape Recorder</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.op1.enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      op1: { ...formData.op1, enabled: e.target.checked },
                    })
                  }
                  className="machine-checkbox"
                />
              </div>

              {formData.op1.enabled && (
                <div className="machine-settings fade-in">
                  <div className="folders-preview">
                    <p className="preview-title">📂 Folders to create:</p>
                    <ul>
                      <li>📁 /op1/keyboard/</li>
                      <li>📁 /op1/firmware/</li>
                      <li>📁 /op1/content/</li>
                      <li>📁 /op1/mods/</li>
                      <li>📁 /op1/backups/</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* EP-133 */}
            <div className={`machine-config ep133 ${formData.ep133.enabled ? 'active' : ''}`}>
              <div className="machine-header">
                <div className="machine-icon">🥁</div>
                <div className="machine-info">
                  <h3>EP-133 K.O. II</h3>
                  <p>Drum Machine & Sequencer</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.ep133.enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ep133: { ...formData.ep133, enabled: e.target.checked },
                    })
                  }
                  className="machine-checkbox"
                />
              </div>

              {formData.ep133.enabled && (
                <div className="machine-settings fade-in">
                  <div className="setting">
                    <label>Memory Size</label>
                    <select
                      value={formData.ep133.storage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ep133: { ...formData.ep133, storage: parseInt(e.target.value) },
                        })
                      }
                      className="form-select"
                    >
                      <option value={64}>64 Mo</option>
                      <option value={128}>128 Mo</option>
                    </select>
                    <p className="setting-hint">Device memory allocation</p>
                  </div>

                  <div className="folders-preview">
                    <p className="preview-title">📂 Folders to create:</p>
                    <ul>
                      <li>📁 /ep133/clone/</li>
                      <li>📁 /ep133/samples/</li>
                      <li>📁 /ep133/library/</li>
                      <li>📁 /ep133/projects/</li>
                      <li>📁 /ep133/exercises/</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SHARED FOLDER */}
          <div className="shared-folder">
            <p>📁 /shared/</p>
            <span>MIDI patterns • Audio library • Documentation</span>
          </div>

          <div className="button-group">
            <button className="btn-secondary" onClick={() => setStep('basic')}>
              ← Back
            </button>
            <button
              className="btn-primary"
              onClick={handleCreateProfile}
              disabled={
                (!formData.op1.enabled && !formData.ep133.enabled) || isCreatingFolders
              }
            >
              {isCreatingFolders ? '⏳ Creating Folders...' : 'Create Profile →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SUMMARY */}
      {step === 'complete' && (
        <div className="profile-step fade-in">
          <div className="success-section">
            <h1>✨ Profile Ready!</h1>

            <div className="summary-card">
              <div className="summary-header">
                <span className="avatar-large">{formData.avatar}</span>
                <div>
                  <h2>{formData.name}</h2>
                  <p>Your Studio Profile</p>
                </div>
              </div>

              <div className="summary-machines">
                {formData.op1.enabled && (
                  <div className="summary-machine op1">
                    <span>🎛️ OP-1 Original</span>
                    <span className="storage">{formData.op1.storage}GB</span>
                  </div>
                )}
                {formData.ep133.enabled && (
                  <div className="summary-machine ep133">
                    <span>🥁 EP-133 K.O. II</span>
                    <span className="storage">{formData.ep133.storage}Mo</span>
                  </div>
                )}
              </div>

              <div className="summary-folder">
                <p>📁 Workspace</p>
                <code>{formData.folderPath || '(No folder selected)'}</code>
              </div>
            </div>

            <button
              className="btn-primary-large"
              onClick={handleCreateProfile}
              disabled={isCreatingFolders}
            >
              {isCreatingFolders ? '⏳ Creating Folders...' : '🚀 Let\'s Make Music!'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .create-profile {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          color: #fff;
          font-family: system-ui, -apple-system, sans-serif;
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-step {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 3rem;
          max-width: 900px;
          width: 100%;
          backdrop-filter: blur(10px);
          animation: slideUp 0.5s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fade-in {
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .step-subtitle {
          text-align: center;
          color: #aaa;
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }

        .form-group {
          margin-bottom: 2rem;
        }

        label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.8rem;
          color: #eee;
        }

        .form-input {
          width: 100%;
          padding: 0.8rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          font-family: inherit;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
        }

        .form-select {
          width: 100%;
          padding: 0.8rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          font-family: inherit;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .form-select:focus {
          outline: none;
          border-color: #f5576c;
          background: rgba(245, 87, 108, 0.1);
        }

        .form-select option {
          background: #1a1a1a;
          color: white;
        }

        .avatar-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.8rem;
        }

        .avatar-btn {
          padding: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          cursor: pointer;
          font-size: 2rem;
          transition: all 0.2s ease;
        }

        .avatar-btn:hover {
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.1);
        }

        .avatar-btn.selected {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.3);
          transform: scale(1.1);
        }

        /* FOLDER SECTION */
        .folder-hint {
          font-size: 0.9rem;
          color: #aaa;
          margin-bottom: 0.5rem;
          display: block;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.5);
          color: #ff8080;
          padding: 0.8rem;
          border-radius: 6px;
          margin: 0.5rem 0;
          font-size: 0.9rem;
        }

        .btn-folder {
          width: 100%;
          padding: 1rem;
          border: 2px dashed rgba(102, 126, 234, 0.5);
          background: rgba(102, 126, 234, 0.05);
          border-radius: 8px;
          color: #667eea;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          font-family: inherit;
          font-size: 1rem;
        }

        .btn-folder:hover:not(:disabled) {
          background: rgba(102, 126, 234, 0.15);
          border-color: #667eea;
        }

        .btn-folder:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .folder-path {
          margin-top: 0.5rem;
          padding: 0.8rem;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 6px;
          color: #667eea;
          font-size: 0.9rem;
          word-break: break-all;
        }

        /* MACHINES CONFIG */
        .machines-config {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin: 2rem 0;
        }

        .machine-config {
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .machine-config.op1 {
          background: rgba(102, 126, 234, 0.05);
          border-color: rgba(102, 126, 234, 0.3);
        }

        .machine-config.op1.active {
          background: rgba(102, 126, 234, 0.15);
          border-color: #667eea;
        }

        .machine-config.ep133 {
          background: rgba(245, 87, 108, 0.05);
          border-color: rgba(245, 87, 108, 0.3);
        }

        .machine-config.ep133.active {
          background: rgba(245, 87, 108, 0.15);
          border-color: #f5576c;
        }

        .machine-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .machine-icon {
          font-size: 2.5rem;
        }

        .machine-info h3 {
          font-size: 1.2rem;
          margin: 0;
        }

        .machine-info p {
          font-size: 0.85rem;
          color: #aaa;
          margin: 0;
        }

        .machine-checkbox {
          width: 24px;
          height: 24px;
          cursor: pointer;
          margin-left: auto;
        }

        .machine-settings {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .setting {
          margin-bottom: 1rem;
        }

        .setting label {
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .setting-hint {
          font-size: 0.85rem;
          color: #aaa;
          margin-top: 0.3rem;
        }

        .folders-preview {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .preview-title {
          font-size: 0.9rem;
          color: #aaa;
          margin-bottom: 0.5rem;
        }

        .folders-preview ul {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 0.85rem;
          color: #ccc;
        }

        .folders-preview li {
          padding: 0.3rem 0;
        }

        /* SHARED FOLDER */
        .shared-folder {
          background: rgba(100, 200, 100, 0.1);
          border: 2px solid rgba(100, 200, 100, 0.3);
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
          margin: 1.5rem 0;
        }

        .shared-folder p {
          font-weight: 600;
          margin: 0;
        }

        .shared-folder span {
          display: block;
          font-size: 0.85rem;
          color: #aaa;
          margin-top: 0.3rem;
        }

        /* BUTTONS */
        .button-group {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 1rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .btn-primary-large {
          width: 100%;
          padding: 1.5rem;
          border: none;
          border-radius: 12px;
          font-size: 1.2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #f5576c, #ffa751);
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          margin-top: 1.5rem;
        }

        .btn-primary-large:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(245, 87, 108, 0.4);
        }

        .btn-primary-large:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* SUCCESS SECTION */
        .success-section {
          text-align: center;
        }

        .summary-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 2rem;
          margin: 2rem 0;
        }

        .summary-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .avatar-large {
          font-size: 4rem;
        }

        .summary-header div {
          text-align: left;
        }

        .summary-header h2 {
          font-size: 2rem;
          margin: 0;
        }

        .summary-header p {
          color: #aaa;
          margin: 0;
        }

        .summary-machines {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .summary-machine {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-radius: 8px;
          font-weight: 600;
        }

        .summary-machine.op1 {
          background: rgba(102, 126, 234, 0.2);
          color: #667eea;
        }

        .summary-machine.ep133 {
          background: rgba(245, 87, 108, 0.2);
          color: #f5576c;
        }

        .storage {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .summary-folder {
          background: rgba(100, 200, 100, 0.1);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 2rem;
        }

        .summary-folder p {
          margin: 0 0 0.5rem 0;
          color: #aaa;
        }

        .summary-folder code {
          background: rgba(0, 0, 0, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          display: block;
          word-break: break-all;
          font-size: 0.85rem;
          color: #4ade80;
        }

        @media (max-width: 768px) {
          .machines-config {
            grid-template-columns: 1fr;
          }

          .summary-machines {
            grid-template-columns: 1fr;
          }

          .avatar-grid {
            grid-template-columns: repeat(5, 1fr);
          }

          h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
