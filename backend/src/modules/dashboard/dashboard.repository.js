export async function getDashboardSummary(db) {
  const result = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE so.status <> 'INACTIVE')::int AS total_so,
      COUNT(*) FILTER (WHERE so.status = 'NEW_ORDER')::int AS draft,
      COUNT(*) FILTER (WHERE so.status = 'READY_PRODUCTION')::int AS ready_wo,
      COUNT(*) FILTER (WHERE so.status = 'COMPLETED')::int AS delivered,
      COUNT(*) FILTER (
        WHERE so.status <> 'INACTIVE'
          AND so.order_type = 'DIRECT'
          AND COALESCE(pay.total_paid, 0) > 0
          AND COALESCE(pay.total_paid, 0) < COALESCE(items.total_items, 0)
      )::int AS dp_paid
    FROM sales_orders so
    LEFT JOIN (
      SELECT sales_order_id, SUM(amount) AS total_paid
      FROM payments
      WHERE status = 'ACTIVE'
      GROUP BY sales_order_id
    ) pay ON pay.sales_order_id = so.id
    LEFT JOIN (
      SELECT sales_order_id, SUM(item_total) AS total_items
      FROM sales_order_items
      WHERE status = 'ACTIVE'
      GROUP BY sales_order_id
    ) items ON items.sales_order_id = so.id
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
