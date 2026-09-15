export async function createSnapshotSource(db, salesOrderId, itemId) {
  const { rows } = await db.query(`SELECT c.name AS customer_name, p.name AS product_name, p.material, p.specification, p.dimension, p.color, p.thickness, soi.quantity, soi.production_notes, soi.artwork_file_url, soi.artwork_drive_url FROM sales_order_items soi JOIN products p ON p.id = soi.product_id LEFT JOIN sales_orders so ON so.id = soi.sales_order_id LEFT JOIN customers c ON c.id = so.customer_id WHERE soi.sales_order_id = $1 AND soi.id = $2 AND soi.status = 'ACTIVE'`, [salesOrderId, itemId]);
  return rows[0] ?? null;
}
