const FIELDS = `
  soi.id,
  soi.sales_order_id AS "salesOrderId",
  soi.product_id AS "productId",
  soi.item_number AS "itemNumber",
  soi.quantity,
  soi.unit_price AS "unitPrice",
  soi.discount_type AS "discountType",
  soi.discount_value AS "discountValue",
  soi.item_total AS "itemTotal",
  soi.is_custom AS "isCustom",
  soi.production_notes AS "productionNotes",
  soi.artwork_file_url AS "artworkFileUrl",
  soi.artwork_drive_url AS "artworkDriveUrl",
  soi.status,
  p.sku,
  p.name AS "productName",
  p.unit AS "productUnit"
`;

export async function listItems(db, salesOrderId) {
  const result = await db.query(`SELECT ${FIELDS} FROM sales_order_items soi JOIN products p ON p.id = soi.product_id WHERE soi.sales_order_id = $1 ORDER BY soi.item_number`, [salesOrderId]);
  return result.rows;
}

export async function createItem(db, item) {
  const result = await db.query(
    `INSERT INTO sales_order_items (sales_order_id, product_id, item_number, quantity, unit_price, discount_type, discount_value, item_total, is_custom, production_notes, artwork_file_url, artwork_drive_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [item.salesOrderId, item.productId, item.itemNumber, item.quantity, item.unitPrice, item.discountType, item.discountValue, item.itemTotal, item.isCustom, item.productionNotes, item.artworkFileUrl, item.artworkDriveUrl],
  );
  return result.rows[0];
}

export async function deactivateActiveItems(db, salesOrderId) {
  const result = await db.query(`UPDATE sales_order_items SET status = 'INACTIVE', updated_at = NOW() WHERE sales_order_id = $1 AND status = 'ACTIVE' RETURNING id`, [salesOrderId]);
  return result.rowCount;
}
