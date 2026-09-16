import React, { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/backend';
const STATUS_LABELS = { READY_FOR_PRODUCTION: 'Ready Production', IN_PRODUCTION: 'In Production', COMPLETED_PRODUCTION: 'Completed Production', INACTIVE: 'Inactive' };

export default function WorkOrdersPage({ onSelectWorkOrder }) {
  const [rows, setRows] = useState([]); const [meta, setMeta] = useState(null); const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { const params = new URLSearchParams({ page: '1', pageSize: '100' }); if (search) params.set('search', search); if (status) params.set('status', status); const response = await fetch(`${API_BASE_URL}/api/v1/work-orders?${params}`); const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || 'Unable to load work orders.'); setRows(body.data || []); setMeta(body.meta || null); } catch (e) { setError(e.message); } finally { setLoading(false); } }, [search, status]);
  useEffect(() => { load(); }, [load]);
  return <section>
    <div className="page-header"><div><p className="eyebrow">PRODUCTION</p><h1>Work Orders</h1><p>Operational queue for production execution.</p></div></div>
    <div className="toolbar"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search WO, SO, customer, product..." aria-label="Search work orders" /><select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter work order status"><option value="">All Status</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button className="button secondary" type="button" onClick={load}>Refresh</button></div>
    {error && <div className="alert error">{error}</div>}
    {loading ? <div className="state-card">Loading work orders...</div> : rows.length === 0 ? <div className="state-card">No work orders found.</div> : <div className="table-wrap"><table><thead><tr><th>WO</th><th>SO</th><th>Customer</th><th>Product</th><th>Qty</th><th>Status</th><th></th></tr></thead><tbody>{rows.map((wo) => <tr key={wo.id}><td><strong>{wo.woNumber}</strong></td><td>{wo.salesOrderNumber}</td><td>{wo.customerName || 'Marketplace'}</td><td>{wo.productName}</td><td>{wo.quantity}</td><td><span className="status-badge">{STATUS_LABELS[wo.status] || wo.status}</span></td><td><button className="button secondary small" type="button" onClick={() => onSelectWorkOrder(wo.id)}>View</button></td></tr>)}</tbody></table></div>}
    {meta && <p className="list-meta">{meta.total} work order{meta.total === 1 ? '' : 's'}</p>}
  </section>;
}
