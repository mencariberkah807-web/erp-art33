export async function getDashboardSummary(db) {
  const result = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE status <> 'INACTIVE')::int AS total_so,
      COUNT(*) FILTER (WHERE status = 'READY_PRODUCTION')::int AS ready_wo,
      COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS delivered,
      COUNT(*) FILTER (
        WHERE status NOT IN ('INACTIVE', 'COMPLETED')
          AND order_type = 'DIRECT'
          AND COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.sales_order_id = so.id AND p.status = 'ACTIVE'), 0) > 0
          AND COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.sales_order_id = so.id AND p.status = 'ACTIVE'), 0) < COALESCE((SELECT SUM(soi.item_total) FROM sales_order_items soi WHERE soi.sales_order_id = so.id AND soi.status = 'ACTIVE'), 0)
      )::int AS dp_paid
    FROM sales_orders so
  `);

  const production = await db.query(`
    SELECT status, COUNT(*)::int AS total
    FROM work_orders
    WHERE status <> 'INACTIVE'
    GROUP BY status
  `);

  const fulfillment = await db.query(`
    SELECT status, COUNT(*)::int AS total
    FROM sales_orders
    WHERE status IN ('PACKING', 'RTS')
    GROUP BY status
  `);

  const recent = await db.query(`
    SELECT so.id, so.so_number AS "soNumber", so.order_date AS "orderDate",
           so.status, so.order_type AS "orderType", c.name AS "customerName"
    FROM sales_orders so
    LEFT JOIN customers c ON c.id = so.customer_id
    ORDER BY so.created_at DESC
    LIMIT 8
  `);

  return { summary: result.rows[0], production: production.rows, fulfillment: fulfillment.rows, recent: recent.rows };
}
