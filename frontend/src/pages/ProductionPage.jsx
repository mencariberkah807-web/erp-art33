import React, { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const columns = [
  ['READY_FOR_PRODUCTION', 'Ready Production'],
  ['IN_PRODUCTION', 'In Production'],
  ['COMPLETED_PRODUCTION', 'Completed Production'],
];

export default function ProductionPage() {
  const [board, setBoard] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`${API_BASE_URL}/api/v1/production-board${params}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || 'Unable to load production board.');
      setBoard(body.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [search]);
  useEffect(() => { load(); }, [load]);

  async function transition(id, action) {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/work-orders/${id}/${action}`, { method: 'POST' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || 'Work order transition failed.');
      await load();
    } catch (e) { setError(e.message); }
  }

  return <section>
    <div className="page-header"><div><p className="eyebrow">PRODUCTION</p><h1>Production Board</h1><p>Operational view of Work Orders. Processes remain non-sequential.</p></div></div>
    <div className="toolbar"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search WO, SO, customer, product..." aria-label="Search production" /><button className="button secondary" type="button" onClick={load}>Refresh</button></div>
    {error && <div className="alert error">{error}</div>}
    {loading ? <div className="state-card">Loading production board...</div> : <div className="production-board">{columns.map(([status, label]) => <section className="production-column" key={status}><div className="production-column-header"><strong>{label}</strong><span>{board?.columns?.[status]?.length || 0}</span></div>{(board?.columns?.[status] || []).map((wo) => <article className="production-card" key={wo.id}><div className="card-topline"><strong>{wo.woNumber}</strong><span>{wo.status}</span></div><h3>{wo.productName}</h3><p>{wo.salesOrderNumber} · {wo.customerName || 'Marketplace'} · Qty {wo.quantity}</p><div className="card-actions">{status === 'READY_FOR_PRODUCTION' && <button className="button primary" type="button" onClick={() => transition(wo.id, 'start')}>Start Production</button>}{status === 'IN_PRODUCTION' && <button className="button primary" type="button" onClick={() => transition(wo.id, 'complete')}>Complete Production</button>}<button className="button secondary" type="button" onClick={() => window.alert(`WO ${wo.woNumber}`)}>View WO</button></div></article>)}</section>)}</div>}
  </section>;
}
