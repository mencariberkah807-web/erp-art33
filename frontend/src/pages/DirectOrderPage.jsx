import React, { useEffect, useMemo, useState } from 'react';
import EntityFormModal from '../components/EntityFormModal.jsx';
import '../new-order-reference.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const marketplaces = [['SHOPEE', 'Shopee'], ['TOKOPEDIA', 'Tokopedia'], ['TIKTOK_SHOP', 'TikTok Shop'], ['LAZADA', 'Lazada'], ['BLIBLI', 'Blibli'], ['OTHER', 'Other']];
const emptyItem = () => ({ productId: '', quantity: 1, unitPrice: 0, discountType: 'NOMINAL', discountValue: 0, isCustom: false, productionNotes: '', artworkFileUrl: '', artworkDriveUrl: '' });
const emptyPayment = () => ({ amount: '', paymentMethod: 'Cash', paymentDate: new Date().toISOString().slice(0, 10), referenceNumber: '', notes: '' });
const emptyCustomer = () => ({ name: '', company: '', mobile: '', email: '', address: '', customerType: '', notes: '' });
const emptyProduct = () => ({ sku: '', name: '', category: '', material: '', thickness: '', lengthCm: '', widthCm: '', heightCm: '', color: '', specification: '', unit: '', initialStock: '', standardPurchasePrice: '', standardPrice: '', description: '', imageUrl: '', status: 'ACTIVE' });
const CUSTOMER_FIELDS = [
  { name: 'name', label: 'Name', required: true }, { name: 'company', label: 'Company' }, { name: 'mobile', label: 'Mobile' },
  { name: 'email', label: 'Email', type: 'email' }, { name: 'customerType', label: 'Customer Type', type: 'select', options: [{ value: 'Individual', label: 'Individual' }, { value: 'Company', label: 'Company' }, { value: 'Other', label: 'Other' }] },
  { name: 'address', label: 'Address', fullWidth: true }, { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];
const PRODUCT_FIELDS = [
  { name: 'identity-section', label: 'Product', type: 'section' },
  { name: 'sku', label: 'SKU', required: true, help: 'Example: NB6060, TCA5L' },
  { name: 'name', label: 'Product Name', required: true },
  { name: 'category', label: 'Category' },
  { name: 'unit', label: 'Unit', required: true },
  { name: 'material-section', label: 'Material', type: 'section' },
  { name: 'material', label: 'Material' },
  { name: 'color', label: 'Color' },
  { name: 'thickness', label: 'Thickness (mm)' },
  { name: 'dimension-section', label: 'Dimension (cm)', type: 'section', help: 'Height is optional.' },
  { name: 'lengthCm', label: 'Length (L)', type: 'number', min: '0', step: '0.01' },
  { name: 'widthCm', label: 'Width (W)', type: 'number', min: '0', step: '0.01' },
  { name: 'heightCm', label: 'Height (H)', type: 'number', min: '0', step: '0.01' },
  { name: 'stock-section', label: 'Stock', type: 'section', help: 'Opening balance only.' },
  { name: 'initialStock', label: 'Initial Stock', type: 'number', min: '0', step: '0.01' },
  { name: 'pricing-section', label: 'Pricing', type: 'section' },
  { name: 'standardPurchasePrice', label: 'Standard Purchase Price', type: 'number', min: '0', step: '0.01' },
  { name: 'standardPrice', label: 'Standard Selling Price', type: 'number', min: '0', step: '0.01', required: true },
  { name: 'specification', label: 'Specification', fullWidth: true },
  { name: 'imageUrl', label: 'Image URL', fullWidth: true },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
  { name: 'status', label: 'Status', type: 'select', options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }] },
];

function money(value) { return Number(value || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }); }
function paymentTotal(payments) { return payments.reduce((sum, payment) => sum + Math.max(0, Number(payment.amount || 0)), 0); }

export default function DirectOrderPage({ orderType = 'DIRECT', onCancel, onCreated }) {
  const isMarketplace = orderType === 'MARKETPLACE';
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [marketplace, setMarketplace] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState(emptyCustomer());
  const [customerSubmitting, setCustomerSubmitting] = useState(false);
  const [customerError, setCustomerError] = useState('');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState(emptyProduct());
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productError, setProductError] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('REGULAR');
  const [items, setItems] = useState([emptyItem()]);
  const [payments, setPayments] = useState([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState(emptyPayment());
  const [paymentError, setPaymentError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/api/v1/customers?page=1&pageSize=100&status=ACTIVE`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/v1/products?page=1&pageSize=100&status=ACTIVE`).then((r) => r.json()),
    ]).then(([customerBody, productBody]) => {
      if (customerBody.error) throw new Error(customerBody.error.message);
      if (productBody.error) throw new Error(productBody.error.message);
      setCustomers(customerBody.data || []); setProducts(productBody.data || []);
    }).catch((e) => setError(e.message)).finally(() => setLoadingMaster(false));
  }, []);

  const totals = useMemo(() => items.reduce((sum, item) => {
    const gross = Number(item.quantity || 0) * Number(item.unitPrice || 0);
    const discount = item.discountType === 'PERCENTAGE' ? gross * Number(item.discountValue || 0) / 100 : Number(item.discountValue || 0);
    return { subtotal: sum.subtotal + gross, discount: sum.discount + Math.min(discount, gross), total: sum.total + Math.max(0, gross - discount) };
  }, { subtotal: 0, discount: 0, total: 0 }), [items]);

  const totalPaid = paymentTotal(payments);
  const balance = Math.max(0, totals.total - totalPaid);
  const displayPaid = isMarketplace ? totals.total : totalPaid;
  const displayBalance = isMarketplace ? 0 : balance;
  const selectedCustomer = customers.find((customer) => customer.id === customerId);

  function updateItem(index, key, value) { setItems((current) => current.map((item, i) => i === index ? { ...item, [key]: value } : item)); }
  function selectProduct(index, productId) {
    const product = products.find((p) => p.id === productId);
    setItems((current) => current.map((item, i) => i === index ? { ...item, productId, unitPrice: product ? Number(product.standardPrice || 0) : item.unitPrice } : item));
  }
  function addItem() { setProductForm(emptyProduct()); setProductError(''); setProductModalOpen(true); }
  function removeItem(index) { setItems((current) => current.filter((_, i) => i !== index)); }
  function updatePayment(index, key, value) { setPayments((current) => current.map((payment, i) => i === index ? { ...payment, [key]: value } : payment)); }
  function addPayment() { setPayments((current) => [...current, emptyPayment()]); }
  function removePayment(index) { setPayments((current) => current.length > 1 ? current.filter((_, i) => i !== index) : current); }
  function openCustomerModal() { setCustomerForm(emptyCustomer()); setCustomerError(''); setCustomerModalOpen(true); }
  function updateCustomerField(name, value) { setCustomerForm((current) => ({ ...current, [name]: value })); }
  function openProductModal() { setProductForm(emptyProduct()); setProductError(''); setProductModalOpen(true); }
  function updateProductField(name, value) { setProductForm((current) => ({ ...current, [name]: value })); }

  async function createCustomer(event) {
    event.preventDefault(); setCustomerSubmitting(true); setCustomerError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customerForm) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to create customer.');
      const customer = payload.data;
      setCustomers((current) => [customer, ...current]); setCustomerId(customer.id); setCustomerModalOpen(false); setCustomerForm(emptyCustomer());
    } catch (e) { setCustomerError(e.message); } finally { setCustomerSubmitting(false); }
  }

  async function createProduct(event) {
    event.preventDefault(); setProductSubmitting(true); setProductError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...productForm, lengthCm: productForm.lengthCm === '' ? null : Number(productForm.lengthCm), widthCm: productForm.widthCm === '' ? null : Number(productForm.widthCm), heightCm: productForm.heightCm === '' ? null : Number(productForm.heightCm), initialStock: productForm.initialStock === '' ? 0 : Number(productForm.initialStock), standardPurchasePrice: productForm.standardPurchasePrice === '' ? 0 : Number(productForm.standardPurchasePrice), standardPrice: Number(productForm.standardPrice) }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to create product.');
      const product = payload.data;
      setProducts((current) => [product, ...current]);
      setItems((current) => {
        const emptyIndex = current.findIndex((entry) => !entry.productId);
        const nextItem = { ...emptyItem(), productId: product.id, unitPrice: Number(product.standardPrice || 0) };
        return emptyIndex >= 0 ? current.map((item, index) => index === emptyIndex ? { ...item, productId: product.id, unitPrice: Number(product.standardPrice || 0) } : item) : [...current, nextItem];
      });
      setProductModalOpen(false); setProductForm(emptyProduct());
    } catch (e) { setProductError(e.message); } finally { setProductSubmitting(false); }
  }

  function updatePaymentForm(key, value) { setPaymentForm((current) => ({ ...current, [key]: value })); }
  function savePayment(event) {
    event.preventDefault(); setPaymentError('');
    const amount = Number(paymentForm.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) return setPaymentError('Payment amount must be greater than zero.');
    if (amount > balance + 0.000001) return setPaymentError('Payment amount cannot exceed Balance.');
    setPayments((current) => [...current, { ...paymentForm, amount: String(amount) }]);
    setPaymentModalOpen(false); setPaymentForm(emptyPayment());
  }

  async function submit(event) {
    event.preventDefault(); setError('');
    if (!isMarketplace && !customerId) return setError('Customer is required.');
    if (isMarketplace && !marketplace) return setError('Marketplace is required.');
    if (isMarketplace && !trackingNumber.trim()) return setError('Tracking number is required.');
    if (!deadline) return setError('Deadline is required.');
    if (deadline < orderDate) return setError('Deadline must be on or after order date.');
    if (!items.length || items.some((item) => !item.productId || Number(item.quantity) < 1)) return setError('At least one valid product item is required.');
    if (totalPaid > totals.total + 0.000001) return setError('Total payment cannot exceed Grand Total.');
    if (payments.some((payment) => Number(payment.amount || 0) < 0)) return setError('Payment amount cannot be negative.');
    if (payments.some((payment) => Number(payment.amount || 0) > 0 && !payment.paymentMethod)) return setError('Payment method is required for every payment.');
    setSaving(true);
    try {
      const payload = { orderType, customerId: customerId || null, orderDate, deadline, priority, items };
      if (isMarketplace) {
        payload.marketplace = marketplace;
        payload.trackingNumber = trackingNumber.trim();
      } else {
        payload.payments = payments.filter((payment) => Number(payment.amount || 0) > 0);
      }
      const response = await fetch(`${API_BASE_URL}/api/v1/sales-orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to create sales order.');
      onCreated(body.data);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  return <section className="page-section new-order-reference-form">
    <form onSubmit={submit}>
      <div className="new-order-workspace">
        <div className="new-order-main">
      {isMarketplace && <section className="form-card reference-card marketplace-inline-card">
        <div className="section-heading"><div><h2>Marketplace Information</h2><p>Tracking and marketplace channel for this order.</p></div></div>
        <div className="marketplace-layout">
          <div className="marketplace-left">
            <label className="form-field"><span>No. Resi *</span><input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Tracking number" /></label>
            <label className="form-field"><span>Customer</span><select value={customerId} onChange={(e) => setCustomerId(e.target.value)} disabled={loadingMaster}><option value="">Optional</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.customerCode} — {c.name}</option>)}</select></label>
          </div>
          <div className="marketplace-right">
            <span className="marketplace-channel-label">Marketplace Channel *</span>
            <div className="radio-row marketplace-channel-radios">{marketplaces.map(([value, label]) => <label className="radio" key={value}><input type="radio" name="marketplace-channel" value={value} checked={marketplace === value} onChange={() => setMarketplace(value)} /><span>{label}</span></label>)}</div>
          </div>
        </div>
      </section>}

      <div className="reference-two-column">
        <section className="form-card reference-card">
          <div className="section-heading"><div><h2>Order Information</h2><p>Transaction identity and delivery deadline.</p></div></div>
          <div className="reference-order-grid">
            <label className="form-field"><span>SO Number</span><input value="Auto-generated" readOnly /></label>
            <label className="form-field"><span>Order Date *</span><input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} /></label>
            <label className="form-field"><span>Deadline *</span><input type="date" min={orderDate} value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label>
            <div className="form-field reference-priority"><span>Priority *</span><div className="priority-radio-row">
              <label className="radio"><input type="radio" name="priority" value="REGULAR" checked={priority === 'REGULAR'} onChange={() => setPriority('REGULAR')} /><span>Regular</span></label>
              <label className="radio"><input type="radio" name="priority" value="SAME_DAY" checked={priority === 'SAME_DAY'} onChange={() => setPriority('SAME_DAY')} /><span>Same Day</span></label>
              <label className="radio"><input type="radio" name="priority" value="INSTANT" checked={priority === 'INSTANT'} onChange={() => setPriority('INSTANT')} /><span>Instant</span></label>
            </div></div>
          </div>
        </section>
        {!isMarketplace && <section className="form-card reference-card">
          <div className="section-heading"><div><h2>Customer Information</h2><p>Customer master information.</p></div><button className="primary-button" type="button" onClick={openCustomerModal}>+ Add Customer</button></div>
          <div className="reference-customer-grid">
            <label className="form-field reference-full"><span>Customer *</span><select value={customerId} onChange={(e) => setCustomerId(e.target.value)} disabled={loadingMaster}><option value="">Select customer...</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.customerCode} — {c.name}</option>)}</select></label>
            <label className="form-field"><span>Mobile</span><input value={selectedCustomer?.mobile || ''} readOnly /></label>
            <label className="form-field"><span>Email</span><input value={selectedCustomer?.email || ''} readOnly /></label>
            <label className="form-field reference-full"><span>Address</span><textarea value={selectedCustomer?.address || ''} readOnly rows="2" /></label>
          </div>
        </section>}
      </div>


      <section className="form-card reference-card">
        <div className="section-heading"><div><h2>Order Items</h2><p>One item represents one sales-order item and keeps its artwork/attachment with the item.</p></div><button className="primary-button" type="button" onClick={addItem}>+ Add Item</button></div>
        <div className="reference-items">
          {items.map((item, index) => {
            const gross = Number(item.quantity || 0) * Number(item.unitPrice || 0);
            const discount = item.discountType === 'PERCENTAGE' ? gross * Number(item.discountValue || 0) / 100 : Number(item.discountValue || 0);
            const itemTotal = Math.max(0, gross - discount);
            const product = products.find((p) => p.id === item.productId);
            return <div className="reference-item" key={index}>
              <div className="reference-item-main">
                <div className="reference-item-fields">
                  <label className="form-field reference-product"><span>Product *</span><select value={item.productId} onChange={(e) => selectProduct(index, e.target.value)} disabled={loadingMaster}><option value="">Select product...</option>{products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}</select></label>
                  <label className="form-field"><span>Qty *</span><input type="number" min="1" step="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} /></label>
                  <label className="form-field"><span>Unit Price *</span><input type="number" min="0" step="1" value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', e.target.value)} /></label>
                  <div className="discount-field"><span>Discount</span><div><input type="number" min="0" step="0.01" max={item.discountType === 'PERCENTAGE' ? 100 : undefined} value={item.discountValue} onChange={(e) => updateItem(index, 'discountValue', e.target.value)} /><select aria-label="Discount type" value={item.discountType} onChange={(e) => updateItem(index, 'discountType', e.target.value)}><option value="NOMINAL">Rp</option><option value="PERCENTAGE">%</option></select></div></div>
                </div>
                <div className="reference-product-info">
                  {['SKU','Material','Category','Thickness','Dimension','Color','Specification'].map((label) => { const key = { SKU: 'sku', Material: 'material', Category: 'category', Thickness: 'thickness', Dimension: 'dimension', Color: 'color', Specification: 'specification' }[label]; return <div key={label}><span>{label}</span><strong>{product?.[key] || '—'}</strong></div>; })}
                </div>
              </div>
              <div className="reference-item-total"><span>Item Total</span><strong>{money(itemTotal)}</strong></div>
              <div className="reference-item-options"><label className="checkbox-field"><input type="checkbox" checked={item.isCustom} onChange={(e) => updateItem(index, 'isCustom', e.target.checked)} /><span>Custom / Special Request</span></label>{items.length > 1 && <button className="text-danger" type="button" onClick={() => removeItem(index)}>Remove</button>}</div>
              {item.isCustom && <div className="custom-notes-field"><label className="form-field reference-full"><span>Special Request / Production Notes</span><textarea rows="2" value={item.productionNotes} onChange={(e) => updateItem(index, 'productionNotes', e.target.value)} placeholder="Admin input for custom / special request..." /></label></div>}
              <div className="reference-item-attachment"><div className="reference-artwork-preview">{item.artworkFileUrl ? <img src={item.artworkFileUrl} alt="Artwork preview" /> : <span>Artwork Preview</span>}</div><div className="reference-attachment-fields"><label className="form-field"><span>Artwork File URL</span><input value={item.artworkFileUrl} onChange={(e) => updateItem(index, 'artworkFileUrl', e.target.value)} placeholder="File / preview URL" /></label><label className="form-field"><span>Google Drive / Artwork Link</span><input value={item.artworkDriveUrl} onChange={(e) => updateItem(index, 'artworkDriveUrl', e.target.value)} placeholder="Drive URL" /></label></div></div>
            </div>;
          })}
        </div>
      </section>

{!isMarketplace && <section className="form-card reference-card payment-reference-card">
        <div className="section-heading"><div><h2>Payment</h2></div><button className="primary-button" type="button" onClick={() => { setPaymentForm(emptyPayment()); setPaymentError(''); setPaymentModalOpen(true); }}>+ Add Payment</button></div>
        <div className="payment-reference-body">
          <div className="payment-reference-summary">
            <div className="payment-reference-title">Payment Summary</div>
            <div className="payment-summary-fields">
              <label className="form-field"><span>Grand Total</span><input value={money(totals.total)} readOnly /></label>
              <label className="form-field"><span>Amount Paid</span><input value={money(totalPaid)} readOnly /></label>
              <label className="form-field"><span>Balance</span><input value={money(balance)} readOnly /></label>
            </div>
            <div className="payment-note">{payments.length ? `${payments.length} payment record${payments.length === 1 ? '' : 's'} recorded.` : 'No payment has been recorded.'}</div>
          </div>
          <div className="payment-reference-method">
            <div className="payment-reference-title">Payment Method</div>
            {['Cash','Transfer','QRIS'].map((method) => <label className="payment-method-option" key={method}><input type="radio" name="reference-payment-method" value={method} checked={(payments[payments.length - 1]?.paymentMethod || 'Cash') === method} readOnly /><span>{method}</span></label>)}
            <div className="payment-reference-status"><span>Payment Status</span><strong>{totals.total <= 0 ? 'UNPAID' : totalPaid >= totals.total ? 'PAID' : totalPaid > 0 ? 'PARTIALLY PAID' : 'UNPAID'}</strong></div>
          </div>
        </div>
      </section>}

      {isMarketplace && <div className="form-note">Marketplace payment status: <strong>PAID</strong> · payment is recorded automatically when the order is created.</div>}
      {error && <div className="form-error">{error}</div>}
      <div className="reference-footer-actions"><button className="secondary-button" type="button" onClick={onCancel} disabled={saving}>Cancel</button><button className="primary-button" type="submit" disabled={saving || loadingMaster}>{saving ? 'Creating...' : isMarketplace ? 'Create WO' : 'Create Order'}</button></div>
        </div>

        <aside className="new-order-summary" aria-label="Order summary">
          <div className="new-order-summary-header">
            <h2>Order Summary</h2>
            <span>{items.length} item{items.length === 1 ? '' : 's'}</span>
          </div>
          <div className="new-order-summary-list">
            <div><span>Subtotal</span><strong>{money(totals.subtotal)}</strong></div>
            <div><span>Discount</span><strong>{money(totals.discount)}</strong></div>
            <div className="new-order-summary-total"><span>Grand Total</span><strong>{money(totals.total)}</strong></div>
          </div>
          <div className="new-order-summary-payment">
            <h3>Payment</h3>
            <div><span>Amount Paid</span><strong>{money(displayPaid)}</strong></div>
            <div><span>Balance</span><strong>{money(displayBalance)}</strong></div>
            <div><span>Status</span><strong>{isMarketplace ? 'PAID' : totals.total <= 0 ? 'UNPAID' : totalPaid >= totals.total ? 'PAID' : totalPaid > 0 ? 'PARTIALLY PAID' : 'UNPAID'}</strong></div>
          </div>
          {isMarketplace && <div className="new-order-summary-note">Marketplace payment is recorded automatically as PAID when the order is created.</div>}
        </aside>
      </div>
    </form>
    {paymentModalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setPaymentModalOpen(false)}>
      <section className="modal-card payment-entry-modal" role="dialog" aria-modal="true" aria-labelledby="payment-entry-title">
        <div className="modal-header"><div><p className="eyebrow">PAYMENT</p><h2 id="payment-entry-title">Add Payment</h2><p>Record a payment against this sales order.</p></div></div>
        <form onSubmit={savePayment}>
          <div className="form-grid">
            <label className="form-field"><span>Amount *</span><input type="number" min="0.01" step="0.01" value={paymentForm.amount} onChange={(e) => updatePaymentForm('amount', e.target.value)} autoFocus /></label>
            <div className="form-field"><span>Payment Method *</span><div className="payment-entry-methods">{['Cash','Transfer','QRIS'].map((method) => <label className="payment-method-option" key={method}><input type="radio" name="payment-entry-method" value={method} checked={paymentForm.paymentMethod === method} onChange={() => updatePaymentForm('paymentMethod', method)} /><span>{method}</span></label>)}</div></div>
            <label className="form-field"><span>Payment Date</span><input type="date" value={paymentForm.paymentDate} onChange={(e) => updatePaymentForm('paymentDate', e.target.value)} /></label>
            <label className="form-field"><span>Reference Number</span><input value={paymentForm.referenceNumber} onChange={(e) => updatePaymentForm('referenceNumber', e.target.value)} /></label>
            <label className="form-field form-field-full"><span>Notes</span><textarea rows="3" value={paymentForm.notes} onChange={(e) => updatePaymentForm('notes', e.target.value)} /></label>
          </div>
          {paymentError && <div className="form-error" role="alert">{paymentError}</div>}
          <div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setPaymentModalOpen(false)}>Cancel</button><button className="primary-button" type="submit">Save Payment</button></div>
        </form>
      </section>
    </div>}
    {customerModalOpen && <EntityFormModal title="Add Customer" description="Create a customer master record and use it immediately in this order." fields={CUSTOMER_FIELDS} values={customerForm} onChange={updateCustomerField} onSubmit={createCustomer} onClose={() => !customerSubmitting && setCustomerModalOpen(false)} submitting={customerSubmitting} error={customerError} />}
    {productModalOpen && <EntityFormModal title="Add Product" description="Create a product master record and use it immediately in this order." fields={PRODUCT_FIELDS} values={productForm} onChange={updateProductField} onSubmit={createProduct} onClose={() => !productSubmitting && setProductModalOpen(false)} submitting={productSubmitting} error={productError} />}
  </section>;
}
