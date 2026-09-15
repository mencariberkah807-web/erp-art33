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

    const workOrders = await db.query(`
      SELECT sales_order_item_id AS "salesOrderItemId"
      FROM work_orders
      WHERE sales_order_id = $1 AND status <> 'INACTIVE'
    `, [salesOrderId]);
    const workOrderItemIds = new Set(workOrders.rows.map((row) => row.salesOrderItemId));
    const missing = activeItems.filter((item) => !workOrderItemIds.has(item.id));
    if (missing.length) throw error('VALIDATION_ERROR', 'Every active sales order item must have an active work order before production can start.');

    const result = await db.query(`
      UPDATE sales_orders
      SET status = 'READY_PRODUCTION', updated_at = NOW()
      WHERE id = $1 AND status = 'NEW_ORDER'
      RETURNING id
    `, [salesOrderId]);
    if (!result.rows[0]) throw error('CONFLICT', 'Sales order changed before it could be marked ready for production.');

    await db.query('COMMIT');
    return salesOrderRepository.findSalesOrderById(db, salesOrderId);
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  } finally { db.release(); }
}
