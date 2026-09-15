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
  const values = [];
  const conditions = [];
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(so_number ILIKE $${values.length} OR tracking_number ILIKE $${values.length})`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const count = await pool.query(`SELECT COUNT(*)::int AS total FROM sales_orders ${where}`, values);
  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);
  const result = await pool.query(`SELECT ${FIELDS} FROM sales_orders ${where} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
  return { rows: result.rows, total: count.rows[0].total };
}

export async function findSalesOrderById(pool, id) {
  const result = await pool.query(`SELECT ${FIELDS} FROM sales_orders WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function nextSalesOrderNumber(pool) {
  const result = await pool.query(`SELECT COALESCE(MAX(NULLIF(regexp_replace(so_number, '\\D', '', 'g'), '')::bigint), 0) + 1 AS next_number FROM sales_orders`);
  return `SO-${String(result.rows[0].next_number).padStart(6, '0')}`;
}

export async function createSalesOrder(pool, order) {
  const result = await pool.query(
    `INSERT INTO sales_orders (so_number, order_type, customer_id, marketplace, tracking_number, order_date, deadline, priority)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${FIELDS}`,
    [order.soNumber, order.orderType, order.customerId, order.marketplace, order.trackingNumber, order.orderDate, order.deadline, order.priority],
  );
  return result.rows[0];
}
