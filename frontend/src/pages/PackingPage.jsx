import React, { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/backend';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default function PackingPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [packing, setPacking] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/packing`);
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Failed to load packing queue.');
      setRows(body.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load packing queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openDetail(row) {
    setActionError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/packing/${row.salesOrderId}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Failed to load packing detail.');
      setSelected(body.data);
    } catch (err) {
      setActionError(err.message || 'Failed to load packing detail.');
    }
  }

  async function packOrder() {
    if (!selected || packing) return;
    if (!window.confirm(`Pack Sales Order ${selected.salesOrderNumber}?`)) return;
    setPacking(true);
    setActionError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/packing/${selected.salesOrderId}/pack`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Failed to pack sales order.');
      setSelected(null);
      await load();
    } catch (err) {
      setActionError(err.message || 'Failed to pack sales order.');
    } finally {
      setPacking(false);
    }
  }

  return <section className="page-section">
    <div className="page-header"><div><p className="eyebrow">FULFILLMENT</p><h1>Packing</h1><p className="page-description">Sales orders ready for packing after all active work orders are completed.</p></div><button className="button button-secondary" type="button" onClick={load} disabled={loading}>Refresh</button></div>
    {error && <div className="alert alert-error"><span>{error}</span><button className="button button-secondary" type="button" onClick={load}>Retry</button></div>}
    {loading ? <div className="state-card">Loading packing queue…</div> : rows.length === 0 ? <div className="state-card"><strong>No sales orders ready for packing.</strong><span>Completed production orders will appear here.</span></div> : <div className="table-card"><table><thead><tr><th>SO Number</th><th>Customer</th><th>Order Date</th><th>Deadline</th><th>Priority</th><th>Status</th><th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.salesOrderId} onClick={() => openDetail(row)}><td><strong>{row.salesOrderNumber}</strong></td><td>{row.customerName || 'Marketplace'}</td><td>{formatDate(row.orderDate)}</td><td>{formatDate(row.deadline)}</td><td>{String(row.priority || '').replaceAll('_', ' ')}</td><td><span className="status-pill status-ready">PACKING</span></td><td><button className="button button-secondary button-small" type="button" onClick={(event) => { event.stopPropagation(); openDetail(row); }}>View</button></td></tr>)}</tbody></table></div>}
    {selected && <div className="drawer-backdrop" onClick={() => setSelected(null)}><aside className="drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><p className="eyebrow">PACKING DETAIL</p><h2>{selected.salesOrderNumber}</h2></div><button className="icon-button" type="button" onClick={() => setSelected(null)} aria-label="Close">×</button></div>{actionError && <div className="alert alert-error"><span>{actionError}</span></div>}<div className="drawer-body"><div className="detail-grid"><div><span>Customer</span><strong>{selected.customerName || 'Marketplace'}</strong></div><div><span>Order Type</span><strong>{selected.orderType || '—'}</strong></div><div><span>Priority</span><strong>{selected.priority || '—'}</strong></div><div><span>Order Date</span><strong>{formatDate(selected.orderDate)}</strong></div><div><span>Deadline</span><strong>{formatDate(selected.deadline)}</strong></div><div><span>Items</span><strong>{selected.items?.length ?? 0}</strong></div></div><div className="detail-section"><h3>Items</h3>{(selected.items || []).map((item) => <div className="detail-row" key={item.id}><div><strong>{item.productName || 'Product'}</strong><span>Qty {item.quantity}</span></div><span>{item.status}</span></div>)}</div><div className="detail-section"><h3>Work Orders</h3>{(selected.workOrders || []).map((wo) => <div className="detail-row" key={wo.id}><div><strong>{wo.woNumber}</strong><span>{wo.status}</span></div></div>)}</div></div><div className="drawer-footer"><button className="button button-secondary" type="button" onClick={() => setSelected(null)}>Close</button><button className="button button-primary" type="button" onClick={packOrder} disabled={packing}>{packing ? 'Packing…' : 'Pack'}</button></div></aside></div>}
  </section>;
}
