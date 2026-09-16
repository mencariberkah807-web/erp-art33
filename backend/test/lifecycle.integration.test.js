import assert from 'node:assert/strict';
import { test } from 'node:test';
import app from '../src/app.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let pg;
try { pg = require('pg'); } catch { pg = null; }

const databaseUrl = process.env.DATABASE_URL;

async function listen() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

const integrationTest = databaseUrl && pg ? test : test.skip;

integrationTest('ERP lifecycle API reaches COMPLETED for a direct order', async () => {
  const server = await listen();
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  const client = new pg.Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    const customer = await client.query(`SELECT id FROM customers WHERE status = 'ACTIVE' LIMIT 1`);
    const product = await client.query(`SELECT id FROM products WHERE status = 'ACTIVE' LIMIT 1`);
    assert.ok(customer.rows[0], 'integration database needs an active customer');
    assert.ok(product.rows[0], 'integration database needs an active product');

    const orderResponse = await fetch(`${base}/api/v1/sales-orders`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        orderType: 'DIRECT', customerId: customer.rows[0].id,
        orderDate: '2026-01-01', deadline: '2026-01-02', priority: 'REGULAR',
        items: [{ productId: product.rows[0].id, quantity: 1, unitPrice: 1000, discountType: 'NOMINAL', discountValue: 0 }],
      }),
    });
    assert.equal(orderResponse.status, 201);
    const order = (await orderResponse.json()).data;
    assert.equal(order.status, 'NEW_ORDER');

    const woResponse = await fetch(`${base}/api/v1/sales-orders/${order.id}/work-orders`, { method: 'POST' });
    assert.equal(woResponse.status, 201);
    const workOrders = (await woResponse.json()).data;
    assert.equal(workOrders.length, 1);

    const readyResponse = await fetch(`${base}/api/v1/sales-orders/${order.id}/ready-production`, { method: 'POST' });
    assert.equal(readyResponse.status, 200);

    const startResponse = await fetch(`${base}/api/v1/work-orders/${workOrders[0].id}/start`, { method: 'POST' });
    assert.equal(startResponse.status, 200);

    const completeWoResponse = await fetch(`${base}/api/v1/work-orders/${workOrders[0].id}/complete`, { method: 'POST' });
    assert.equal(completeWoResponse.status, 200);
    const completedWo = (await completeWoResponse.json()).data;
    assert.equal(completedWo.status, 'COMPLETED_PRODUCTION');

    const packingResponse = await fetch(`${base}/api/v1/packing/${order.id}/pack`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notes: 'Integration test packing' }),
    });
    assert.equal(packingResponse.status, 200);
    const packed = (await packingResponse.json()).data;
    assert.equal(packed.salesOrder.status, 'RTS');

    const handoverResponse = await fetch(`${base}/api/v1/sales-orders/${order.id}/handovers`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ handoverType: 'CUSTOMER_PICKUP', recipientName: 'Integration Test' }),
    });
    assert.equal(handoverResponse.status, 201);

    const blockedCompletion = await fetch(`${base}/api/v1/sales-orders/${order.id}/complete`, { method: 'POST' });
    assert.equal(blockedCompletion.status, 400);

    const paymentResponse = await fetch(`${base}/api/v1/sales-orders/${order.id}/payments`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amount: 1000, paymentMethod: 'Cash', paymentDate: '2026-01-02' }),
    });
    assert.equal(paymentResponse.status, 201);

    const completeResponse = await fetch(`${base}/api/v1/sales-orders/${order.id}/complete`, { method: 'POST' });
    assert.equal(completeResponse.status, 200);
    const completed = (await completeResponse.json()).data;
    assert.equal(completed.status, 'COMPLETED');
  } finally {
    await client.end().catch(() => {});
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
