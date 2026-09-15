import { useCallback, useEffect, useState } from 'react';
import EntityFormModal from '../components/EntityFormModal.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const EMPTY_FORM = { customerCode: '', name: '', company: '', mobile: '', email: '', address: '', customerType: '', status: 'ACTIVE', notes: '' };
const FIELDS = [
  { name: 'customerCode', label: 'Customer Code', required: true }, { name: 'name', label: 'Name', required: true },
  { name: 'company', label: 'Company' }, { name: 'mobile', label: 'Mobile' }, { name: 'email', label: 'Email', type: 'email' },
  { name: 'customerType', label: 'Customer Type' }, { name: 'address', label: 'Address', fullWidth: true },
  { name: 'status', label: 'Status', type: 'select', options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }] },
  { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]); const [meta, setMeta] = useState({ total: 0 }); const [search, setSearch] = useState('');
  const [status, setStatus] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [selected, setSelected] = useState(null); const [modalOpen, setModalOpen] = useState(false); const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM); const [submitting, setSubmitting] = useState(false); const [formError, setFormError] = useState('');

  const loadCustomers = useCallback(async () => {
    setLoading(true); setError(''); const params = new URLSearchParams({ page: '1', pageSize: '50' });
    if (search.trim()) params.set('search', search.trim()); if (status) params.set('status', status);
    try { const response = await fetch(`${API_BASE_URL}/api/v1/customers?${params}`); const payload = await response.json(); if (!response.ok) throw new Error(payload?.error?.message || 'Unable to load customers.'); setCustomers(payload.data || []); setMeta(payload.meta || { total: 0 }); }
    catch (requestError) { setError(requestError.message); setCustomers([]); } finally { setLoading(false); }
  }, [search, status]);
  useEffect(() => { const timer = setTimeout(loadCustomers, 250); return () => clearTimeout(timer); }, [loadCustomers]);

  function openCreate() { setSelected(null); setEditing(false); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); }
  function openEdit(customer) { setSelected(customer); setEditing(true); setForm({ ...EMPTY_FORM, ...customer }); setFormError(''); setModalOpen(true); }
  function updateField(name, value) { setForm((current) => ({ ...current, [name]: value })); }

  async function submit(event) {
    event.preventDefault(); setSubmitting(true); setFormError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/customers${editing ? `/${selected.id}` : ''}`, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload?.error?.message || `Unable to ${editing ? 'update' : 'create'} customer.`);
      setModalOpen(false); setSelected(payload.data); await loadCustomers();
    } catch (requestError) { setFormError(requestError.message); } finally { setSubmitting(false); }
  }

  return <section className="page-content">
    <div className="page-header"><div><p className="eyebrow">MASTER DATA</p><h1>Customers</h1><p className="page-description">Manage customer records used across Sales Orders and fulfillment.</p></div><button className="primary-button" type="button" onClick={openCreate}>+ Add Customer</button></div>
    <div className="toolbar"><label className="search-field"><span>Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, code, company…" /></label><label className="filter-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label><div className="result-count">{meta.total ?? customers.length} customers</div></div>
    <div className="table-card">{loading ? <div className="empty-state">Loading customers…</div> : error ? <div className="empty-state error-state"><strong>Unable to load customers</strong><span>{error}</span><button className="secondary-button" onClick={loadCustomers} type="button">Retry</button></div> : customers.length === 0 ? <div className="empty-state"><strong>No customers found</strong><span>Customer records will appear here once they are created.</span></div> : <table><thead><tr><th>Customer</th><th>Company</th><th>Mobile</th><th>Type</th><th>Status</th><th /></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id} onClick={() => setSelected(customer)} className="clickable-row"><td><strong>{customer.name}</strong><span className="subtle">{customer.customerCode}</span></td><td>{customer.company || '—'}</td><td>{customer.mobile || '—'}</td><td>{customer.customerType || '—'}</td><td><span className={`status-pill status-${customer.status.toLowerCase()}`}>{customer.status}</span></td><td><button className="table-action" type="button" onClick={(event) => { event.stopPropagation(); openEdit(customer); }}>Edit</button></td></tr>)}</tbody></table>}</div>
    {selected && !modalOpen && <aside className="detail-drawer"><div className="drawer-header"><div><p className="eyebrow">CUSTOMER</p><h2>{selected.name}</h2><span className="subtle">{selected.customerCode}</span></div><button className="icon-button" type="button" onClick={() => setSelected(null)} aria-label="Close">×</button></div><div className="drawer-body"><div className="detail-status"><span className={`status-pill status-${selected.status.toLowerCase()}`}>{selected.status}</span></div><dl className="detail-list"><dt>Company</dt><dd>{selected.company || '—'}</dd><dt>Mobile</dt><dd>{selected.mobile || '—'}</dd><dt>Email</dt><dd>{selected.email || '—'}</dd><dt>Customer Type</dt><dd>{selected.customerType || '—'}</dd><dt>Address</dt><dd>{selected.address || '—'}</dd><dt>Notes</dt><dd>{selected.notes || '—'}</dd></dl></div><div className="drawer-actions"><button className="secondary-button" type="button" onClick={() => openEdit(selected)}>Edit Customer</button></div></aside>}
    {modalOpen && <EntityFormModal title={editing ? 'Edit Customer' : 'Add Customer'} description={editing ? 'Update the customer master record.' : 'Create a customer master record.'} fields={FIELDS} values={form} onChange={updateField} onSubmit={submit} onClose={() => !submitting && setModalOpen(false)} submitting={submitting} error={formError} />}
  </section>;
}
