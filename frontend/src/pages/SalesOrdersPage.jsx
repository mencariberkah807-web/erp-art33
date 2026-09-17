import React, { useEffect, useState } from 'react';
import SalesOrderDetailPage from './SalesOrderDetailPage.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const statuses = ['', 'NEW_ORDER', 'READY_PRODUCTION', 'IN_PRODUCTION', 'PACKING', 'RTS', 'COMPLETED', 'INACTIVE'];
function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default function SalesOrdersPage({ onNewOrder, selectedOrderId, onSelectOrder }) {
  const [orders, setOrders] = useState([]); const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0 }); const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  async function loadOrders() { setLoading(true); setError(''); try { const params = new URLSearchParams({ page: '1', pageSize: '20' }); if (search.trim()) params.set('search', search.trim()); if (status) params.set('status', status); const response = await fetch(`${API_BASE_URL}/api/v1/sales-orders?${params}`); const body = await response.json(); if (!response.ok) throw new Error(body?.error?.message || 'Unable to load sales orders.'); setOrders(body.data || []); setMeta(body.meta || { page: 1, pageSize: 20, total: 0 }); } catch (err) { setError(err.message); } finally { setLoading(false); } }
  useEffect(() => { loadOrders(); }, [search, status]);
  return <section className="sales-orders-workspace">
    <main className="sales-orders-list"><div className="page-header"><div><p className="eyebrow">SALES</p><h1>Sales Orders</h1><p className="page-description">Manage customer and marketplace orders through the approved order lifecycle.</p></div><button className="primary-button" type="button" onClick={onNewOrder}>+ New Order</button></div><div className="toolbar"><input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search SO number or tracking number..." /><select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>{statuses.map((value) => <option key={value} value={value}>{value ? value.replaceAll('_', ' ') : 'All statuses'}</option>)}</select></div>{error && <div className="error-banner"><span>{error}</span><button type="button" onClick={loadOrders}>Retry</button></div>}<div className="table-card">{loading ? <div className="state-panel">Loading sales orders...</div> : orders.length === 0 ? <div className="state-panel"><strong>No sales orders yet.</strong><span>Create the first order to begin the sales workflow.</span></div> : <table className="data-table"><thead><tr><th>SO Number</th><th>Type</th><th>Order Date</th><th>Deadline</th><th>Priority</th><th>Status</th><th></th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} onClick={() => onSelectOrder(order.id)} className={`clickable-row ${selectedOrderId === order.id ? 'selected' : ''}`}><td><strong>{order.soNumber}</strong></td><td>{order.orderType}</td><td>{formatDate(order.orderDate)}</td><td>{formatDate(order.deadline)}</td><td>{order.priority.replaceAll('_', ' ')}</td><td><span className={`status-badge ${order.status.toLowerCase()}`}>{order.status.replaceAll('_', ' ')}</span></td><td><button className="button secondary small" type="button" onClick={(e) => { e.stopPropagation(); onSelectOrder(order.id); }}>View</button></td></tr>)}</tbody></table>}</div><div className="list-footer"><span>{meta.total} total order{meta.total === 1 ? '' : 's'}</span></div></main>
    <aside className="sales-order-detail-panel">{selectedOrderId ? <SalesOrderDetailPage salesOrderId={selectedOrderId} onBack={() => onSelectOrder(null)} embedded /> : <div className="sales-order-detail-empty"><strong>Select a Sales Order</strong><span>Choose an order from the list to view its detail here.</span></div>}</aside>
  </section>;
}
