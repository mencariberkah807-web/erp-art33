import * as repository from './workOrder.repository.js';
import * as audit from '../audit/audit.service.js';
import { AUDIT } from '../audit/audit.events.js';

function error(code, message) { return Object.assign(new Error(message), { code, message }); }

async function transition(db, id, action) {
  const current = await repository.findWorkOrderById(db, id, true);
  if (!current) throw error('NOT_FOUND', 'Work order not found.');
  if (current.status === 'INACTIVE') throw error('VALIDATION_ERROR', 'Inactive work orders cannot transition.');

  const expected = action === 'START' ? 'READY_FOR_PRODUCTION' : 'IN_PRODUCTION';
  if (current.status !== expected) throw error('VALIDATION_ERROR', `Work order cannot ${action.toLowerCase()} from ${current.status}.`);

  const salesOrder = await db.query(`SELECT status FROM sales_orders WHERE id = $1 FOR UPDATE`, [current.salesOrderId]);
  if (!salesOrder.rows[0]) throw error('NOT_FOUND', 'Sales order not found.');

  if (action === 'START') {
    if (!['READY_PRODUCTION', 'IN_PRODUCTION'].includes(salesOrder.rows[0].status)) throw error('VALIDATION_ERROR', `Sales order cannot enter production from ${salesOrder.rows[0].status}.`);
    const result = await repository.startWorkOrder(db, id);
    if (!result) throw error('VALIDATION_ERROR', 'Work order transition failed.');
    if (salesOrder.rows[0].status === 'READY_PRODUCTION') await db.query(`UPDATE sales_orders SET status = 'IN_PRODUCTION', updated_at = NOW() WHERE id = $1 AND status = 'READY_PRODUCTION'`, [current.salesOrderId]);
    await audit.recordAudit(db, { entityType: 'WORK_ORDER', entityId: id, action: AUDIT.WORK_ORDER_STARTED, oldData: current, newData: result });
    return result;
  }

  if (salesOrder.rows[0].status !== 'IN_PRODUCTION') throw error('VALIDATION_ERROR', `Sales order cannot complete production from ${salesOrder.rows[0].status}.`);
  const result = await repository.completeWorkOrder(db, id);
  if (!result) throw error('VALIDATION_ERROR', 'Work order transition failed.');

  const completion = await db.query(`SELECT (SELECT COUNT(*)::int FROM sales_order_items WHERE sales_order_id = $1 AND status = 'ACTIVE') AS active_items, (SELECT COUNT(*)::int FROM work_orders wo JOIN sales_order_items soi ON soi.id = wo.sales_order_item_id WHERE wo.sales_order_id = $1 AND wo.status = 'COMPLETED_PRODUCTION' AND soi.status = 'ACTIVE') AS completed_work_orders`, [current.salesOrderId]);
  const { active_items: activeItems, completed_work_orders: completedWorkOrders } = completion.rows[0];
  if (activeItems > 0 && activeItems === completedWorkOrders) {
    await db.query(`UPDATE sales_orders SET status = 'PACKING', updated_at = NOW() WHERE id = $1 AND status = 'IN_PRODUCTION'`, [current.salesOrderId]);
    await db.query(`INSERT INTO packing_orders (sales_order_id, status) VALUES ($1, 'PENDING') ON CONFLICT (sales_order_id) DO UPDATE SET status = CASE WHEN packing_orders.status = 'PACKED' THEN packing_orders.status ELSE 'PENDING' END`, [current.salesOrderId]);
  }
  await audit.recordAudit(db, { entityType: 'WORK_ORDER', entityId: id, action: AUDIT.WORK_ORDER_COMPLETED, oldData: current, newData: result });
  return result;
}

export async function startWorkOrder(pool, id) { const db = await pool.connect(); try { await db.query('BEGIN'); const result = await transition(db, id, 'START'); await db.query('COMMIT'); return result; } catch (e) { await db.query('ROLLBACK'); throw e; } finally { db.release(); } }
export async function completeWorkOrder(pool, id) { const db = await pool.connect(); try { await db.query('BEGIN'); const result = await transition(db, id, 'COMPLETE'); await db.query('COMMIT'); return result; } catch (e) { await db.query('ROLLBACK'); throw e; } finally { db.release(); } }
