import { useState } from 'react';

function Header() {
  const [horizon, setHorizon] = useState(30);

  const handleAnalyze = () => {
    // Trigger analysis via custom event with horizon value
    const event = new CustomEvent('analyze', { detail: { horizon } });
    window.dispatchEvent(event);
  };

  return (
    <header className="hero">
      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          <span>AI-Powered</span>
        </div>
        <h1>CashWise</h1>
        <p className="subtitle">Smart cash flow management for micro & small businesses</p>
      </div>
      <div className="cta">
        <div className="cta-group">
          <label htmlFor="horizon">Analysis Horizon</label>
          <div className="input-wrapper">
            <input
              id="horizon"
              type="number"
              min="7"
              max="120"
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
            />
            <span className="input-suffix">days</span>
          </div>
        </div>
        <button className="btn-primary" onClick={handleAnalyze}>
          <span className="btn-icon">✨</span>
          <span>Run AI Analysis</span>
        </button>
      </div>
    </header>
  );
}

export default Header;

