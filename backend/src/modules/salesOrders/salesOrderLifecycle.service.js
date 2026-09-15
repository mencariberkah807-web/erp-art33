import * as salesOrderRepository from './salesOrder.repository.js';
import * as itemRepository from './salesOrderItems.repository.js';

function error(code, message) { return Object.assign(new Error(message), { code }); }

export async function markReadyForProduction(pool, salesOrderId) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const salesOrder = await salesOrderRepository.findSalesOrderById(db, salesOrderId);
    if (!salesOrder) throw error('NOT_FOUND', 'Sales order not found.');
    if (salesOrder.orderType === 'MARKETPLACE') throw error('VALIDATION_ERROR', 'Marketplace orders are ready for production atomically at creation.');
    if (salesOrder.status !== 'NEW_ORDER') throw error('VALIDATION_ERROR', 'Sales order must be NEW ORDER before it can be marked ready for production.');
    const items = await itemRepository.listItems(db, salesOrderId);
    const activeItems = items.filter((item) => item.status === 'ACTIVE');
    if (!activeItems.length) throw error('VALIDATION_ERROR', 'At least one active sales order item is required.');
    const workOrders = await db.query(`SELECT sales_order_item_id AS "salesOrderItemId" FROM work_orders WHERE sales_order_id = $1 AND status <> 'INACTIVE'`, [salesOrderId]);
    const workOrderItemIds = new Set(workOrders.rows.map((row) => row.salesOrderItemId));
    if (activeItems.some((item) => !workOrderItemIds.has(item.id))) throw error('VALIDATION_ERROR', 'Every active sales order item must have an active work order before production can start.');
    const result = await db.query(`UPDATE sales_orders SET status = 'READY_PRODUCTION', updated_at = NOW() WHERE id = $1 AND status = 'NEW_ORDER' RETURNING id`, [salesOrderId]);
    if (!result.rows[0]) throw error('CONFLICT', 'Sales order changed before it could be marked ready for production.');
    await db.query('COMMIT');
    return salesOrderRepository.findSalesOrderById(db, salesOrderId);
  } catch (e) { await db.query('ROLLBACK'); throw e; }
  finally { db.release(); }
}

export async function completeSalesOrder(pool, salesOrderId, { isAdmin = true } = {}) {
  if (!isAdmin) throw error('FORBIDDEN', 'Only Admin can complete a sales order.');
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const orderResult = await db.query(`SELECT id, order_type AS "orderType", status FROM sales_orders WHERE id = $1 FOR UPDATE`, [salesOrderId]);
    const order = orderResult.rows[0];
    if (!order) throw error('NOT_FOUND', 'Sales order not found.');
    if (order.status !== 'RTS') throw error('VALIDATION_ERROR', `Sales order cannot be completed from ${order.status}.`);
    const handoverResult = await db.query(`SELECT COUNT(*)::int AS count FROM handovers WHERE sales_order_id = $1`, [salesOrderId]);
    if (handoverResult.rows[0].count === 0) throw error('VALIDATION_ERROR', 'A handover event is required before completing the sales order.');
    const totalResult = await db.query(`SELECT COALESCE(SUM(item_total), 0)::numeric AS total FROM sales_order_items WHERE sales_order_id = $1 AND status = 'ACTIVE'`, [salesOrderId]);
    const paidResult = await db.query(`SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments WHERE sales_order_id = $1 AND status = 'ACTIVE'`, [salesOrderId]);
    const total = Number(totalResult.rows[0].total);
    const paid = Number(paidResult.rows[0].total);
    if (order.orderType !== 'MARKETPLACE' && paid < total) throw error('VALIDATION_ERROR', `Sales order payment is not PAID. Balance: ${(total - paid).toFixed(2)}.`);
    const result = await db.query(`UPDATE sales_orders SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1 AND status = 'RTS' RETURNING id`, [salesOrderId]);
    if (!result.rows[0]) throw error('CONFLICT', 'Sales order changed before completion.');
    await db.query('COMMIT');
    return salesOrderRepository.findSalesOrderById(db, salesOrderId);
  } catch (e) { await db.query('ROLLBACK'); throw e; }
  finally { db.release(); }
}
