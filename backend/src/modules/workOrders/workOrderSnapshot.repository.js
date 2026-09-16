export async function createSnapshot(db, snapshot) {
  const { rows } = await db.query(`INSERT INTO work_order_snapshots (work_order_id, customer_name, product_name, quantity, material, specification, dimension, color, thickness, production_notes, artwork_file_url, artwork_drive_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id, work_order_id AS "workOrderId", customer_name AS "customerName", product_name AS "productName", quantity, material, specification, dimension, color, thickness, production_notes AS "productionNotes", artwork_file_url AS "artworkFileUrl", artwork_drive_url AS "artworkDriveUrl", created_at AS "createdAt"`, [snapshot.workOrderId, snapshot.customerName, snapshot.productName, snapshot.quantity, snapshot.material, snapshot.specification, snapshot.dimension, snapshot.color, snapshot.thickness, snapshot.productionNotes, snapshot.artworkFileUrl, snapshot.artworkDriveUrl]);
  return rows[0];
}

export async function updateCustomerNameBySalesOrder(db, salesOrderId, customerName) {
  await db.query(`UPDATE work_order_snapshots wos SET customer_name = $2 WHERE wos.work_order_id IN (SELECT wo.id FROM work_orders wo WHERE wo.sales_order_id = $1 AND wo.status = 'READY_FOR_PRODUCTION')`, [salesOrderId, customerName]);
}

export async function updateBySalesOrderItem(db, salesOrderItemId, snapshot) {
  const { rows } = await db.query(
    `UPDATE work_order_snapshots wos
     SET customer_name = $2, product_name = $3, quantity = $4, material = $5, specification = $6,
         dimension = $7, color = $8, thickness = $9, production_notes = $10,
         artwork_file_url = $11, artwork_drive_url = $12
     WHERE wos.work_order_id IN (
       SELECT wo.id FROM work_orders wo
       WHERE wo.sales_order_item_id = $1 AND wo.status = 'READY_FOR_PRODUCTION'
     )
     RETURNING wos.id, wos.work_order_id AS "workOrderId"`,
    [salesOrderItemId, snapshot.customerName, snapshot.productName, snapshot.quantity, snapshot.material, snapshot.specification, snapshot.dimension, snapshot.color, snapshot.thickness, snapshot.productionNotes, snapshot.artworkFileUrl, snapshot.artworkDriveUrl],
  );
  return rows[0] ?? null;
}
