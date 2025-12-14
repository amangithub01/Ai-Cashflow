function Summary({ summary }) {
  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    });

  return (
    <section className="card summary-card">
      <div className="card-title-wrapper">
        <h2>
          <span className="icon">📈</span>
          Cash Flow Summary
        </h2>
      </div>
      <div className="summary-grid">
        <div className="metric metric-income">
          <div className="metric-icon">📥</div>
          <div className="metric-content">
            <p className="label">Total Income</p>
            <p className="value">{formatCurrency(summary.totalIncome)}</p>
          </div>
        </div>
        <div className="metric metric-expense">
          <div className="metric-icon">📤</div>
          <div className="metric-content">
            <p className="label">Total Expenses</p>
            <p className="value">{formatCurrency(summary.totalExpense)}</p>
          </div>
        </div>
        <div className="metric metric-net">
          <div className="metric-icon">💵</div>
          <div className="metric-content">
            <p className="label">Net Cash Flow</p>
            <p className="value">{formatCurrency(summary.netCashFlow)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Summary;

