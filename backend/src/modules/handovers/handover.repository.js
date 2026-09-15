export const FIELDS = `id, sales_order_id AS "salesOrderId", handover_type AS "handoverType", recipient_name AS "recipientName", courier_name AS "courierName", handover_at AS "handoverAt", handed_over_by AS "handedOverBy", notes, created_at AS "createdAt"`;

export async function listHandovers(db) {
  const { rows } = await db.query(`SELECT ${FIELDS}, so.so_number AS "salesOrderNumber" FROM handovers h JOIN sales_orders so ON so.id = h.sales_order_id ORDER BY h.handover_at DESC`);
  return rows;
}

export async function createHandover(db, data) {
  const { rows } = await db.query(`INSERT INTO handovers (sales_order_id, handover_type, recipient_name, courier_name, handover_at, handed_over_by, notes) VALUES ($1,$2,$3,$4,COALESCE($5,NOW()),$6,$7) RETURNING ${FIELDS}`, [data.salesOrderId, data.handoverType, data.recipientName || null, data.courierName || null, data.handoverAt || null, data.handedOverBy || null, data.notes || null]);
  return rows[0];
}
