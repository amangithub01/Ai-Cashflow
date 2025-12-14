const formatCurrency = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });

const txForm = document.getElementById('txForm');
const txRows = document.getElementById('txRows');
const emptyState = document.getElementById('emptyState');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const netCashFlowEl = document.getElementById('netCashFlow');
const analyzeBtn = document.getElementById('analyzeBtn');
const refreshBtn = document.getElementById('refreshBtn');
const analysisContent = document.getElementById('analysisContent');
const analysisStatus = document.getElementById('analysisStatus');
const horizonInput = document.getElementById('horizon');

async function fetchJSON(url, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error || errorData.details || res.statusText;
    const error = new Error(message);
    error.response = res;
    error.errorData = errorData;
    throw error;
  }
  return res.json();
}

async function loadSummary() {
  const data = await fetchJSON('/api/summary');
  totalIncomeEl.textContent = formatCurrency(data.totalIncome);
  totalExpenseEl.textContent = formatCurrency(data.totalExpense);
  netCashFlowEl.textContent = formatCurrency(data.netCashFlow);
}

async function loadTransactions() {
  const data = await fetchJSON('/api/transactions');
  txRows.innerHTML = '';

  if (!data.transactions.length) {
    emptyState.classList.add('show');
    return;
  }

  emptyState.classList.remove('show');

  data.transactions.forEach((tx) => {
    const row = document.createElement('div');
    row.className = 'table-row';
    row.innerHTML = `
      <span>${tx.date || '-'}</span>
      <span><span class="badge ${tx.type}">${tx.type}</span></span>
      <span>${tx.description || '-'}</span>
      <span class="right">${formatCurrency(tx.amount)}</span>
      <span class="right"><button class="ghost" data-id="${tx.id}">Delete</button></span>
    `;
    row.querySelector('button').addEventListener('click', () => deleteTransaction(tx.id));
    txRows.appendChild(row);
  });
}

async function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;
  await fetchJSON(`/api/transactions/${id}`, { method: 'DELETE' });
  await loadSummary();
  await loadTransactions();
}

txForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(txForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    await fetchJSON('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    txForm.reset();
    await loadSummary();
    await loadTransactions();
  } catch (err) {
    alert(`Unable to add transaction: ${err.message}`);
  }
});

analyzeBtn.addEventListener('click', async () => {
  const horizon = Number(horizonInput.value) || 30;
  analysisStatus.className = 'status-badge status-thinking';
  analysisStatus.innerHTML = '<span class="status-dot"></span><span>Analyzing...</span>';
  analyzeBtn.disabled = true;
  analysisContent.innerHTML = '<div class="analysis-placeholder"><div class="placeholder-icon">⏳</div><p>Analyzing your cash flow...</p></div>';

  try {
    const result = await fetchJSON('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ horizonDays: horizon }),
    });

    const { analysis } = result;
    const shortage = analysis?.shortageRisk;
    const actions = analysis?.actions || [];
    const insights = analysis?.insights || [];

    let html = '';
    
    if (analysis?.summary) {
      html += `<div style="margin-bottom: 20px;"><h3 style="margin: 0 0 8px; font-size: 16px; color: var(--text);">📊 Summary</h3><p style="margin: 0; color: var(--text-secondary);">${analysis.summary}</p></div>`;
    }
    
    if (shortage?.riskLevel) {
      const days = shortage.daysUntilShortage ?? 'n/a';
      const riskColor = shortage.riskLevel === 'High' ? 'var(--danger)' : 
                        shortage.riskLevel === 'Medium' ? 'var(--warning)' : 'var(--accent)';
      html += `<div style="margin-bottom: 20px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 10px; border-left: 4px solid ${riskColor};">
        <h3 style="margin: 0 0 8px; font-size: 16px; color: var(--text);">⚠️ Shortage Risk</h3>
        <p style="margin: 4px 0; color: var(--text-secondary);"><strong style="color: ${riskColor};">${shortage.riskLevel}</strong> risk</p>
        <p style="margin: 4px 0; color: var(--text-secondary);">Days until shortage: <strong>${days}</strong></p>
        ${shortage.reason ? `<p style="margin: 8px 0 0; color: var(--muted); font-size: 14px;">${shortage.reason}</p>` : ''}
      </div>`;
    }
    
    if (analysis?.cashRunwayDays !== undefined) {
      html += `<div style="margin-bottom: 20px;"><h3 style="margin: 0 0 8px; font-size: 16px; color: var(--text);">💰 Cash Runway</h3><p style="margin: 0; color: var(--text-secondary); font-size: 18px; font-weight: 600;">${analysis.cashRunwayDays ?? 'n/a'} days</p></div>`;
    }

    if (actions.length) {
      html += `<div style="margin-bottom: 20px;"><h3 style="margin: 0 0 12px; font-size: 16px; color: var(--text);">✅ Recommended Actions</h3><ul style="margin: 0; padding-left: 20px; color: var(--text-secondary);">`;
      actions.forEach((a) => {
        html += `<li style="margin-bottom: 8px;">${a}</li>`;
      });
      html += `</ul></div>`;
    }

    if (insights.length) {
      html += `<div><h3 style="margin: 0 0 12px; font-size: 16px; color: var(--text);">💡 Insights</h3><ul style="margin: 0; padding-left: 20px; color: var(--text-secondary);">`;
      insights.forEach((i) => {
        html += `<li style="margin-bottom: 8px;">${i}</li>`;
      });
      html += `</ul></div>`;
    }

    analysisContent.innerHTML = html || '<p style="color: var(--muted);">No analysis data available.</p>';
    analysisStatus.className = 'status-badge status-idle';
    analysisStatus.innerHTML = '<span class="status-dot"></span><span>Complete</span>';
  } catch (err) {
    let errorMsg = err.message;
    if (err.errorData?.details) {
      errorMsg += `\n\nDetails: ${err.errorData.details}`;
    }
    analysisContent.innerHTML = `<div style="padding: 20px; background: rgba(239, 68, 68, 0.1); border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.3);"><p style="margin: 0; color: var(--danger); font-weight: 600;">❌ Error</p><p style="margin: 8px 0 0; color: var(--text-secondary);">${errorMsg}</p></div>`;
    console.error('Analysis error:', err);
    analysisStatus.className = 'status-badge status-idle';
    analysisStatus.innerHTML = '<span class="status-dot"></span><span>Error</span>';
  } finally {
    analyzeBtn.disabled = false;
  }
});

refreshBtn.addEventListener('click', async () => {
  await loadSummary();
  await loadTransactions();
});

// Set today's date as default
document.getElementById('date').valueAsDate = new Date();

(async function bootstrap() {
  await loadSummary();
  await loadTransactions();
})();

