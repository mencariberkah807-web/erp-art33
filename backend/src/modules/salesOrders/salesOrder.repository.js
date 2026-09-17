const FIELDS = `
  id,
  so_number AS "soNumber",
  order_type AS "orderType",
  customer_id AS "customerId",
  marketplace,
  tracking_number AS "trackingNumber",
  order_date AS "orderDate",
  deadline,
  priority,
  status,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export async function listSalesOrders(pool, { page, pageSize, search, status }) {
  const values = []; const conditions = [];
  if (search) { values.push(`%${search}%`); conditions.push(`(so.so_number ILIKE $${values.length} OR so.tracking_number ILIKE $${values.length})`); }
  if (status) { values.push(status); conditions.push(`so.status = $${values.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const count = await pool.query(`SELECT COUNT(*)::int AS total FROM sales_orders so ${where}`, values);
  const offset = (page - 1) * pageSize; values.push(pageSize, offset);
  const result = await pool.query(
    `SELECT
       so.id,
       so.so_number AS "soNumber",
       so.order_type AS "orderType",
       so.customer_id AS "customerId",
       so.marketplace,
       so.tracking_number AS "trackingNumber",
       so.order_date AS "orderDate",
       so.deadline,
       so.priority,
       so.status,
       so.created_at AS "createdAt",
       so.updated_at AS "updatedAt",
       CASE WHEN c.company IS NOT NULL AND c.company <> '' THEN c.name || ' — ' || c.company ELSE c.name END AS "customerName",
       COALESCE(items.product_name, '—') AS "productName"
     FROM sales_orders so
     LEFT JOIN customers c ON c.id = so.customer_id
     LEFT JOIN LATERAL (
       SELECT string_agg(p.name, ' + ' ORDER BY soi.item_number) AS product_name
       FROM sales_order_items soi
       JOIN products p ON p.id = soi.product_id
       WHERE soi.sales_order_id = so.id AND soi.status = 'ACTIVE'
     ) items ON TRUE
     ${where}
     ORDER BY so.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );
  return { rows: result.rows, total: count.rows[0].total };
}

export async function findSalesOrderById(pool, id, forUpdate = false) {
  const result = await pool.query(`SELECT ${FIELDS} FROM sales_orders WHERE id = $1${forUpdate ? ' FOR UPDATE' : ''}`, [id]);
  return result.rows[0] ?? null;
}

export async function nextSalesOrderNumber(db) {
  const result = await db.query(`SELECT COALESCE(MAX(NULLIF(regexp_replace(so_number, '\\D', '', 'g'), '')::BIGINT), 0) + 1 AS next_number FROM sales_orders`);
  return `SO-${String(result.rows[0].next_number).padStart(6, '0')}`;
}

export async function createSalesOrder(db, order) {
  const result = await db.query(
    `INSERT INTO sales_orders (so_number, order_type, customer_id, marketplace, tracking_number, order_date, deadline, priority)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${FIELDS}`,
    [order.soNumber, order.orderType, order.customerId, order.marketplace, order.trackingNumber, order.orderDate, order.deadline, order.priority],
  );
  return result.rows[0];
}

export async function updateSalesOrder(db, id, order) {
  const result = await db.query(
    `UPDATE sales_orders
     SET customer_id = $2, marketplace = $3, tracking_number = $4, order_date = $5, deadline = $6, priority = $7, updated_at = NOW()
     WHERE id = $1
     RETURNING ${FIELDS}`,
    [id, order.customerId, order.marketplace, order.trackingNumber, order.orderDate, order.deadline, order.priority],
  );
  return result.rows[0] ?? null;
}

export async function cancelSalesOrder(db, id) {
  const result = await db.query(`UPDATE sales_orders SET status = 'INACTIVE', updated_at = NOW() WHERE id = $1 RETURNING ${FIELDS}`, [id]);
  return result.rows[0] ?? null;
}
