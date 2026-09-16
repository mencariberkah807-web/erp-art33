import React, { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/backend';
const columns = [
  ['READY_FOR_PRODUCTION', 'Ready Production'],
  ['IN_PRODUCTION', 'In Production'],
  ['COMPLETED_PRODUCTION', 'Completed Production'],
];
const statusLabels = {
  READY_FOR_PRODUCTION: 'Ready Production',
  IN_PRODUCTION: 'In Production',
  COMPLETED_PRODUCTION: 'Completed Production',
};

export default function ProductionPage() {
  const [board, setBoard] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      const response = await fetch(`${API_BASE_URL}/api/v1/production-board${params}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to load production board.');
      setBoard(body.data || { columns: {} });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function transition(id, action) {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/work-orders/${id}/${action}`, { method: 'POST' });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Work order transition failed.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const total = columns.reduce((sum, [status]) => sum + (board?.columns?.[status]?.length || 0), 0);

  return <>
    <style>{`
      .production-page { max-width: 1440px; margin: 0 auto; }
      .production-page .page-header { align-items: flex-start; margin-bottom: 22px; }
      .production-page .page-description { max-width: 720px; }
      .production-toolbar { display:flex; align-items:center; gap:10px; margin-bottom:18px; }
      .production-search { flex:1; max-width:520px; height:42px; padding:0 13px; border:1px solid #d7deea; border-radius:9px; background:#fff; color:#172033; outline:none; }
      .production-search:focus { border-color:#2476ed; box-shadow:0 0 0 3px rgba(36,118,237,.1); }
      .production-count { margin-left:auto; color:#8490a5; font-size:12px; font-weight:600; }
      .production-board { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:18px; align-items:start; }
      .production-column { min-width:0; padding:14px; border:1px solid #e0e6ef; border-radius:14px; background:#eef2f7; }
      .production-column-header { display:flex; align-items:center; justify-content:space-between; padding:3px 3px 13px; }
      .production-column-header strong { color:#172033; font-size:13px; }
      .production-column-header span { min-width:25px; height:24px; display:grid; place-items:center; padding:0 7px; border-radius:999px; background:#fff; border:1px solid #dfe5ee; color:#667085; font-size:11px; font-weight:800; }
      .production-card { margin-bottom:12px; padding:17px; border:1px solid #e0e6ef; border-radius:12px; background:#fff; box-shadow:0 4px 14px rgba(31,51,86,.05); }
      .production-card:last-child { margin-bottom:0; }
      .production-card:hover { border-color:#c8d5e8; box-shadow:0 7px 18px rgba(31,51,86,.08); }
      .card-topline { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; }
      .card-topline strong { color:#172033; font-size:13px; }
      .card-status { padding:4px 8px; border-radius:999px; background:#edf3ff; color:#2459a8; font-size:10px; font-weight:800; }
      .production-card h3 { margin:0 0 7px; color:#172033; font-size:15px; }
      .production-card p { margin:0; color:#667085; font-size:12px; line-height:1.55; }
      .card-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:15px; padding-top:13px; border-top:1px solid #edf0f5; }
      .production-empty { padding:28px 12px; color:#98a2b3; text-align:center; font-size:12px; }
      @media (max-width: 900px) { .production-board { grid-template-columns:1fr; } .production-count { display:none; } }
    `}</style>
    <section className="production-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">PRODUCTION</p>
          <h1>Production Board</h1>
          <p className="page-description">Operational view of Work Orders. Processes remain non-sequential.</p>
        </div>
      </div>

      <div className="production-toolbar">
        <input className="production-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search WO, SO, customer, product..." aria-label="Search production" />
        <button className="button secondary" type="button" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
        <span className="production-count">{total} work order{total === 1 ? '' : 's'}</span>
      </div>

      {error && <div className="error-banner"><span>{error}</span><button type="button" onClick={load}>Retry</button></div>}

      {loading ? <div className="state-panel">Loading production board...</div> : <div className="production-board">
        {columns.map(([status, label]) => {
          const rows = board?.columns?.[status] || [];
          return <section className="production-column" key={status}>
            <div className="production-column-header"><strong>{label}</strong><span>{rows.length}</span></div>
            {rows.length === 0 ? <div className="production-empty">No work orders</div> : rows.map((wo) => <article className="production-card" key={wo.id}>
              <div className="card-topline"><strong>{wo.woNumber}</strong><span className="card-status">{statusLabels[wo.status] || wo.status}</span></div>
              <h3>{wo.productName || 'Unnamed Product'}</h3>
              <p><strong>{wo.salesOrderNumber || '—'}</strong> · {wo.customerName || 'Marketplace'} · Qty {wo.quantity}</p>
              <div className="card-actions">
                {status === 'READY_FOR_PRODUCTION' && <button className="button primary" type="button" onClick={() => transition(wo.id, 'start')}>Start Production</button>}
                {status === 'IN_PRODUCTION' && <button className="button primary" type="button" onClick={() => transition(wo.id, 'complete')}>Complete Production</button>}
                <button className="button secondary" type="button" onClick={() => window.alert(`WO ${wo.woNumber}`)}>View WO</button>
              </div>
            </article>)}
          </section>;
        })}
      </div>}
    </section>
  </>;
}
