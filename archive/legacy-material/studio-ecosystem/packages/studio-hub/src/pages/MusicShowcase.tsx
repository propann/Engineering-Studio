/**
 * Music Production Showcase
 * Shows REAL musical workflows, not just features
 */

export function MusicShowcase() {
  return (
    <section className="music-showcase">
      {/* === HEADER === */}
      <div className="showcase-header">
        <h2>Make Music, Not Features</h2>
        <p>Two machines. One creative flow. Infinite possibilities.</p>
      </div>

      {/* === OP-1 WORKFLOW === */}
      <div className="workflow-section op1-workflow">
        <div className="workflow-content">
          <div className="workflow-visual">
            <div className="workflow-grid">
              <div className="workflow-step step-1">
                <div className="step-icon">🎚️</div>
                <div className="step-label">Tweak</div>
                <p>Create unique sounds with FM synthesis</p>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step step-2">
                <div className="step-icon">🎙️</div>
                <div className="step-label">Record</div>
                <p>Capture 4-track tape recordings</p>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step step-3">
                <div className="step-icon">✨</div>
                <div className="step-label">Edit</div>
                <p>Refine your tracks in Studio</p>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step step-4">
                <div className="step-icon">🎵</div>
                <div className="step-label">Share</div>
                <p>Export your masterpiece</p>
              </div>
            </div>
          </div>

          <div className="workflow-info">
            <h3>🎛️ OP-1: Creative Laboratory</h3>
            <p className="workflow-description">
              The OP-1 is where ideas become sounds. Design unique synth patches, record 4-track compositions, and sculpt audio in ways only hardware can.
            </p>

            <div className="capabilities">
              <div className="capability">
                <span className="cap-icon">🎹</span>
                <div>
                  <strong>Synthesis Engine</strong>
                  <p>FM, Wavetable, VOX, Drums + more</p>
                </div>
              </div>
              <div className="capability">
                <span className="cap-icon">🎚️</span>
                <div>
                  <strong>Tape Emulation</strong>
                  <p>4-track recording with tape warmth</p>
                </div>
              </div>
              <div className="capability">
                <span className="cap-icon">🎯</span>
                <div>
                  <strong>Effects</strong>
                  <p>Reverb, Delay, Distortion, Compression</p>
                </div>
              </div>
              <div className="capability">
                <span className="cap-icon">🔊</span>
                <div>
                  <strong>Master</strong>
                  <p>High-quality audio output & MIDI control</p>
                </div>
              </div>
            </div>

            <div className="use-cases">
              <h4>Perfect For:</h4>
              <ul>
                <li>🎼 Composing complete tracks</li>
                <li>🎸 Sound design & exploration</li>
                <li>📻 Podcast & ambient production</li>
                <li>🎓 Learning synthesis basics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* === EP-133 WORKFLOW === */}
      <div className="workflow-section ep133-workflow">
        <div className="workflow-content reverse">
          <div className="workflow-info">
            <h3>🥁 EP-133: Finger Drumming Master</h3>
            <p className="workflow-description">
              The EP-133 is where rhythm lives. 16 pads, 9 machines, infinite patterns. Feel the beat, not the computer.
            </p>

            <div className="capabilities">
              <div className="capability">
                <span className="cap-icon">🎯</span>
                <div>
                  <strong>16-Pad Grid</strong>
                  <p>A-D groups, 12 pads per group</p>
                </div>
              </div>
              <div className="capability">
                <span className="cap-icon">🥁</span>
                <div>
                  <strong>9 Drum Machines</strong>
                  <p>909, 808, Perc, Synth + more</p>
                </div>
              </div>
              <div className="capability">
                <span className="cap-icon">🎛️</span>
                <div>
                  <strong>Pattern Sequencer</strong>
                  <p>Multi-measure patterns, tempo control</p>
                </div>
              </div>
              <div className="capability">
                <span className="cap-icon">🎵</span>
                <div>
                  <strong>Song Mode</strong>
                  <p>Arrange scenes into full compositions</p>
                </div>
              </div>
            </div>

            <div className="use-cases">
              <h4>Perfect For:</h4>
              <ul>
                <li>🎊 Live finger drumming performances</li>
                <li>🏃 Real-time beat making</li>
                <li>🔥 DJ sets & electronic production</li>
                <li>🎓 Rhythm training & pattern practice</li>
              </ul>
            </div>
          </div>

          <div className="workflow-visual">
            <div className="workflow-grid">
              <div className="workflow-step step-1">
                <div className="step-icon">🥁</div>
                <div className="step-label">Feel</div>
                <p>16 pads, 9 drum machines</p>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step step-2">
                <div className="step-icon">🎛️</div>
                <div className="step-label">Pattern</div>
                <p>Create multi-measure sequences</p>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step step-3">
                <div className="step-icon">🎼</div>
                <div className="step-label">Arrange</div>
                <p>Build songs from patterns</p>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step step-4">
                <div className="step-icon">🎶</div>
                <div className="step-label">Perform</div>
                <p>Live finger drumming magic</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === COMPARISON TABLE === */}
      <div className="comparison-section">
        <h2>Choose Your Path</h2>

        <div className="comparison-table">
          <table>
            <thead>
              <tr>
                <th>Aspect</th>
                <th className="op1-col">🎛️ OP-1</th>
                <th className="ep133-col">🥁 EP-133</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="aspect">Primary Focus</td>
                <td className="op1-cell">Sound Design & Recording</td>
                <td className="ep133-cell">Rhythm & Performance</td>
              </tr>
              <tr>
                <td className="aspect">Best For</td>
                <td className="op1-cell">Synth heads, composers</td>
                <td className="ep133-cell">Drummers, beat makers</td>
              </tr>
              <tr>
                <td className="aspect">Main Interface</td>
                <td className="op1-cell">Knobs + Keys</td>
                <td className="ep133-cell">16 Pads</td>
              </tr>
              <tr>
                <td className="aspect">Audio In/Out</td>
                <td className="op1-cell">Full stereo in/out</td>
                <td className="ep133-cell">Synth-level control</td>
              </tr>
              <tr>
                <td className="aspect">Learning Curve</td>
                <td className="op1-cell">Beginner-friendly</td>
                <td className="ep133-cell">Intuitive pads</td>
              </tr>
              <tr>
                <td className="aspect">Portability</td>
                <td className="op1-cell">Ultra-portable (240g)</td>
                <td className="ep133-cell">Compact (600g)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* === SUCCESS STORIES === */}
      <div className="success-stories">
        <h2>What Artists Create</h2>

        <div className="stories-grid">
          <div className="story op1">
            <div className="story-icon">🎼</div>
            <h4>Ambient Composer</h4>
            <p>Creates entire albums on OP-1. Pads, textures, complete tracks in the pocket.</p>
            <div className="story-stat">+1000 tracks created</div>
          </div>

          <div className="story ep133">
            <div className="story-icon">🎤</div>
            <h4>Live Performer</h4>
            <p>Finger drums live sets on EP-133. Instant patterns, dynamic arrangements, crowd energy.</p>
            <div className="story-stat">+500 live shows</div>
          </div>

          <div className="story both">
            <div className="story-icon">🚀</div>
            <h4>Producer</h4>
            <p>Uses both machines. EP-133 for beats, OP-1 for synths. Complete workflow in Studio.</p>
            <div className="story-stat">+50 albums released</div>
          </div>
        </div>
      </div>

      <style>{`
        .music-showcase {
          padding: 3rem 0;
          position: relative;
          z-index: 1;
        }

        .showcase-header {
          text-align: center;
          padding: 4rem 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .showcase-header h2 {
          font-size: 3rem;
          background: linear-gradient(135deg, #667eea, #f5576c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
        }

        .showcase-header p {
          font-size: 1.3rem;
          color: #aaa;
        }

        /* === WORKFLOW SECTIONS === */
        .workflow-section {
          padding: 4rem 2rem;
          max-width: 1400px;
          margin: 2rem auto;
        }

        .op1-workflow {
          background: rgba(102, 126, 234, 0.05);
          border-left: 4px solid #667eea;
        }

        .ep133-workflow {
          background: rgba(245, 87, 108, 0.05);
          border-left: 4px solid #f5576c;
        }

        .workflow-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
        }

        .workflow-content.reverse {
          direction: rtl;
        }

        .workflow-content.reverse > * {
          direction: ltr;
        }

        .workflow-visual {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .workflow-grid {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
        }

        .workflow-step {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          min-width: 120px;
          transition: all 0.3s ease;
        }

        .workflow-step:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
        }

        .step-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .step-label {
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: 0.3rem;
        }

        .workflow-step p {
          font-size: 0.85rem;
          color: #aaa;
        }

        .workflow-arrow {
          font-size: 1.5rem;
          color: #667eea;
          font-weight: bold;
        }

        .workflow-info h3 {
          font-size: 2rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .workflow-info h3.ep133 {
          background: linear-gradient(135deg, #f5576c, #ffa751);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .workflow-description {
          font-size: 1.1rem;
          color: #ccc;
          line-height: 1.8;
          margin-bottom: 2rem;
        }

        .capabilities {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .capability {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .cap-icon {
          font-size: 1.5rem;
          min-width: 30px;
        }

        .capability strong {
          display: block;
          margin-bottom: 0.2rem;
        }

        .capability p {
          font-size: 0.9rem;
          color: #aaa;
        }

        .use-cases {
          background: rgba(102, 126, 234, 0.1);
          border-left: 3px solid #667eea;
          padding: 1.5rem;
          border-radius: 8px;
        }

        .ep133-workflow .use-cases {
          background: rgba(245, 87, 108, 0.1);
          border-left-color: #f5576c;
        }

        .use-cases h4 {
          margin-bottom: 0.8rem;
        }

        .use-cases ul {
          list-style: none;
          columns: 2;
          gap: 1rem;
        }

        .use-cases li {
          margin-bottom: 0.5rem;
          color: #ccc;
        }

        /* === COMPARISON TABLE === */
        .comparison-section {
          padding: 4rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .comparison-section h2 {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 3rem;
          background: linear-gradient(135deg, #667eea, #f5576c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .comparison-table {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
        }

        th {
          background: rgba(255, 255, 255, 0.1);
          padding: 1.2rem;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }

        .op1-col {
          color: #667eea;
        }

        .ep133-col {
          color: #f5576c;
        }

        td {
          padding: 1.2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .aspect {
          font-weight: 600;
          color: #ddd;
        }

        .op1-cell {
          color: #aaa;
        }

        .ep133-cell {
          color: #aaa;
        }

        /* === SUCCESS STORIES === */
        .success-stories {
          padding: 4rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .success-stories h2 {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 3rem;
          background: linear-gradient(135deg, #667eea, #f5576c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .story {
          padding: 2rem;
          border-radius: 12px;
          text-align: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .story:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .story.op1 {
          border-left: 3px solid #667eea;
        }

        .story.ep133 {
          border-left: 3px solid #f5576c;
        }

        .story.both {
          border-left: 3px solid #4facfe;
        }

        .story-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .story h4 {
          font-size: 1.3rem;
          margin-bottom: 0.8rem;
        }

        .story p {
          color: #aaa;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .story-stat {
          font-size: 0.95rem;
          color: #667eea;
          font-weight: 600;
        }

        .story.ep133 .story-stat {
          color: #f5576c;
        }

        .story.both .story-stat {
          color: #4facfe;
        }

        /* === RESPONSIVE === */
        @media (max-width: 1024px) {
          .workflow-content {
            grid-template-columns: 1fr;
          }

          .workflow-content.reverse {
            direction: ltr;
          }

          .capabilities {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .showcase-header h2 {
            font-size: 2rem;
          }

          .workflow-info h3 {
            font-size: 1.5rem;
          }

          .workflow-grid {
            flex-direction: column;
          }

          .workflow-arrow {
            transform: rotate(90deg);
          }

          table {
            font-size: 0.9rem;
          }

          td, th {
            padding: 0.8rem;
          }
        }
      `}</style>
    </section>
  );
}
