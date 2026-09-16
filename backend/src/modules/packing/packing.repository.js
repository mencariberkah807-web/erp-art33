export const FIELDS = `
  po.id,
  po.sales_order_id AS "salesOrderId",
  so.so_number AS "salesOrderNumber",
  so.order_date AS "orderDate",
  so.deadline,
  so.priority,
  so.order_type AS "orderType",
  so.customer_id AS "customerId",
  c.name AS "customerName",
  po.packed_at AS "packedAt",
  po.packed_by AS "packedBy",
  po.notes,
  po.status,
  po.created_at AS "createdAt"
`;

export async function listPackingOrders(db) {
  const { rows } = await db.query(`
    SELECT ${FIELDS}
    FROM packing_orders po
    JOIN sales_orders so ON so.id = po.sales_order_id
    LEFT JOIN customers c ON c.id = so.customer_id
    WHERE po.status = 'PENDING'
      AND so.status = 'PACKING'
      AND EXISTS (
        SELECT 1
        FROM sales_order_items soi
        JOIN work_orders wo ON wo.sales_order_item_id = soi.id
        WHERE soi.sales_order_id = so.id
          AND soi.status = 'ACTIVE'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM sales_order_items soi
        LEFT JOIN work_orders wo ON wo.sales_order_item_id = soi.id
        WHERE soi.sales_order_id = so.id
          AND soi.status = 'ACTIVE'
          AND (wo.id IS NULL OR wo.status <> 'COMPLETED_PRODUCTION')
      )
    ORDER BY so.deadline ASC NULLS LAST, po.created_at ASC
  `);
  return rows;
}

export async function findBySalesOrderId(db, salesOrderId, forUpdate = false) {
  const { rows } = await db.query(`SELECT ${FIELDS} FROM packing_orders po JOIN sales_orders so ON so.id = po.sales_order_id LEFT JOIN customers c ON c.id = so.customer_id WHERE po.sales_order_id = $1${forUpdate ? ' FOR UPDATE OF po' : ''}`, [salesOrderId]);
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
