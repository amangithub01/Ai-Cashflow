import { useState } from 'react';

function TransactionForm({ onTransactionAdded }) {
  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add transaction');
      }

      // Reset form
      setFormData({
        type: 'income',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });

      onTransactionAdded();
    } catch (err) {
      alert(`Unable to add transaction: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card form-card">
      <div className="card-title-wrapper">
        <h2>
          <span className="icon">💰</span>
          Add Transaction
        </h2>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="type">
              <span className="label-icon">📊</span>
              Type
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="income">💰 Income</option>
              <option value="expense">💸 Expense</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="amount">
              <span className="label-icon">💵</span>
              Amount
            </label>
            <div className="input-wrapper">
              <span className="input-prefix">$</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="field field-wide">
            <label htmlFor="description">
              <span className="label-icon">📝</span>
              Description
            </label>
            <input
              id="description"
              type="text"
              placeholder="e.g., Monthly rent, Invoice #123, Office supplies"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="date">
              <span className="label-icon">📅</span>
              Date
            </label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="field field-submit">
            <button type="submit" className="btn-submit" disabled={loading}>
              <span>{loading ? 'Adding...' : '+ Add Transaction'}</span>
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

export default TransactionForm;

