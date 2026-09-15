import { useCallback, useEffect, useState } from 'react';
import EntityFormModal from '../components/EntityFormModal.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const EMPTY_FORM = { sku: '', name: '', category: '', material: '', thickness: '', dimension: '', color: '', specification: '', unit: '', standardPrice: '', description: '', imageUrl: '', status: 'ACTIVE' };
const FIELDS = [
  { name: 'sku', label: 'SKU', required: true },
  { name: 'name', label: 'Name', required: true },
  { name: 'category', label: 'Category' },
  { name: 'material', label: 'Material' },
  { name: 'thickness', label: 'Thickness' },
  { name: 'dimension', label: 'Dimension' },
  { name: 'color', label: 'Color' },
  { name: 'unit', label: 'Unit', required: true },
  { name: 'standardPrice', label: 'Standard Price', type: 'number', min: '0', step: '0.01', required: true },
  { name: 'specification', label: 'Specification', fullWidth: true },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
  { name: 'imageUrl', label: 'Image URL', fullWidth: true },
  { name: 'status', label: 'Status', type: 'select', options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }] },
];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true); setError('');
    const params = new URLSearchParams({ page: '1', pageSize: '50' });
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/products?${params}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to load products.');
      setProducts(payload.data || []); setMeta(payload.meta || { total: 0 });
    } catch (requestError) { setError(requestError.message); setProducts([]); }
    finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { const timer = setTimeout(loadProducts, 250); return () => clearTimeout(timer); }, [loadProducts]);

  function updateField(name, value) { setForm((current) => ({ ...current, [name]: value })); }

  async function createProduct(event) {
    event.preventDefault(); setSubmitting(true); setFormError('');
    const body = { ...form, standardPrice: Number(form.standardPrice) };
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to create product.');
      setModalOpen(false); setForm(EMPTY_FORM); await loadProducts();
    } catch (requestError) { setFormError(requestError.message); }
    finally { setSubmitting(false); }
  }

  return (
    <section className="page-content">
      <div className="page-header">
        <div><p className="eyebrow">MASTER DATA</p><h1>Products</h1><p className="page-description">Manage product master records referenced by Sales Orders and Work Orders.</p></div>
        <button className="primary-button" type="button" onClick={() => { setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); }}>+ Add Product</button>
      </div>
      <div className="toolbar">
        <label className="search-field"><span>Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search SKU, name, category…" /></label>
        <label className="filter-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
        <div className="result-count">{meta.total ?? products.length} products</div>
      </div>
      <div className="table-card">
        {loading ? <div className="empty-state">Loading products…</div> : error ? <div className="empty-state error-state"><strong>Unable to load products</strong><span>{error}</span><button className="secondary-button" onClick={loadProducts} type="button">Retry</button></div> : products.length === 0 ? <div className="empty-state"><strong>No products found</strong><span>Product master records will appear here once they are created.</span></div> : (
          <table><thead><tr><th>Product</th><th>Category</th><th>Material</th><th>Unit</th><th>Standard Price</th><th>Status</th></tr></thead><tbody>
            {products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><span className="subtle">{product.sku}</span></td><td>{product.category || '—'}</td><td>{product.material || '—'}</td><td>{product.unit}</td><td>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(product.standardPrice || 0))}</td><td><span className={`status-pill status-${product.status.toLowerCase()}`}>{product.status}</span></td></tr>)}
          </tbody></table>
        )}
      </div>
      {modalOpen && <EntityFormModal title="Add Product" description="Create a product master record." fields={FIELDS} values={form} onChange={updateField} onSubmit={createProduct} onClose={() => !submitting && setModalOpen(false)} submitting={submitting} error={formError} />}
    </section>
  );
}
