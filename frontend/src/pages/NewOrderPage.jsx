import React from 'react';

export default function NewOrderPage({ onSelect, onCancel }) {
  return (
    <section className="page-section">
      <div className="page-header">
        <div><p className="eyebrow">SALES / NEW ORDER</p><h1>New Order</h1><p className="page-description">Choose the order channel before entering the transaction.</p></div>
      </div>
      <div className="order-gate-grid">
        <button className="order-gate-card" type="button" onClick={() => onSelect('DIRECT')}><span className="gate-kicker">DIRECT</span><strong>Direct Order</strong><span>Create a customer order with customer and payment information.</span></button>
        <button className="order-gate-card" type="button" onClick={() => onSelect('MARKETPLACE')}><span className="gate-kicker">MARKETPLACE</span><strong>Marketplace Order</strong><span>Create an order from Shopee, Tokopedia, TikTok Shop, Lazada, Blibli, or Other.</span></button>
      </div>
      <div className="form-actions"><button className="secondary-button" type="button" onClick={onCancel}>Cancel</button></div>
    </section>
  );
}
