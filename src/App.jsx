import { useState, useEffect } from 'react';
import Header from './components/Header';
import TransactionForm from './components/TransactionForm';
import Summary from './components/Summary';
import Transactions from './components/Transactions';
import AIInsights from './components/AIInsights';
import Footer from './components/Footer';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netCashFlow: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/summary');
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
  }, []);

  const handleTransactionAdded = () => {
    fetchSummary();
    fetchTransactions();
  };

  const handleTransactionDeleted = () => {
    fetchSummary();
    fetchTransactions();
  };

  return (
    <div className="app">
      <Header />
      <main className="container">
        <TransactionForm onTransactionAdded={handleTransactionAdded} />
        <Summary summary={summary} />
        <Transactions
          transactions={transactions}
          onTransactionDeleted={handleTransactionDeleted}
        />
        <AIInsights />
      </main>
      <Footer />
    </div>
  );
}

export default App;

