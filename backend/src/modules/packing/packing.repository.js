export const FIELDS = `po.id, po.sales_order_id AS "salesOrderId", so.so_number AS "salesOrderNumber", po.packed_at AS "packedAt", po.packed_by AS "packedBy", po.notes, po.status, po.created_at AS "createdAt"`;

export async function listPackingOrders(db) {
  const { rows } = await db.query(`SELECT ${FIELDS} FROM packing_orders po JOIN sales_orders so ON so.id = po.sales_order_id ORDER BY po.created_at DESC`);
  return rows;
}

export async function findBySalesOrderId(db, salesOrderId, forUpdate = false) {
  const { rows } = await db.query(`SELECT ${FIELDS} FROM packing_orders po JOIN sales_orders so ON so.id = po.sales_order_id WHERE po.sales_order_id = $1${forUpdate ? ' FOR UPDATE' : ''}`, [salesOrderId]);
  return rows[0] ?? null;
}

export async function createPending(db, salesOrderId) {
  const { rows } = await db.query(`INSERT INTO packing_orders (sales_order_id, status) VALUES ($1, 'PENDING') ON CONFLICT (sales_order_id) DO UPDATE SET sales_order_id = EXCLUDED.sales_order_id RETURNING id, sales_order_id AS "salesOrderId", packed_at AS "packedAt", packed_by AS "packedBy", notes, status, created_at AS "createdAt"`, [salesOrderId]);
  return rows[0];
}

export async function pack(db, salesOrderId, packedBy = null, notes = null) {
  const { rows } = await db.query(`UPDATE packing_orders SET status = 'PACKED', packed_at = COALESCE(packed_at, NOW()), packed_by = COALESCE($2, packed_by), notes = COALESCE($3, notes) WHERE sales_order_id = $1 AND status = 'PENDING' RETURNING id, sales_order_id AS "salesOrderId", packed_at AS "packedAt", packed_by AS "packedBy", notes, status, created_at AS "createdAt"`, [salesOrderId, packedBy, notes]);
  return rows[0] ?? null;
}
