import React, { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/backend';
const STATUS_LABELS = { RTS: 'RTS', COMPLETED: 'Completed', INACTIVE: 'Inactive' };
function money(value) { return Number(value || 0).toLocaleString('id-ID'); }
function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default function HandoverPage() {
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ handoverType: 'CUSTOMER_PICKUP', recipientName: '', courierName: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [ordersResponse, historyResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/sales-orders?page=1&pageSize=100&status=RTS`),
        fetch(`${API_BASE_URL}/api/v1/handovers`),
      ]);
      const ordersBody = await ordersResponse.json();
      const historyBody = await historyResponse.json();
      if (!ordersResponse.ok) throw new Error(ordersBody?.error?.message || 'Failed to load RTS orders.');
      if (!historyResponse.ok) throw new Error(historyBody?.error?.message || 'Failed to load handover history.');
      setOrders(ordersBody.data || []);
      setHistory(historyBody.data || []);
    } catch (err) { setError(err.message || 'Failed to load handover data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openOrder(order) {
    setActionError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sales-orders/${order.id}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Failed to load sales order.');
      setSelected(body.data);
      setForm({ handoverType: 'CUSTOMER_PICKUP', recipientName: '', courierName: '', notes: '' });
    } catch (err) { setActionError(err.message || 'Failed to load sales order.'); }
  }

  async function submitHandover() {
    if (!selected || saving) return;
    setSaving(true); setActionError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sales-orders/${selected.id}/handovers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Failed to record handover.');
      setSelected(null); await load();
    } catch (err) { setActionError(err.message || 'Failed to record handover.'); }
    finally { setSaving(false); }
  }

  const selectedItems = selected?.items?.filter((item) => item.status !== 'INACTIVE') || [];
  const grandTotal = selectedItems.reduce((sum, item) => sum + Number(item.itemTotal || 0), 0);
  const totalPaid = selected?.orderType === 'MARKETPLACE' ? grandTotal : (selected?.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const balance = Math.max(0, grandTotal - totalPaid);

  if (selected) return <section className="page-section">
    <div className="page-header"><div><p className="eyebrow">FULFILLMENT / HANDOVER</p><h1>{selected.soNumber}</h1><p className="page-description">Recheck the sales order before recording customer or courier handover.</p></div><div className="page-actions"><button className="button secondary" type="button" onClick={() => setSelected(null)}>Back</button><button className="button secondary" type="button" onClick={() => window.print()}>Print</button></div></div>
    {actionError && <div className="error-banner"><span>{actionError}</span></div>}
    <div className="detail-card-grid"><section className="detail-card"><h2>Order Info</h2><div className="detail-grid"><div><span>Order Type</span><strong>{selected.orderType}</strong></div><div><span>Status</span><strong>{STATUS_LABELS[selected.status] || selected.status}</strong></div><div><span>Order Date</span><strong>{formatDate(selected.orderDate)}</strong></div><div><span>Deadline</span><strong>{formatDate(selected.deadline)}</strong></div><div><span>Priority</span><strong>{selected.priority || '—'}</strong></div><div><span>Customer</span><strong>{selected.customerName || 'Marketplace'}</strong></div></div></section><section className="detail-card"><h2>Payment</h2><div className="payment-summary"><div><span>Grand Total</span><strong>Rp {money(grandTotal)}</strong></div><div><span>Total Paid</span><strong>Rp {money(totalPaid)}</strong></div><div><span>Balance</span><strong>Rp {money(balance)}</strong></div><div><span>Payment Status</span><strong>{balance === 0 && grandTotal > 0 ? 'PAID' : totalPaid > 0 ? 'PARTIALLY PAID' : 'UNPAID'}</strong></div></div></section></div>
    <section className="detail-card"><div className="section-heading"><h2>Items</h2><span>{selectedItems.length} active item{selectedItems.length === 1 ? '' : 's'}</span></div><div className="table-wrap"><table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Total</th></tr></thead><tbody>{selectedItems.map((item) => <tr key={item.id}><td>{item.itemNumber}</td><td><strong>{item.productName}</strong></td><td>{item.quantity} {item.productUnit || ''}</td><td>Rp {money(item.itemTotal)}</td></tr>)}</tbody></table></div></section>
    <section className="detail-card"><h2>Record Handover</h2>{selected.status !== 'RTS' ? <div className="state-card"><strong>Handover unavailable.</strong><span>This sales order is currently {STATUS_LABELS[selected.status] || selected.status}.</span></div> : <><div className="detail-form-grid"><label>Handover Type<select value={form.handoverType} onChange={(event) => setForm({ ...form, handoverType: event.target.value })}><option value="CUSTOMER_PICKUP">Customer Pickup</option><option value="COURIER">Courier</option></select></label>{form.handoverType === 'CUSTOMER_PICKUP' ? <label>Recipient Name<input required value={form.recipientName} onChange={(event) => setForm({ ...form, recipientName: event.target.value })} placeholder="Recipient name" /></label> : <label>Courier Name<input required value={form.courierName} onChange={(event) => setForm({ ...form, courierName: event.target.value })} placeholder="Courier name" /></label>}</div><label>Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows="3" placeholder="Optional notes" /></label><div className="modal-actions"><button className="button primary" type="button" onClick={submitHandover} disabled={saving}>{saving ? 'Recording...' : 'Record Handover'}</button></div></>}</section>
  </section>;

  return <section className="page-section"><div className="page-header"><div><p className="eyebrow">FULFILLMENT</p><h1>Handover</h1><p className="page-description">Recheck RTS sales orders and record customer or courier handover.</p></div><button className="button secondary" type="button" onClick={load} disabled={loading}>Refresh</button></div>{error && <div className="error-banner"><span>{error}</span><button type="button" onClick={load}>Retry</button></div>}<section className="detail-card"><div className="section-heading"><div><h2>Ready to Handover</h2><span>Sales orders currently at RTS.</span></div><strong>{orders.length}</strong></div>{loading ? <div className="state-card">Loading RTS orders...</div> : orders.length === 0 ? <div className="state-card"><strong>No sales orders ready for handover.</strong><span>Orders become available here after production and packing reach RTS.</span></div> : <div className="table-wrap"><table><thead><tr><th>SO Number</th><th>Customer</th><th>Order Date</th><th>Deadline</th><th>Priority</th><th></th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.soNumber}</strong></td><td>{order.customerName || 'Marketplace'}</td><td>{formatDate(order.orderDate)}</td><td>{formatDate(order.deadline)}</td><td>{String(order.priority || '').replaceAll('_', ' ')}</td><td><button className="button secondary small" type="button" onClick={() => openOrder(order)}>View</button></td></tr>)}</tbody></table></div>}</section><section className="detail-card"><div className="section-heading"><div><h2>Handover History</h2><span>Recorded handover events.</span></div><strong>{history.length}</strong></div>{history.length === 0 ? <div className="state-card">No handover records yet.</div> : <div className="table-wrap"><table><thead><tr><th>SO Number</th><th>Type</th><th>Recipient</th><th>Courier</th><th>Handover At</th></tr></thead><tbody>{history.map((row) => <tr key={row.id}><td><strong>{row.salesOrderNumber || row.salesOrderId}</strong></td><td>{row.handoverType}</td><td>{row.recipientName || '—'}</td><td>{row.courierName || '—'}</td><td>{row.handoverAt ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(row.handoverAt)) : '—'}</td></tr>)}</tbody></table></div>}</section></section>;
}
