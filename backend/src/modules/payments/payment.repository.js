export const FIELDS = `id, payment_number AS "paymentNumber", sales_order_id AS "salesOrderId", amount, payment_method AS "paymentMethod", payment_date AS "paymentDate", reference_number AS "referenceNumber", notes, status, created_by AS "createdBy", created_at AS "createdAt"`;

export async function nextPaymentNumber(db) {
  const { rows } = await db.query(`SELECT COALESCE(MAX(NULLIF(regexp_replace(payment_number, '\\D', '', 'g'), '')::BIGINT), 0) + 1 AS next_number FROM payments`);
  return `PAY-${String(rows[0].next_number).padStart(6, '0')}`;
}

export async function createPayment(db, payment) {
  const { rows } = await db.query(`INSERT INTO payments (payment_number, sales_order_id, amount, payment_method, payment_date, reference_number, notes, status, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${FIELDS}`, [payment.paymentNumber, payment.salesOrderId, payment.amount, payment.paymentMethod, payment.paymentDate, payment.referenceNumber, payment.notes, payment.status || 'ACTIVE', payment.createdBy]);
  return rows[0];
}

export async function listPaymentsBySalesOrder(db, salesOrderId) {
  const { rows } = await db.query(`SELECT ${FIELDS} FROM payments WHERE sales_order_id = $1 AND status = 'ACTIVE' ORDER BY payment_date DESC, created_at DESC`, [salesOrderId]);
  return rows;
}
