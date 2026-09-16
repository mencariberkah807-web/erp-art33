import React, { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const money = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);

function summarize(order, detail) {
  const grandTotal = (detail?.items || []).reduce((sum, item) => sum + Number(item.itemTotal || 0), 0);
  const totalPaid = (detail?.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const balance = Math.max(0, grandTotal - totalPaid);
  const status = order.orderType === 'MARKETPLACE' ? 'PAID' : totalPaid <= 0 ? 'UNPAID' : balance <= 0 ? 'PAID' : 'PARTIALLY PAID';
  return { grandTotal, totalPaid, balance, status };
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState([]);
  const [details, setDetails] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ amount: '', paymentMethod: 'TRANSFER', paymentDate: new Date().toISOString().slice(0, 10), referenceNumber: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '20' });
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`${API_BASE_URL}/api/v1/sales-orders?${params}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to load payment records.');
      const rows = body.data || [];
      setOrders(rows);
      const entries = await Promise.all(rows.map(async (order) => {
        try {
          const detailResponse = await fetch(`${API_BASE_URL}/api/v1/sales-orders/${order.id}`);
          const detailBody = await detailResponse.json();
          return [order.id, detailResponse.ok ? detailBody.data : null];
        } catch { return [order.id, null]; }
      }));
      setDetails(Object.fromEntries(entries));
    } catch (err) { setError(err.message || 'Unable to load payment records.'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => orders.map((order) => ({ order, summary: summarize(order, details[order.id]) })), [orders, details]);

  function openPayment(row) {
    setActionError('');
    setSelected(row);
    setForm({ amount: '', paymentMethod: 'TRANSFER', paymentDate: new Date().toISOString().slice(0, 10), referenceNumber: '', notes: '' });
  }

  async function addPayment() {
    if (!selected || saving) return;
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) { setActionError('Payment amount must be greater than zero.'); return; }
    if (amount > selected.summary.balance) { setActionError('Payment amount cannot exceed the remaining balance.'); return; }
    setSaving(true); setActionError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sales-orders/${selected.order.id}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Failed to record payment.');
      setSelected(null);
      await load();
    } catch (err) { setActionError(err.message || 'Failed to record payment.'); }
    finally { setSaving(false); }
  }

  return <section className="page-section">
    <div className="page-header"><div><p className="eyebrow">FINANCE</p><h1>Payments</h1><p className="page-description">Manage direct-order payments and review the payment ledger for each sales order.</p></div><button className="primary-button" type="button" onClick={load} disabled={loading}>Refresh</button></div>
    <div className="toolbar"><input className="search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search SO number or tracking number..." /></div>
    {error && <div className="error-banner"><span>{error}</span><button type="button" onClick={load}>Retry</button></div>}
    <div className="table-card">{loading ? <div className="state-panel">Loading payments...</div> : rows.length === 0 ? <div className="state-panel"><strong>No payment records.</strong><span>Payments will appear here when sales orders are created.</span></div> : <table className="data-table"><thead><tr><th>SO Number</th><th>Type</th><th>Grand Total</th><th>Total Paid</th><th>Balance</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(({ order, summary }) => <tr key={order.id}><td><strong>{order.soNumber}</strong></td><td>{order.orderType}</td><td>{money(summary.grandTotal)}</td><td>{money(summary.totalPaid)}</td><td>{money(summary.balance)}</td><td><span className={`status-badge ${summary.status.toLowerCase().replaceAll(' ', '-')}`}>{summary.status}</span></td><td>{order.orderType === 'DIRECT' && summary.balance > 0 && order.status !== 'INACTIVE' ? <button className="button primary small" type="button" onClick={() => openPayment({ order, summary })}>Add Payment</button> : <button className="button secondary small" type="button" onClick={() => openPayment({ order, summary })}>View</button>}</td></tr>)}</tbody></table>}</div>
    {selected && <div className="drawer-backdrop" onClick={() => setSelected(null)}><aside className="drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><p className="eyebrow">PAYMENT</p><h2>{selected.order.soNumber}</h2></div><button className="icon-button" type="button" onClick={() => setSelected(null)} aria-label="Close">×</button></div>{actionError && <div className="alert alert-error"><span>{actionError}</span></div>}<div className="drawer-body"><div className="detail-grid"><div><span>Grand Total</span><strong>{money(selected.summary.grandTotal)}</strong></div><div><span>Total Paid</span><strong>{money(selected.summary.totalPaid)}</strong></div><div><span>Balance</span><strong>{money(selected.summary.balance)}</strong></div><div><span>Payment Status</span><strong>{selected.summary.status}</strong></div></div><div className="detail-section"><h3>Payment History</h3>{(details[selected.order.id]?.payments || []).length === 0 ? <div className="state-card">No payment history.</div> : <div className="history-list">{details[selected.order.id].payments.map((payment) => <div className="history-row" key={payment.id}><div><strong>{payment.paymentNumber}</strong><span>{payment.paymentMethod} · {payment.paymentDate}</span></div><strong>{money(payment.amount)}</strong></div>)}</div>}</div>{selected.order.orderType === 'DIRECT' && selected.summary.balance > 0 && selected.order.status !== 'INACTIVE' && <div className="detail-section"><h3>Add Payment</h3><label>Amount<input type="number" min="1" max={selected.summary.balance} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="Amount" /></label><label>Payment Method<select value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}><option value="CASH">Cash</option><option value="TRANSFER">Transfer</option><option value="QRIS">QRIS</option></select></label><label>Payment Date<input type="date" value={form.paymentDate} onChange={(event) => setForm({ ...form, paymentDate: event.target.value })} /></label><label>Reference Number<input value={form.referenceNumber} onChange={(event) => setForm({ ...form, referenceNumber: event.target.value })} placeholder="Optional" /></label><label>Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows="3" /></label></div>}</div><div className="drawer-footer"><button className="button secondary" type="button" onClick={() => setSelected(null)}>Close</button>{selected.order.orderType === 'DIRECT' && selected.summary.balance > 0 && selected.order.status !== 'INACTIVE' && <button className="button primary" type="button" onClick={addPayment} disabled={saving}>{saving ? 'Recording…' : 'Record Payment'}</button>}</div></aside></div>}
  </section>;
}
