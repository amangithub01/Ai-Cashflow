import { useState, useEffect } from 'react';

function AIInsights() {
  const [status, setStatus] = useState('idle');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [horizon, setHorizon] = useState(30);

  useEffect(() => {
    const handleAnalyze = async (event) => {
      const { horizon: h } = event.detail || { horizon: 30 };
      setHorizon(h);
      setStatus('thinking');
      setError(null);
      setAnalysis(null);

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ horizonDays: h }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || errorData.details || 'Analysis failed');
        }

        const result = await res.json();
        setAnalysis(result.analysis);
        setStatus('complete');
      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    };

    window.addEventListener('analyze', handleAnalyze);
    return () => window.removeEventListener('analyze', handleAnalyze);
  }, []);

  const renderAnalysis = () => {
    if (error) {
      return (
        <div
          style={{
            padding: '20px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <p style={{ margin: 0, color: 'var(--danger)', fontWeight: 600 }}>❌ Error</p>
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      );
    }

    if (!analysis) {
      return (
        <div className="analysis-placeholder">
          <div className="placeholder-icon">✨</div>
          <p>Click "Run AI Analysis" to get intelligent insights about your cash flow</p>
        </div>
      );
    }

    const shortage = analysis?.shortageRisk;
    const actions = analysis?.actions || [];
    const insights = analysis?.insights || [];

    return (
      <div>
        {analysis?.summary && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: 'var(--text)' }}>
              📊 Summary
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{analysis.summary}</p>
          </div>
        )}

        {shortage?.riskLevel && (
          <div
            style={{
              marginBottom: '20px',
              padding: '16px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
              borderLeft: `4px solid ${
                shortage.riskLevel === 'High'
                  ? 'var(--danger)'
                  : shortage.riskLevel === 'Medium'
                  ? 'var(--warning)'
                  : 'var(--accent)'
              }`,
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: 'var(--text)' }}>
              ⚠️ Shortage Risk
            </h3>
            <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>
              <strong
                style={{
                  color:
                    shortage.riskLevel === 'High'
                      ? 'var(--danger)'
                      : shortage.riskLevel === 'Medium'
                      ? 'var(--warning)'
                      : 'var(--accent)',
                }}
              >
                {shortage.riskLevel}
              </strong>{' '}
              risk
            </p>
            <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>
              Days until shortage: <strong>{shortage.daysUntilShortage ?? 'n/a'}</strong>
            </p>
            {shortage.reason && (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: '14px' }}>
                {shortage.reason}
              </p>
            )}
          </div>
        )}

        {analysis?.cashRunwayDays !== undefined && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: 'var(--text)' }}>
              💰 Cash Runway
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '18px', fontWeight: 600 }}>
              {analysis.cashRunwayDays ?? 'n/a'} days
            </p>
          </div>
        )}

        {actions.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: 'var(--text)' }}>
              ✅ Recommended Actions
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)' }}>
              {actions.map((action, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {insights.length > 0 && (
          <div>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: 'var(--text)' }}>
              💡 Insights
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)' }}>
              {insights.map((insight, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="card insights-card">
      <div className="card-header">
        <h2>
          <span className="icon">🤖</span>
          AI Insights
        </h2>
        <span
          className={`status-badge ${
            status === 'thinking'
              ? 'status-thinking'
              : status === 'error'
              ? 'status-error'
              : 'status-idle'
          }`}
        >
          <span className="status-dot"></span>
          <span>
            {status === 'thinking'
              ? 'Analyzing...'
              : status === 'error'
              ? 'Error'
              : status === 'complete'
              ? 'Complete'
              : 'Idle'}
          </span>
        </span>
      </div>
      <div className="analysis-content">
        {status === 'thinking' ? (
          <div className="analysis-placeholder">
            <div className="placeholder-icon">⏳</div>
            <p>Analyzing your cash flow...</p>
          </div>
        ) : (
          renderAnalysis()
        )}
      </div>
    </section>
  );
}

export default AIInsights;

