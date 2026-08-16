import { useState } from 'react';
import { MusicShowcase } from './MusicShowcase';

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content fade-in">
          <div className="logo-section">
            <div className="logo">🎛️</div>
            <h1>STUDIO COLLECTION</h1>
            <p className="subtitle">Companion Apps for TE Machines</p>
          </div>

          <p className="hero-text">
            Your complete creative companion for <strong>OP-1</strong> and <strong>EP-133</strong>
          </p>

          <button className="cta-button" onClick={onEnter}>
            Get Started →
          </button>
        </div>

        {/* Animated background */}
        <div className="hero-bg">
          <div className="bg-blob blob-1"></div>
          <div className="bg-blob blob-2"></div>
          <div className="bg-blob blob-3"></div>
        </div>
      </section>

      {/* Music Showcase */}
      <MusicShowcase />

      {/* Features Section */}
      <section className="features">
        <h2>What You Can Do</h2>

        <div className="features-grid">
          {/* OP-1 */}
          <div
            className="feature-card op1"
            onMouseEnter={() => setHovered('op1')}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="feature-icon">🎛️</div>
            <h3>OP-1 Original</h3>
            <p className="machine-type">Synthesizer & Tape Recorder</p>

            {hovered === 'op1' ? (
              <ul className="feature-list">
                <li>🎵 Firmware Inspection</li>
                <li>🎚️ Sound Library Management</li>
                <li>💾 Device Backups</li>
                <li>⌨️ Keyboard Configuration</li>
                <li>🎹 Training Exercises</li>
              </ul>
            ) : (
              <p className="feature-description">
                Complete companion for your OP-1. Manage sounds, inspect firmware, and learn.
              </p>
            )}
          </div>

          {/* EP-133 */}
          <div
            className="feature-card ep133"
            onMouseEnter={() => setHovered('ep133')}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="feature-icon">🥁</div>
            <h3>EP-133 K.O. II</h3>
            <p className="machine-type">Drum Machine & Sequencer</p>

            {hovered === 'ep133' ? (
              <ul className="feature-list">
                <li>🎛️ Pattern Sequencer</li>
                <li>📊 Song Arrangement</li>
                <li>🎓 Rhythm Training (39 exercises)</li>
                <li>💾 Project Cloning</li>
                <li>🎚️ Sound Management</li>
              </ul>
            ) : (
              <p className="feature-description">
                Complete studio for your EP-133. Edit patterns, clone sounds, learn rhythm.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <h2>Why Studio Collection</h2>

        <div className="benefits-grid">
          <div className="benefit">
            <div className="benefit-icon">✨</div>
            <h4>Offline Ready</h4>
            <p>Work on your music anytime, anywhere. No internet required after initial setup.</p>
          </div>

          <div className="benefit">
            <div className="benefit-icon">🔗</div>
            <h4>Unified Identity</h4>
            <p>One player profile shared across all your TE machines. Your progress, everywhere.</p>
          </div>

          <div className="benefit">
            <div className="benefit-icon">🎨</div>
            <h4>Beautiful UI</h4>
            <p>Intuitive, modern interface designed for musicians. No learning curve.</p>
          </div>

          <div className="benefit">
            <div className="benefit-icon">🚀</div>
            <h4>Always Growing</h4>
            <p>Open source, community-driven. Features updated regularly based on user feedback.</p>
          </div>

          <div className="benefit">
            <div className="benefit-icon">🔒</div>
            <h4>100% Local</h4>
            <p>Your data stays on your device. We don't collect anything. Ever.</p>
          </div>

          <div className="benefit">
            <div className="benefit-icon">⚡</div>
            <h4>Lightning Fast</h4>
            <p>Optimized performance. Instant feedback. Seamless workflow.</p>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="testimonials">
        <h2>Made for TE Enthusiasts</h2>
        <div className="testimonial-card">
          <p className="quote">
            "Finally, a companion app that understands the OP-1 and EP-133. This changes everything about how I work."
          </p>
          <p className="author">— TE Community</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Create?</h2>
        <p>Start making music with your TE machines today</p>
        <button className="cta-button-large" onClick={onEnter}>
          Begin Your Journey →
        </button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>
          <strong>Studio Collection</strong> • Companion Apps for Teenage Engineering
        </p>
        <p className="footer-sub">Open Source • Privacy First • Community Driven</p>
      </footer>

      <style>{`
        .landing {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          color: #fff;
          font-family: system-ui, -apple-system, sans-serif;
          overflow-x: hidden;
        }

        /* === HERO SECTION === */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          position: relative;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: 0;
        }

        .bg-blob {
          position: absolute;
          border-radius: 50%;
          opacity: 0.1;
          animation: float 6s ease-in-out infinite;
        }

        .blob-1 {
          width: 300px;
          height: 300px;
          background: #667eea;
          top: -50px;
          left: -50px;
          animation-delay: 0s;
        }

        .blob-2 {
          width: 200px;
          height: 200px;
          background: #f5576c;
          bottom: 100px;
          right: -50px;
          animation-delay: 2s;
        }

        .blob-3 {
          width: 250px;
          height: 250px;
          background: #4facfe;
          top: 50%;
          right: 10%;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(20px); }
        }

        .hero-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 700px;
        }

        .fade-in {
          animation: fadeInUp 0.8s ease 0.2s both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .logo-section {
          margin-bottom: 2rem;
        }

        .logo {
          font-size: 5rem;
          margin-bottom: 1rem;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .logo-section h1 {
          font-size: 3.5rem;
          font-weight: 800;
          margin: 1rem 0;
          letter-spacing: 2px;
          background: linear-gradient(135deg, #667eea, #f5576c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          font-size: 1.3rem;
          color: #aaa;
          margin-bottom: 2rem;
        }

        .hero-text {
          font-size: 1.2rem;
          margin-bottom: 3rem;
          line-height: 1.6;
          color: #ddd;
        }

        .cta-button {
          padding: 1rem 2.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          border: none;
          border-radius: 50px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }

        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
        }

        /* === FEATURES SECTION === */
        .features {
          padding: 5rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .features h2 {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 3rem;
          background: linear-gradient(135deg, #667eea, #f5576c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          padding: 2.5rem;
          border-radius: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          cursor: pointer;
          min-height: 350px;
          display: flex;
          flex-direction: column;
        }

        .feature-card.op1 {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
          border-color: rgba(102, 126, 234, 0.3);
        }

        .feature-card.ep133 {
          background: linear-gradient(135deg, rgba(245, 87, 108, 0.2), rgba(250, 123, 92, 0.2));
          border-color: rgba(245, 87, 108, 0.3);
        }

        .feature-card:hover {
          transform: translateY(-10px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .feature-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .feature-card h3 {
          font-size: 1.8rem;
          margin-bottom: 0.3rem;
        }

        .machine-type {
          font-size: 0.95rem;
          color: #aaa;
          margin-bottom: 1.5rem;
        }

        .feature-description {
          color: #ccc;
          line-height: 1.6;
          flex-grow: 1;
        }

        .feature-list {
          list-style: none;
          color: #ccc;
          flex-grow: 1;
        }

        .feature-list li {
          padding: 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        /* === BENEFITS SECTION === */
        .benefits {
          padding: 5rem 2rem;
          background: rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 1;
        }

        .benefits h2 {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 3rem;
          background: linear-gradient(135deg, #667eea, #f5576c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .benefit {
          text-align: center;
          padding: 2rem;
        }

        .benefit-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .benefit h4 {
          font-size: 1.3rem;
          margin-bottom: 0.8rem;
        }

        .benefit p {
          color: #aaa;
          line-height: 1.6;
        }

        /* === TESTIMONIALS === */
        .testimonials {
          padding: 5rem 2rem;
          position: relative;
          z-index: 1;
        }

        .testimonials h2 {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 3rem;
          background: linear-gradient(135deg, #667eea, #f5576c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .testimonial-card {
          max-width: 600px;
          margin: 0 auto;
          padding: 3rem;
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          text-align: center;
        }

        .quote {
          font-size: 1.3rem;
          font-style: italic;
          margin-bottom: 1rem;
          line-height: 1.8;
        }

        .author {
          color: #aaa;
          font-size: 0.95rem;
        }

        /* === CTA SECTION === */
        .cta-section {
          padding: 5rem 2rem;
          text-align: center;
          background: rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 1;
        }

        .cta-section h2 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #667eea, #f5576c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cta-section p {
          font-size: 1.1rem;
          color: #aaa;
          margin-bottom: 2rem;
        }

        .cta-button-large {
          padding: 1.2rem 3rem;
          font-size: 1.2rem;
          font-weight: 700;
          border: none;
          border-radius: 50px;
          background: linear-gradient(135deg, #f5576c, #ffa751);
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(245, 87, 108, 0.4);
        }

        .cta-button-large:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(245, 87, 108, 0.6);
        }

        /* === FOOTER === */
        .footer {
          padding: 3rem 2rem;
          text-align: center;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          z-index: 1;
        }

        .footer p {
          color: #aaa;
          margin: 0.5rem 0;
        }

        .footer-sub {
          font-size: 0.9rem;
          color: #888;
        }

        /* === RESPONSIVE === */
        @media (max-width: 768px) {
          .logo-section h1 {
            font-size: 2.5rem;
          }

          .hero-text {
            font-size: 1rem;
          }

          .features h2,
          .benefits h2,
          .testimonials h2,
          .cta-section h2 {
            font-size: 2rem;
          }

          .quote {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  );
}
