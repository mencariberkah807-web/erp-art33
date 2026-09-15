import React, { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function HandoverPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ handoverType: 'CUSTOMER_PICKUP', recipientName: '', courierName: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/handovers`);
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Failed to load handovers.');
      setRows(body.data || []);
    } catch (err) { setError(err.message || 'Failed to load handovers.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openForHandover(row) {
    setActionError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sales-orders/${row.salesOrderId}`);
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

  return <section className="page-section">
    <div className="page-header"><div><p className="eyebrow">FULFILLMENT</p><h1>Handover</h1><p className="page-description">Record customer or courier handover events for sales orders ready to ship.</p></div><button className="button button-secondary" type="button" onClick={load} disabled={loading}>Refresh</button></div>
    {error && <div className="alert alert-error"><span>{error}</span><button className="button button-secondary" type="button" onClick={load}>Retry</button></div>}
    {loading ? <div className="state-card">Loading handover history…</div> : rows.length === 0 ? <div className="state-card"><strong>No handover records yet.</strong><span>Orders at RTS can be handed over from the sales order detail.</span></div> : <div className="table-card"><table><thead><tr><th>SO Number</th><th>Type</th><th>Recipient</th><th>Courier</th><th>Handover At</th><th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.salesOrderNumber || row.salesOrderId}</strong></td><td>{row.handoverType}</td><td>{row.recipientName || '—'}</td><td>{row.courierName || '—'}</td><td>{row.handoverAt ? new Date(row.handoverAt).toLocaleString() : '—'}</td><td><button className="button button-secondary button-small" type="button" onClick={() => openForHandover(row)}>View SO</button></td></tr>)}</tbody></table></div>}
    {selected && <div className="drawer-backdrop" onClick={() => setSelected(null)}><aside className="drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><p className="eyebrow">HANDOVER</p><h2>{selected.soNumber}</h2></div><button className="icon-button" type="button" onClick={() => setSelected(null)} aria-label="Close">×</button></div>{actionError && <div className="alert alert-error"><span>{actionError}</span></div>}<div className="drawer-body"><div className="detail-grid"><div><span>Status</span><strong>{selected.status}</strong></div><div><span>Order Type</span><strong>{selected.orderType}</strong></div><div><span>Deadline</span><strong>{selected.deadline || '—'}</strong></div></div>{selected.status === 'RTS' ? <div className="detail-section"><h3>Record Handover</h3><label>Handover Type<select value={form.handoverType} onChange={(event) => setForm({ ...form, handoverType: event.target.value })}><option value="CUSTOMER_PICKUP">Customer Pickup</option><option value="COURIER">Courier</option></select></label>{form.handoverType === 'CUSTOMER_PICKUP' ? <label>Recipient Name<input value={form.recipientName} onChange={(event) => setForm({ ...form, recipientName: event.target.value })} placeholder="Recipient name" /></label> : <label>Courier Name<input value={form.courierName} onChange={(event) => setForm({ ...form, courierName: event.target.value })} placeholder="Courier name" /></label>}<label>Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows="3" /></label></div> : <div className="state-card"><strong>Handover already recorded.</strong><span>Final completion is available only after the handover event and payment are satisfied.</span></div>}</div><div className="drawer-footer"><button className="button button-secondary" type="button" onClick={() => setSelected(null)}>Close</button>{selected.status === 'RTS' && <button className="button button-primary" type="button" onClick={submitHandover} disabled={saving}>{saving ? 'Recording…' : 'Record Handover'}</button>}</div></aside></div>}
  </section>;
}
