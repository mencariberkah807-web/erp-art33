export const FIELDS = `id, wo_number AS "woNumber", sales_order_id AS "salesOrderId", sales_order_item_id AS "salesOrderItemId", status, started_at AS "startedAt", completed_at AS "completedAt", rts_at AS "rtsAt", created_at AS "createdAt", updated_at AS "updatedAt"`;

export async function nextWorkOrderNumber(db) {
  const { rows } = await db.query(`SELECT 'WO-' || LPAD((COALESCE(MAX(NULLIF(regexp_replace(wo_number, '\\D', '', 'g'), ''))::BIGINT, 0) + 1)::TEXT, 6, '0') AS number FROM work_orders FOR UPDATE`);
  return rows[0].number;
}

export async function createWorkOrder(db, workOrder) {
  const { rows } = await db.query(`INSERT INTO work_orders (wo_number, sales_order_id, sales_order_item_id, status) VALUES ($1,$2,$3,$4) RETURNING ${FIELDS}`, [workOrder.woNumber, workOrder.salesOrderId, workOrder.salesOrderItemId, workOrder.status || 'READY_FOR_PRODUCTION']);
  return rows[0];
}

export async function findWorkOrderById(db, id, forUpdate = false) {
  const { rows } = await db.query(`SELECT ${FIELDS} FROM work_orders WHERE id = $1${forUpdate ? ' FOR UPDATE' : ''}`, [id]);
  return rows[0] ?? null;
}

export async function listWorkOrders(db, { page, pageSize, search, status }) {
  const values = [];
  const conditions = [];
  if (status) { values.push(status); conditions.push(`wo.status = $${values.length}`); }
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(wo.wo_number ILIKE $${values.length} OR so.so_number ILIKE $${values.length} OR COALESCE(c.name, '') ILIKE $${values.length} OR p.name ILIKE $${values.length})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const count = await db.query(`SELECT COUNT(*)::int AS total FROM work_orders wo JOIN sales_orders so ON so.id = wo.sales_order_id LEFT JOIN customers c ON c.id = so.customer_id JOIN sales_order_items soi ON soi.id = wo.sales_order_item_id JOIN products p ON p.id = soi.product_id ${where}`, values);
  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);
  const result = await db.query(`SELECT ${FIELDS}, so.so_number AS "salesOrderNumber", c.name AS "customerName", p.sku, p.name AS "productName", soi.quantity FROM work_orders wo JOIN sales_orders so ON so.id = wo.sales_order_id LEFT JOIN customers c ON c.id = so.customer_id JOIN sales_order_items soi ON soi.id = wo.sales_order_item_id JOIN products p ON p.id = soi.product_id ${where} ORDER BY wo.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
  return { rows: result.rows, total: count.rows[0].total };
}

export async function startWorkOrder(db, id, startedAt = new Date()) {
  const { rows } = await db.query(`UPDATE work_orders SET status = 'IN_PRODUCTION', started_at = COALESCE(started_at, $2), updated_at = NOW() WHERE id = $1 AND status = 'READY_FOR_PRODUCTION' RETURNING ${FIELDS}`, [id, startedAt]);
  return rows[0] ?? null;
}

export async function completeWorkOrder(db, id, completedAt = new Date()) {
  const { rows } = await db.query(`UPDATE work_orders SET status = 'COMPLETED_PRODUCTION', completed_at = COALESCE(completed_at, $2), updated_at = NOW() WHERE id = $1 AND status = 'IN_PRODUCTION' RETURNING ${FIELDS}`, [id, completedAt]);
  return rows[0] ?? null;
}

export async function listBySalesOrder(db, salesOrderId) {
  const { rows } = await db.query(`SELECT ${FIELDS} FROM work_orders WHERE sales_order_id = $1 AND status <> 'INACTIVE' ORDER BY created_at ASC`, [salesOrderId]);
  return rows;
}
