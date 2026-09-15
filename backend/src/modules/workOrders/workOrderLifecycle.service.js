import * as repository from './workOrder.repository.js';

function error(code, message) { return Object.assign(new Error(message), { code }); }

async function transition(db, id, action) {
  const current = await repository.findWorkOrderById(db, id, true);
  if (!current) throw error('NOT_FOUND', 'Work order not found.');
  if (current.status === 'INACTIVE') throw error('VALIDATION_ERROR', 'Inactive work orders cannot transition.');

  const nextStatus = action === 'START' ? 'IN_PRODUCTION' : 'COMPLETED_PRODUCTION';
  const expected = action === 'START' ? 'READY_FOR_PRODUCTION' : 'IN_PRODUCTION';
  if (current.status !== expected) throw error('VALIDATION_ERROR', `Work order cannot ${action.toLowerCase()} from ${current.status}.`);

  const result = action === 'START'
    ? await repository.startWorkOrder(db, id)
    : await repository.completeWorkOrder(db, id);
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
