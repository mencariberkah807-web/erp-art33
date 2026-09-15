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
