import React, { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/backend';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

const statusLabel = (status) => String(status || '').replaceAll('_', ' ');

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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setActionError(err.message || 'Failed to load packing detail.');
    }
  }

  async function packOrder() {
    if (!selected || packing) return;
    if (!window.confirm(`Pack Sales Order ${selected.soNumber}?`)) return;
    setPacking(true);
    setActionError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/packing/${selected.id}/pack`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
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

  const activeItems = useMemo(() => selected?.items?.filter((item) => item.status === 'ACTIVE') || [], [selected]);
  const activeWorkOrders = useMemo(() => selected?.workOrders?.filter((wo) => wo.status !== 'INACTIVE') || [], [selected]);
  const productionReady = activeItems.length > 0 && activeItems.every((item) => {
    const wo = activeWorkOrders.find((entry) => entry.salesOrderItemId === item.id);
    return wo?.status === 'COMPLETED_PRODUCTION';
  });

  if (selected) return <section className="page-section">
    <div className="page-header">
      <div>
        <p className="eyebrow">FULFILLMENT / PACKING</p>
        <h1>{selected.soNumber}</h1>
        <p className="page-description">Recheck all active items and work orders before packing.</p>
      </div>
      <div className="page-actions">
        <button className="button secondary" type="button" onClick={() => setSelected(null)}>Back</button>
        <button className="button secondary" type="button" onClick={() => window.print()}>Print</button>
        <button className="button primary" type="button" onClick={packOrder} disabled={packing || !productionReady}>{packing ? 'Packing...' : 'Pack Order'}</button>
      </div>
    </div>

    {actionError && <div className="error-banner"><span>{actionError}</span></div>}

    <div className="detail-card-grid">
      <section className="detail-card">
        <h2>Order Info</h2>
        <div className="detail-grid">
          <div><span>Customer</span><strong>{selected.customerName || 'Marketplace'}</strong></div>
          <div><span>Order Type</span><strong>{selected.orderType || '—'}</strong></div>
          <div><span>Order Date</span><strong>{formatDate(selected.orderDate)}</strong></div>
          <div><span>Deadline</span><strong>{formatDate(selected.deadline)}</strong></div>
          <div><span>Priority</span><strong>{statusLabel(selected.priority) || '—'}</strong></div>
          <div><span>Status</span><strong>{statusLabel(selected.status)}</strong></div>
        </div>
      </section>

      <section className="detail-card">
        <h2>Packing Gate</h2>
        <div className="detail-grid">
          <div><span>Active Items</span><strong>{activeItems.length}</strong></div>
          <div><span>Active Work Orders</span><strong>{activeWorkOrders.length}</strong></div>
          <div><span>Production</span><strong>{productionReady ? 'READY TO PACK' : 'NOT READY'}</strong></div>
          <div><span>Packing Status</span><strong>{statusLabel(selected.packingStatus || 'PENDING')}</strong></div>
        </div>
      </section>
    </div>

    <section className="detail-card">
      <div className="section-heading"><h2>Items</h2><span>{activeItems.length} active item{activeItems.length === 1 ? '' : 's'}</span></div>
      {activeItems.length === 0 ? <div className="state-card">No active sales order items.</div> : <div className="table-wrap"><table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Specification</th><th>Production</th></tr></thead><tbody>{activeItems.map((item) => { const wo = activeWorkOrders.find((entry) => entry.salesOrderItemId === item.id); return <tr key={item.id}><td>{item.itemNumber}</td><td><strong>{item.productName || 'Product'}</strong><span>{item.sku || ''}</span></td><td>{item.quantity} {item.productUnit || ''}</td><td>{[item.material, item.dimension, item.color, item.thickness].filter(Boolean).join(' · ') || item.specification || '—'}</td><td><span className="status-pill status-ready">{statusLabel(wo?.status || 'MISSING WO')}</span></td></tr>; })}</tbody></table></div>}
    </section>

    <section className="detail-card">
      <div className="section-heading"><h2>Work Orders</h2><span>{activeWorkOrders.length} active WO</span></div>
      {activeWorkOrders.length === 0 ? <div className="state-card">No active work orders.</div> : <div className="table-wrap"><table><thead><tr><th>WO</th><th>SO Item</th><th>Product</th><th>Qty</th><th>Status</th><th>Completed</th></tr></thead><tbody>{activeWorkOrders.map((wo) => <tr key={wo.id}><td><strong>{wo.woNumber}</strong></td><td>{wo.salesOrderItemId || '—'}</td><td>{wo.snapshotProductName || '—'}</td><td>{wo.snapshotQuantity ?? '—'}</td><td><span className="status-pill status-ready">{statusLabel(wo.status)}</span></td><td>{formatDate(wo.completedAt)}</td></tr>)}</tbody></table></div>}
    </section>

    <div className="page-actions">
      <button className="button secondary" type="button" onClick={() => setSelected(null)}>Back to Packing Queue</button>
      <button className="button primary" type="button" onClick={packOrder} disabled={packing || !productionReady}>{packing ? 'Packing...' : 'Pack Order'}</button>
    </div>
  </section>;

  return <section className="page-section">
    <div className="page-header"><div><p className="eyebrow">FULFILLMENT</p><h1>Packing</h1><p className="page-description">Sales orders ready for packing after all active work orders are completed.</p></div><button className="button secondary" type="button" onClick={load} disabled={loading}>Refresh</button></div>
    {error && <div className="error-banner"><span>{error}</span><button type="button" onClick={load}>Retry</button></div>}
    {loading ? <div className="state-card">Loading packing queue...</div> : rows.length === 0 ? <div className="state-card"><strong>No sales orders ready for packing.</strong><span>Orders appear here when every active Work Order reaches Completed Production.</span></div> : <div className="table-card"><table><thead><tr><th>SO Number</th><th>Customer</th><th>Order Date</th><th>Deadline</th><th>Priority</th><th>Status</th><th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.salesOrderId} onClick={() => openDetail(row)}><td><strong>{row.salesOrderNumber}</strong></td><td>{row.customerName || 'Marketplace'}</td><td>{formatDate(row.orderDate)}</td><td>{formatDate(row.deadline)}</td><td>{statusLabel(row.priority)}</td><td><span className="status-pill status-ready">PACKING</span></td><td><button className="button secondary small" type="button" onClick={(event) => { event.stopPropagation(); openDetail(row); }}>View</button></td></tr>)}</tbody></table></div>}
  </section>;
}
