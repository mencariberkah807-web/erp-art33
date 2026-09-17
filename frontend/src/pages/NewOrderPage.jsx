import React, { useState } from 'react';
import DirectOrderPage from './DirectOrderPage.jsx';

export default function NewOrderPage({ onSelect, onCancel }) {
  const [orderType, setOrderType] = useState('DIRECT');

  function handleCreated(data) {
    onSelect('CREATED', data);
  }

  return <section className="new-order-page">
    <div className="new-order-header">
      <div>
        <p className="eyebrow">SALES / NEW ORDER</p>
        <h1>New Order</h1>
        <p className="page-description">Create a Direct Order or Marketplace Order without leaving this page.</p>
      </div>
    </div>

    <section className="new-order-type-card">
      <div className="new-order-type-title">Order Type</div>
      <div className="new-order-type-options" role="radiogroup" aria-label="Order type">
        <label className={orderType === 'DIRECT' ? 'active' : ''}>
          <input type="radio" name="new-order-type" value="DIRECT" checked={orderType === 'DIRECT'} onChange={() => setOrderType('DIRECT')} />
          <span>Direct Order</span>
        </label>
        <label className={orderType === 'MARKETPLACE' ? 'active' : ''}>
          <input type="radio" name="new-order-type" value="MARKETPLACE" checked={orderType === 'MARKETPLACE'} onChange={() => setOrderType('MARKETPLACE')} />
          <span>Marketplace</span>
        </label>
      </div>
    </section>

    <div className="new-order-form-pane">
      <DirectOrderPage orderType={orderType} onCancel={onCancel} onCreated={handleCreated} />
    </div>
  </section>;
}
