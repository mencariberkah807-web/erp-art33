import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: '1', pageSize: '50' });
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/customers?${params}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to load customers.');
      setCustomers(payload.data || []);
      setMeta(payload.meta || { total: 0 });
    } catch (requestError) {
      setError(requestError.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(loadCustomers, 250);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  return (
    <section className="page-content">
      <div className="page-header">
        <div>
          <p className="eyebrow">MASTER DATA</p>
          <h1>Customers</h1>
          <p className="page-description">Manage customer records used across Sales Orders and fulfillment.</p>
        </div>
        <button className="primary-button" type="button">+ Add Customer</button>
      </div>

      <div className="toolbar">
        <label className="search-field">
          <span>Search</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, code, company…" />
        </label>
        <label className="filter-field">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <div className="result-count">{meta.total ?? customers.length} customers</div>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="empty-state">Loading customers…</div>
        ) : error ? (
          <div className="empty-state error-state"><strong>Unable to load customers</strong><span>{error}</span><button className="secondary-button" onClick={loadCustomers}>Retry</button></div>
        ) : customers.length === 0 ? (
          <div className="empty-state"><strong>No customers found</strong><span>Customer records will appear here once they are created.</span></div>
        ) : (
          <table>
            <thead><tr><th>Customer</th><th>Company</th><th>Mobile</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td><strong>{customer.name}</strong><span className="subtle">{customer.customerCode}</span></td>
                  <td>{customer.company || '—'}</td>
                  <td>{customer.mobile || '—'}</td>
                  <td>{customer.customerType || '—'}</td>
                  <td><span className={`status-pill status-${customer.status.toLowerCase()}`}>{customer.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
