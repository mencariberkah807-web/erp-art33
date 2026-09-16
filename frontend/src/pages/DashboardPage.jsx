import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/backend';
const EMPTY = { summary: { totalSO: 0, draft: 0, dpPaid: 0, readyWO: 0, delivered: 0 }, production: { ready: 0, inProduction: 0, completed: 0 }, fulfillment: { packing: 0, rts: 0 }, recentSalesOrders: [] };
const money = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));
const statusLabel = (value) => String(value || '').replaceAll('_', ' ');

export default function DashboardPage({ onSelectSalesOrder }) {
  const [dashboard, setDashboard] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to load dashboard.');
      setDashboard(payload.data || EMPTY);
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const cards = [
    ['Total SO', dashboard.summary.totalSO], ['Draft', dashboard.summary.draft],
    ['DP Paid', dashboard.summary.dpPaid], ['Ready WO', dashboard.summary.readyWO],
    ['Delivered', dashboard.summary.delivered],
  ];

  return <section className="page-content dashboard-page">
    <div className="page-header"><div><p className="eyebrow">CORE</p><h1>Dashboard</h1><p className="page-description">Operational overview of Sales Orders, Production, and Fulfillment.</p></div><button className="secondary-button" type="button" onClick={loadDashboard}>Refresh</button></div>
    {error && <div className="error-banner"><span>{error}</span><button type="button" onClick={loadDashboard}>Retry</button></div>}
    {loading ? <div className="table-card"><div className="state-panel"><strong>Loading dashboard…</strong><span>Reading current ERP operational data.</span></div></div> : <>
      <div className="kpi-grid">{cards.map(([label, value]) => <div className="kpi-card" key={label}><span>{label}</span><strong>{money(value)}</strong></div>)}</div>
      <div className="dashboard-grid">
        <section className="dashboard-card"><div className="section-heading"><div><h2>Production Queue</h2><p>Active Work Orders by production status.</p></div></div><div className="metric-list"><div><span>Ready Production</span><strong>{money(dashboard.production.ready)}</strong></div><div><span>In Production</span><strong>{money(dashboard.production.inProduction)}</strong></div><div><span>Completed Production</span><strong>{money(dashboard.production.completed)}</strong></div></div></section>
        <section className="dashboard-card"><div className="section-heading"><div><h2>Fulfillment Queue</h2><p>Sales Orders awaiting packing or handover.</p></div></div><div className="metric-list"><div><span>Packing</span><strong>{money(dashboard.fulfillment.packing)}</strong></div><div><span>RTS</span><strong>{money(dashboard.fulfillment.rts)}</strong></div></div></section>
      </div>
      <section className="dashboard-card recent-card"><div className="section-heading"><div><h2>Recent Sales Orders</h2><p>Latest transaction activity.</p></div></div><div className="table-card"><table><thead><tr><th>SO Number</th><th>Date</th><th>Customer</th><th>Type</th><th>Status</th></tr></thead><tbody>{dashboard.recentSalesOrders.length === 0 ? <tr><td colSpan="5">No sales orders yet.</td></tr> : dashboard.recentSalesOrders.map((order) => <tr className="clickable-row" key={order.id} onClick={() => onSelectSalesOrder?.(order.id)}><td><strong>{order.soNumber}</strong></td><td>{order.orderDate || '—'}</td><td>{order.customerName || 'Marketplace'}</td><td>{order.orderType}</td><td><span className="status-pill">{statusLabel(order.status)}</span></td></tr>)}</tbody></table></div></section>
    </>}
  </section>;
}
