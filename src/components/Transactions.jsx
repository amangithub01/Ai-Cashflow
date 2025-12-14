import { useState } from 'react';

function Transactions({ transactions, onTransactionDeleted }) {
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    });

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete transaction');
      }

      onTransactionDeleted();
    } catch (err) {
      alert(`Unable to delete transaction: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      // Force parent to refresh
      onTransactionDeleted();
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2>
          <span className="icon">📋</span>
          Transactions
        </h2>
        <button className="btn-ghost" onClick={handleRefresh} disabled={loading}>
          <span>🔄</span>
          Refresh
        </button>
      </div>
      {transactions.length === 0 ? (
        <div className="empty-state show">
          <div className="empty-icon">📭</div>
          <p className="empty-title">No transactions yet</p>
          <p className="empty-subtitle">Add your first transaction above to get started</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="table">
            <div className="table-head">
              <span>Date</span>
              <span>Type</span>
              <span>Description</span>
              <span className="right">Amount</span>
              <span className="right">Action</span>
            </div>
            <div className="table-body">
              {transactions.map((tx) => (
                <div key={tx.id} className="table-row">
                  <span>{tx.date || '-'}</span>
                  <span>
                    <span className={`badge ${tx.type}`}>{tx.type}</span>
                  </span>
                  <span>{tx.description || '-'}</span>
                  <span className="right">{formatCurrency(tx.amount)}</span>
                  <span className="right">
                    <button
                      className="ghost"
                      onClick={() => handleDelete(tx.id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Transactions;

