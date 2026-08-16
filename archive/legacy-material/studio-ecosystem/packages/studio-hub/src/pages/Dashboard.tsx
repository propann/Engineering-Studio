import { usePlayerProfileStore } from '../store/playerProfileStore';

export function Dashboard() {
  const { profile } = usePlayerProfileStore();

  if (!profile) {
    return <div>Loading...</div>;
  }
  return (
    <div className="dashboard">
      <nav className="nav">
        <h1>🎛️ Studio Hub</h1>
        <div className="nav-player">
          <span className="avatar">{profile.avatarEmoji}</span>
          <span>{profile.name}</span>
        </div>
      </nav>

      <div className="container">
        <div className="welcome">
          <h1>Welcome back, {profile.name}! {profile.avatarEmoji}</h1>
          <p>Your TE Studio Companion</p>
        </div>

        <div className="machines-grid">
          {profile.ownedMachines.op1?.enabled && (
            <div className="machine-card op1">
              <h2>🎛️ OP-1 Original</h2>
              <p>Synthesizer & Tape Recorder</p>
              <div className="stats">
                <div className="stat">
                  <span className="label">Backups</span>
                  <span className="value">{profile.stats.op1?.backupsCreated || 0}</span>
                </div>
                <div className="stat">
                  <span className="label">Keyboard Configs</span>
                  <span className="value">{profile.stats.op1?.keyboardConfigs || 0}</span>
                </div>
              </div>
              <button className="btn-enter" onClick={() => launchStudio('op1')}>
                Enter OP-1 →
              </button>
            </div>
          )}

          {profile.ownedMachines.ep133?.enabled && (
            <div className="machine-card ep133">
              <h2>🥁 EP-133 K.O. II</h2>
              <p>Drum Machine & Sequencer</p>
              <div className="stats">
                <div className="stat">
                  <span className="label">Patterns</span>
                  <span className="value">{profile.stats.ep133?.patternsEdited || 0}</span>
                </div>
                <div className="stat">
                  <span className="label">Training</span>
                  <span className="value">{profile.stats.ep133?.trainingProgress || 0}%</span>
                </div>
              </div>
              <button className="btn-enter" onClick={() => launchStudio('ep133')}>
                Enter EP-133 →
              </button>
            </div>
          )}
        </div>

        <div className="shared-resources">
          <h2>📚 Shared Resources</h2>
          <ul>
            <li>🎵 MIDI Patterns</li>
            <li>🎚️ Audio Library</li>
            <li>📖 Documentation</li>
          </ul>
        </div>
      </div>

      <style>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .nav {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .nav h1 {
          color: white;
          font-size: 1.5rem;
          margin: 0;
        }

        .nav-player {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: white;
          font-weight: 600;
        }

        .avatar {
          font-size: 2rem;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .welcome {
          text-align: center;
          color: white;
          margin-bottom: 3rem;
        }

        .welcome h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .welcome p {
          font-size: 1.2rem;
          opacity: 0.9;
        }

        .machines-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .machine-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }

        .machine-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .machine-card h2 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .machine-card p {
          color: #666;
          margin-bottom: 1.5rem;
        }

        .stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem 0;
          border-top: 1px solid #eee;
          border-bottom: 1px solid #eee;
        }

        .stat {
          text-align: center;
        }

        .stat .label {
          display: block;
          font-size: 0.9rem;
          color: #999;
          margin-bottom: 0.5rem;
        }

        .stat .value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #333;
        }

        .btn-enter {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .op1 .btn-enter {
          background: #667eea;
          color: white;
        }

        .op1 .btn-enter:hover {
          background: #5568d3;
        }

        .ep133 .btn-enter {
          background: #f5576c;
          color: white;
        }

        .ep133 .btn-enter:hover {
          background: #e0465d;
        }

        .shared-resources {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .shared-resources h2 {
          margin-bottom: 1rem;
          color: #333;
        }

        .shared-resources ul {
          list-style: none;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .shared-resources li {
          padding: 1rem;
          background: #f5f5f5;
          border-radius: 8px;
          color: #666;
        }
      `}</style>
    </div>
  );
}

function launchStudio(machine: 'op1' | 'ep133') {
  const profile = usePlayerProfileStore.getState().profile;
  if (profile) {
    sessionStorage.setItem('hub:playerProfile', JSON.stringify(profile));
  }

  // Pour la démo: on simule juste
  alert(`🚀 Launching ${machine}...`);
  console.log(`Launch ${machine} with profile:`, profile);
}
