import React, { useState } from 'react';

function money(value) { return Number(value || 0).toLocaleString('id-ID'); }
function formatDate(value) { if (!value) return '—'; const date = new Date(value); if (Number.isNaN(date.getTime())) return String(value); return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date); }

export default function InvoicePrint({ order, items, payments, grandTotal, totalPaid, balance, paymentStatus }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('A4');

  function print() { window.print(); }

  return <>
    <button className="button secondary" type="button" onClick={() => setOpen(true)}>Print</button>
    {open && <div className="print-preview-backdrop" role="presentation">
      <div className={`print-preview ${mode === 'THERMAL' ? 'thermal-mode' : ''}`} role="dialog" aria-modal="true" aria-labelledby="print-title">
        <div className="print-toolbar">
          <div><p className="eyebrow">PRINT PREVIEW</p><h2 id="print-title">Sales Order Invoice</h2></div>
          <div className="print-toolbar-actions"><button className={`button ${mode === 'A4' ? 'primary' : 'secondary'}`} type="button" onClick={() => setMode('A4')}>A4</button><button className={`button ${mode === 'THERMAL' ? 'primary' : 'secondary'}`} type="button" onClick={() => setMode('THERMAL')}>80mm</button><button className="button primary" type="button" onClick={print}>Print</button><button className="button secondary" type="button" onClick={() => setOpen(false)}>Close</button></div>
        </div>
        <div className="print-canvas">
          <article className="invoice-sheet">
            <header className="invoice-head"><div><div className="invoice-company">ARTKRILIK WORKS</div><div className="invoice-subtitle">Sales Order Invoice</div></div><div className="invoice-title"><h1>INVOICE</h1><strong>{order.soNumber}</strong></div></header>
            <section className="invoice-meta"><div><div className="invoice-label">Bill To</div><strong>{order.customerName || 'Marketplace'}</strong><div>{order.trackingNumber || '—'}</div></div><div><div className="invoice-label">Order Information</div><div>Order Date: <strong>{formatDate(order.orderDate)}</strong></div><div>Deadline: <strong>{formatDate(order.deadline)}</strong></div><div>Order Type: <strong>{order.orderType}</strong></div><div>Payment Status: <strong>{paymentStatus}</strong></div></div></section>
            <section className="invoice-items"><table><thead><tr><th>PRODUCT</th><th>QTY</th><th>UNIT PRICE</th><th>DISCOUNT</th><th>TOTAL</th></tr></thead><tbody>{items.filter(item => item.status !== 'INACTIVE').map(item => <tr key={item.id}><td><strong>{item.productName}</strong><br /><small>{item.sku || ''}</small></td><td>{item.quantity}</td><td>Rp {money(item.unitPrice)}</td><td>{item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : `Rp ${money(item.discountValue)}`}</td><td className="invoice-num">Rp {money(item.itemTotal)}</td></tr>)}</tbody></table></section>
            <section className="invoice-totals"><div><span>Subtotal</span><strong>Rp {money(items.filter(item => item.status !== 'INACTIVE').reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0))}</strong></div><div><span>Discount</span><strong>Rp {money(Math.max(0, items.filter(item => item.status !== 'INACTIVE').reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0) - grandTotal))}</strong></div><div className="invoice-grand"><span>Grand Total</span><strong>Rp {money(grandTotal)}</strong></div></section>
            <section className="invoice-payment"><div className="invoice-label">Payment Summary</div><div className="invoice-payment-grid"><div><span>Paid</span><strong>Rp {money(totalPaid)}</strong></div><div><span>Balance</span><strong>Rp {money(balance)}</strong></div><div><span>Status</span><strong>{paymentStatus}</strong></div></div></section>
            {payments.length > 0 && <section className="invoice-payment-history"><div className="invoice-label">Payment History</div>{payments.map(payment => <div key={payment.id}><span>{payment.paymentNumber} · {payment.paymentMethod}</span><strong>Rp {money(payment.amount)}</strong></div>)}</section>}
            <footer className="invoice-footer">ARTKRILIK WORKS · Sales Order Invoice · {order.soNumber}</footer>
          </article>
        </div>
      </div>
    </div>}
  </>;
}
