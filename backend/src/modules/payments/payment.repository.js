export const FIELDS = `id, payment_number AS "paymentNumber", sales_order_id AS "salesOrderId", amount, payment_method AS "paymentMethod", payment_date AS "paymentDate", reference_number AS "referenceNumber", notes, status, created_by AS "createdBy", created_at AS "createdAt"`;

export async function nextPaymentNumber(db) {
  // Serialize payment-number allocation inside the surrounding transaction so
  // concurrent payments cannot derive the same PAY number from MAX(...).
  await db.query(`SELECT pg_advisory_xact_lock(824031)`);
  const { rows } = await db.query(`SELECT COALESCE(MAX(NULLIF(regexp_replace(payment_number, '\\D', '', 'g'), '')::BIGINT), 0) + 1 AS next_number FROM payments`);
  return `PAY-${String(rows[0].next_number).padStart(6, '0')}`;
}

async function paymentContextQuery(db, salesOrderId, lock) {
  const { rows } = await db.query(`
    SELECT so.order_type AS "orderType",
           COALESCE((SELECT SUM(soi.item_total) FROM sales_order_items soi WHERE soi.sales_order_id = so.id AND soi.status = 'ACTIVE'), 0) AS "grandTotal",
           COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.sales_order_id = so.id AND p.status = 'ACTIVE'), 0) AS "totalPaid"
    FROM sales_orders so WHERE so.id = $1 ${lock ? 'FOR UPDATE' : ''}`, [salesOrderId]);
  return rows[0] ?? null;
}

export async function getPaymentContext(db, salesOrderId) {
  return paymentContextQuery(db, salesOrderId, false);
}

export async function getPaymentContextForUpdate(db, salesOrderId) {
  return paymentContextQuery(db, salesOrderId, true);
}

export async function createPayment(db, payment) {
  const { rows } = await db.query(`INSERT INTO payments (payment_number, sales_order_id, amount, payment_method, payment_date, reference_number, notes, status, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${FIELDS}`, [payment.paymentNumber, payment.salesOrderId, payment.amount, payment.paymentMethod, payment.paymentDate, payment.referenceNumber, payment.notes, payment.status || 'ACTIVE', payment.createdBy]);
  return rows[0];
}

export async function listPaymentsBySalesOrder(db, salesOrderId) {
  const { rows } = await db.query(`SELECT ${FIELDS} FROM payments WHERE sales_order_id = $1 AND status = 'ACTIVE' ORDER BY payment_date DESC, created_at DESC`, [salesOrderId]);
  return rows;
}
