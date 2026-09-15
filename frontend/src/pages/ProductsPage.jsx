import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: '1', pageSize: '50' });
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/products?${params}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to load products.');
      setProducts(payload.data || []);
      setMeta(payload.meta || { total: 0 });
    } catch (requestError) {
      setError(requestError.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 250);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  return (
    <section className="page-content">
      <div className="page-header">
        <div>
          <p className="eyebrow">MASTER DATA</p>
          <h1>Products</h1>
          <p className="page-description">Manage product master records referenced by Sales Orders and Work Orders.</p>
        </div>
        <button className="primary-button" type="button">+ Add Product</button>
      </div>

      <div className="toolbar">
        <label className="search-field">
          <span>Search</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search SKU, name, category…" />
        </label>
        <label className="filter-field">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <div className="result-count">{meta.total ?? products.length} products</div>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="empty-state">Loading products…</div>
        ) : error ? (
          <div className="empty-state error-state"><strong>Unable to load products</strong><span>{error}</span><button className="secondary-button" onClick={loadProducts} type="button">Retry</button></div>
        ) : products.length === 0 ? (
          <div className="empty-state"><strong>No products found</strong><span>Product master records will appear here once they are created.</span></div>
        ) : (
          <table>
            <thead><tr><th>Product</th><th>Category</th><th>Material</th><th>Unit</th><th>Standard Price</th><th>Status</th></tr></thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong><span className="subtle">{product.sku}</span></td>
                  <td>{product.category || '—'}</td>
                  <td>{product.material || '—'}</td>
                  <td>{product.unit}</td>
                  <td>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(product.standardPrice || 0))}</td>
                  <td><span className={`status-pill status-${product.status.toLowerCase()}`}>{product.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
