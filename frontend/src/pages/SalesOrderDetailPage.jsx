import React, { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const STATUS_LABELS = { NEW_ORDER: 'New Order', READY_PRODUCTION: 'Ready Production', IN_PRODUCTION: 'In Production', PACKING: 'Packing', RTS: 'RTS', COMPLETED: 'Completed', INACTIVE: 'Inactive' };
const PAYMENT_METHODS = ['Cash', 'Transfer', 'QRIS'];

function money(value) { return Number(value || 0).toLocaleString('id-ID'); }

export default function SalesOrderDetailPage({ salesOrderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingWO, setCreatingWO] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showHandover, setShowHandover] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingHandover, setSavingHandover] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [handoverError, setHandoverError] = useState('');
  const [editError, setEditError] = useState('');
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: '', paymentDate: new Date().toISOString().slice(0, 10), referenceNumber: '', notes: '' });
  const [handoverForm, setHandoverForm] = useState({ handoverType: 'CUSTOMER_PICKUP', recipientName: '', courierName: '', notes: '' });
  const [editForm, setEditForm] = useState({ customerId: '', orderDate: '', deadline: '', priority: 'REGULAR', marketplace: '', trackingNumber: '' });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sales-orders/${salesOrderId}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to load sales order.');
      setOrder(body.data);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [salesOrderId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!order || order.orderType !== 'DIRECT') return;
    fetch(`${API_BASE_URL}/api/v1/customers?page=1&pageSize=100&status=ACTIVE`).then((r) => r.json()).then((body) => {
      if (!body.error) setCustomers(body.data || []);
    }).catch(() => {});
  }, [order]);

  function openEdit() {
    setEditError('');
    setEditForm({ customerId: order.customerId || '', orderDate: order.orderDate || '', deadline: order.deadline || '', priority: order.priority || 'REGULAR', marketplace: order.marketplace || '', trackingNumber: order.trackingNumber || '' });
    setShowEdit(true);
  }

  async function saveEdit(event) {
    event.preventDefault(); setSavingEdit(true); setEditError('');
    try {
      const payload = order.orderType === 'DIRECT'
        ? { customerId: editForm.customerId, orderDate: editForm.orderDate, deadline: editForm.deadline, priority: editForm.priority }
        : { marketplace: editForm.marketplace, trackingNumber: editForm.trackingNumber, orderDate: editForm.orderDate, deadline: editForm.deadline, priority: editForm.priority };
      const response = await fetch(`${API_BASE_URL}/api/v1/sales-orders/${salesOrderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to update sales order.');
      setShowEdit(false); await load();
    } catch (e) { setEditError(e.message); } finally { setSavingEdit(false); }
  }

  async function cancelOrder() {
    if (cancelling) return;
    if (!window.confirm(`Cancel Sales Order ${order.soNumber}? This will mark the order, active items, and related work orders inactive.`)) return;
    setCancelling(true); setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sales-orders/${salesOrderId}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to cancel sales order.');
      await load();
    } catch (e) { setError(e.message); } finally { setCancelling(false); }
  }

  async function createWorkOrders() {
    setCreatingWO(true); setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sales-orders/${salesOrderId}/work-orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to create work orders.');
      await load();
    } catch (e) { setError(e.message); } finally { setCreatingWO(false); }
  }

  function openPayment() {
    setPaymentError('');
    setPaymentForm({ amount: '', paymentMethod: '', paymentDate: new Date().toISOString().slice(0, 10), referenceNumber: '', notes: '' });
    setShowPayment(true);
  }

  async function savePayment(event) {
    event.preventDefault(); setSavingPayment(true); setPaymentError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sales-orders/${salesOrderId}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...paymentForm, amount: Number(paymentForm.amount) }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to add payment.');
      setShowPayment(false); await load();
    } catch (e) { setPaymentError(e.message); } finally { setSavingPayment(false); }
  }

  function openHandover() {
    setHandoverError(''); setHandoverForm({ handoverType: 'CUSTOMER_PICKUP', recipientName: '', courierName: '', notes: '' }); setShowHandover(true);
  }

  async function saveHandover(event) {
    event.preventDefault(); setSavingHandover(true); setHandoverError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sales-orders/${salesOrderId}/handovers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(handoverForm) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to record handover.');
      setShowHandover(false); await load();
    } catch (e) { setHandoverError(e.message); } finally { setSavingHandover(false); }
  }

  async function completeOrder() {
    if (completing || !window.confirm(`Complete Sales Order ${order.soNumber}?`)) return;
    setCompleting(true); setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sales-orders/${salesOrderId}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to complete sales order.');
      await load();
    } catch (e) { setError(e.message); } finally { setCompleting(false); }
  }

  if (loading) return <section className="state-card">Loading sales order...</section>;
  if (error || !order) return <section><div className="alert error">{error || 'Sales order not found.'}</div><button className="button secondary" type="button" onClick={onBack}>Back</button></section>;

  const items = order.items || [];
  const payments = order.payments || [];
  const workOrders = order.workOrders || [];
  const grandTotal = items.reduce((sum, item) => sum + Number(item.itemTotal || 0), 0);
  const totalPaid = order.orderType === 'MARKETPLACE' ? grandTotal : payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const balance = Math.max(0, grandTotal - totalPaid);
  const paymentStatus = order.orderType === 'MARKETPLACE' ? 'PAID' : balance === 0 && grandTotal > 0 ? 'PAID' : totalPaid > 0 ? 'PARTIALLY PAID' : 'UNPAID';
  const canEdit = ['NEW_ORDER', 'READY_PRODUCTION'].includes(order.status);
  const canCancel = ['NEW_ORDER', 'READY_PRODUCTION'].includes(order.status);
  const canCreateWO = order.orderType === 'DIRECT' && order.status === 'NEW_ORDER' && workOrders.length < items.length;
  const canHandover = order.status === 'RTS';
  const canComplete = order.status === 'RTS' && paymentStatus === 'PAID' && order.handovers?.length > 0;

  return <section>
    <div className="page-header"><div><p className="eyebrow">SALES / ORDER DETAIL</p><h1>{order.soNumber}</h1><p>{order.orderType === 'MARKETPLACE' ? `${order.marketplace} · ${order.trackingNumber}` : 'Direct Order'} · Deadline {order.deadline}</p></div><div className="page-actions">
      <button className="button secondary" type="button" onClick={onBack}>Back</button>
      {canEdit && <button className="button secondary" type="button" onClick={openEdit}>Edit</button>}
      {canCancel && <button className="button secondary text-danger" type="button" onClick={cancelOrder} disabled={cancelling}>{cancelling ? 'Cancelling...' : 'Cancel Order'}</button>}
      {canCreateWO && <button className="button primary" type="button" onClick={createWorkOrders} disabled={creatingWO}>{creatingWO ? 'Creating...' : 'Create WO'}</button>}
      {canHandover && <button className="button primary" type="button" onClick={openHandover}>Record Handover</button>}
      {canComplete && <button className="button primary" type="button" onClick={completeOrder} disabled={completing}>{completing ? 'Completing...' : 'Complete Order'}</button>}
      <button className="button secondary" type="button" onClick={() => window.print()}>Print</button>
    </div></div>
    {error && <div className="error-banner"><span>{error}</span><button type="button" onClick={load}>Retry</button></div>}

    <div className="detail-card-grid"><section className="detail-card"><h2>Order Info</h2><div className="detail-grid"><div><span>Order Type</span><strong>{order.orderType}</strong></div><div><span>Status</span><strong>{STATUS_LABELS[order.status] || order.status}</strong></div><div><span>Order Date</span><strong>{order.orderDate}</strong></div><div><span>Deadline</span><strong>{order.deadline}</strong></div><div><span>Priority</span><strong>{order.priority}</strong></div><div><span>Customer</span><strong>{order.customerName || 'Marketplace'}</strong></div></div></section>
      <section className="detail-card"><h2>Payment</h2><div className="payment-summary"><div><span>Grand Total</span><strong>Rp {money(grandTotal)}</strong></div><div><span>Total Paid</span><strong>Rp {money(totalPaid)}</strong></div><div><span>Balance</span><strong>Rp {money(balance)}</strong></div><div><span>Payment Status</span><strong>{paymentStatus}</strong></div></div>{order.orderType !== 'MARKETPLACE' && balance > 0 && <button className="button secondary" type="button" onClick={openPayment}>Add Payment</button>}{payments.length > 0 && <ul className="timeline-list">{payments.map((payment) => <li key={payment.id}><strong>{payment.paymentNumber}</strong><span>Rp {money(payment.amount)}</span></li>)}</ul>}</section></div>

    <section className="detail-card"><div className="section-heading"><h2>Items</h2><span>{items.length} item{items.length === 1 ? '' : 's'}</span></div><div className="table-wrap"><table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Total</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.itemNumber}</td><td><strong>{item.productName}</strong><br /><small>{item.sku}</small></td><td>{item.quantity} {item.productUnit}</td><td>Rp {money(item.unitPrice)}</td><td>{item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : `Rp ${money(item.discountValue)}`}</td><td>Rp {money(item.itemTotal)}</td></tr>)}</tbody></table></div></section>

    <div className="detail-card-grid"><section className="detail-card"><h2>Artwork & Production Notes</h2>{items.map((item) => <div className="item-note" key={item.id}><strong>Item {item.itemNumber} · {item.productName}</strong><p>{item.isCustom ? 'Custom / Special Request' : 'Standard item'}</p><p>{item.productionNotes || 'No production notes.'}</p><p>{item.artworkFileUrl || item.artworkDriveUrl ? 'Artwork reference available.' : 'No artwork reference.'}</p></div>)}</section><section className="detail-card"><h2>Work Orders</h2>{workOrders.length ? <ul className="timeline-list">{workOrders.map((wo) => <li key={wo.id}><strong>{wo.woNumber}</strong><span>{wo.status === 'COMPLETED_PRODUCTION' ? 'Completed Production' : STATUS_LABELS[wo.status] || wo.status}</span></li>)}</ul> : <p>No active work orders yet.</p>}</section></div>

    {showEdit && <div className="modal-backdrop" role="presentation"><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div className="modal-header"><div><p className="eyebrow">SALES / EDIT</p><h2 id="edit-title">Edit Sales Order</h2></div><button className="button secondary" type="button" onClick={() => setShowEdit(false)}>Close</button></div>{editError && <div className="alert error">{editError}</div>}<form className="entity-form" onSubmit={saveEdit}>
      {order.orderType === 'DIRECT' ? <label>Customer<select required value={editForm.customerId} onChange={(e) => setEditForm({ ...editForm, customerId: e.target.value })}><option value="">Select customer...</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.customerCode} — {customer.name}</option>)}</select></label> : <><label>Marketplace<select required value={editForm.marketplace} onChange={(e) => setEditForm({ ...editForm, marketplace: e.target.value })}><option value="">Select marketplace...</option><option value="SHOPEE">Shopee</option><option value="TOKOPEDIA">Tokopedia</option><option value="TIKTOK_SHOP">TikTok Shop</option><option value="LAZADA">Lazada</option><option value="BLIBLI">Blibli</option><option value="OTHER">Other</option></select></label><label>Tracking Number<input required value={editForm.trackingNumber} onChange={(e) => setEditForm({ ...editForm, trackingNumber: e.target.value })} /></label></>}
      <label>Order Date<input type="date" required value={editForm.orderDate} onChange={(e) => setEditForm({ ...editForm, orderDate: e.target.value })} /></label><label>Deadline<input type="date" min={editForm.orderDate} required value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} /></label><label>Priority<select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}><option value="REGULAR">Regular</option><option value="SAME_DAY">Same Day</option><option value="INSTANT">Instant</option></select></label><p className="form-hint">Order type and existing order items are not changed from this action. Changes remain allowed only before production starts.</p><div className="modal-actions"><button className="button secondary" type="button" onClick={() => setShowEdit(false)}>Cancel</button><button className="button primary" type="submit" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Changes'}</button></div>
    </form></div></div>}

    {showPayment && <div className="modal-backdrop" role="presentation"><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="payment-title"><div className="modal-header"><div><p className="eyebrow">PAYMENT</p><h2 id="payment-title">Add Payment</h2></div><button className="button secondary" type="button" onClick={() => setShowPayment(false)}>Close</button></div>{paymentError && <div className="alert error">{paymentError}</div>}<form className="entity-form" onSubmit={savePayment}><label>Amount<input type="number" min="1" max={balance} step="0.01" required value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder={`Max Rp ${money(balance)}`} /></label><label>Payment Method<select required value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}><option value="">Select method...</option>{PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}</select></label><label>Payment Date<input type="date" required value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} /></label><label>Reference Number<input value={paymentForm.referenceNumber} onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} /></label><label>Notes<textarea rows="3" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} /></label><div className="modal-actions"><button className="button secondary" type="button" onClick={() => setShowPayment(false)}>Cancel</button><button className="button primary" type="submit" disabled={savingPayment}>{savingPayment ? 'Saving...' : 'Add Payment'}</button></div></form></div></div>}

    {showHandover && <div className="modal-backdrop" role="presentation"><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="handover-title"><div className="modal-header"><div><p className="eyebrow">FULFILLMENT</p><h2 id="handover-title">Record Handover</h2></div><button className="button secondary" type="button" onClick={() => setShowHandover(false)}>Close</button></div>{handoverError && <div className="alert error">{handoverError}</div>}<form className="entity-form" onSubmit={saveHandover}><label>Handover Type<select required value={handoverForm.handoverType} onChange={(e) => setHandoverForm({ ...handoverForm, handoverType: e.target.value })}><option value="CUSTOMER_PICKUP">Customer Pickup</option><option value="COURIER">Courier</option></select></label>{handoverForm.handoverType === 'CUSTOMER_PICKUP' ? <label>Recipient Name<input required value={handoverForm.recipientName} onChange={(e) => setHandoverForm({ ...handoverForm, recipientName: e.target.value })} /></label> : <label>Courier Name<input required value={handoverForm.courierName} onChange={(e) => setHandoverForm({ ...handoverForm, courierName: e.target.value })} /></label>}<label>Notes<textarea rows="3" value={handoverForm.notes} onChange={(e) => setHandoverForm({ ...handoverForm, notes: e.target.value })} /></label><div className="modal-actions"><button className="button secondary" type="button" onClick={() => setShowHandover(false)}>Cancel</button><button className="button primary" type="submit" disabled={savingHandover}>{savingHandover ? 'Recording...' : 'Record Handover'}</button></div></form></div></div>}
  </section>;
}
