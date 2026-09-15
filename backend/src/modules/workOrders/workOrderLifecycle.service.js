import * as repository from './workOrder.repository.js';

function error(code, message) { return Object.assign(new Error(message), { code }); }

async function transition(db, id, action) {
  const current = await repository.findWorkOrderById(db, id, true);
  if (!current) throw error('NOT_FOUND', 'Work order not found.');
  if (current.status === 'INACTIVE') throw error('VALIDATION_ERROR', 'Inactive work orders cannot transition.');

  const nextStatus = action === 'START' ? 'IN_PRODUCTION' : 'COMPLETED_PRODUCTION';
  const expected = action === 'START' ? 'READY_FOR_PRODUCTION' : 'IN_PRODUCTION';
  if (current.status !== expected) throw error('VALIDATION_ERROR', `Work order cannot ${action.toLowerCase()} from ${current.status}.`);

  if (action === 'START') {
    const salesOrder = await db.query(`SELECT status FROM sales_orders WHERE id = $1 FOR UPDATE`, [current.salesOrderId]);
    if (!salesOrder.rows[0]) throw error('NOT_FOUND', 'Sales order not found.');
    if (!['READY_PRODUCTION', 'IN_PRODUCTION'].includes(salesOrder.rows[0].status)) {
      throw error('VALIDATION_ERROR', `Sales order cannot enter production from ${salesOrder.rows[0].status}.`);
    }
    const result = await repository.startWorkOrder(db, id);
    if (!result) throw error('VALIDATION_ERROR', 'Work order transition failed.');
    if (salesOrder.rows[0].status === 'READY_PRODUCTION') {
      await db.query(`UPDATE sales_orders SET status = 'IN_PRODUCTION', updated_at = NOW() WHERE id = $1 AND status = 'READY_PRODUCTION'`, [current.salesOrderId]);
    }
    return result;
  }

  const result = await repository.completeWorkOrder(db, id);
  if (!result) throw error('VALIDATION_ERROR', 'Work order transition failed.');
  return result;
}

export async function startWorkOrder(pool, id) {
  const db = await pool.connect();
  try { await db.query('BEGIN'); const result = await transition(db, id, 'START'); await db.query('COMMIT'); return result; }
  catch (e) { await db.query('ROLLBACK'); throw e; }
  finally { db.release(); }
}

export async function completeWorkOrder(pool, id) {
  const db = await pool.connect();
  try { await db.query('BEGIN'); const result = await transition(db, id, 'COMPLETE'); await db.query('COMMIT'); return result; }
  catch (e) { await db.query('ROLLBACK'); throw e; }
  finally { db.release(); }
}
