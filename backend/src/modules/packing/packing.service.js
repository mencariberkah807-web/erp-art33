import * as repository from './packing.repository.js';
import * as audit from '../audit/audit.service.js';
import { AUDIT } from '../audit/audit.events.js';

function error(code, message) { return Object.assign(new Error(message), { code }); }

export async function listPacking(pool) {
  const db = await pool.connect();
  try { return await repository.listPackingOrders(db); }
  finally { db.release(); }
}

export async function getPacking(pool, salesOrderId) {
  const db = await pool.connect();
  try { return await repository.findBySalesOrderId(db, salesOrderId); }
  finally { db.release(); }
}

export async function packSalesOrder(pool, salesOrderId, { packedBy = null, notes = null } = {}) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const orderResult = await db.query(`SELECT id, so_number AS "soNumber", status FROM sales_orders WHERE id = $1 FOR UPDATE`, [salesOrderId]);
    const order = orderResult.rows[0];
    if (!order) throw error('NOT_FOUND', 'Sales order not found.');
    if (order.status !== 'PACKING') throw error('VALIDATION_ERROR', `Sales order cannot be packed from ${order.status}.`);
    const items = await db.query(`SELECT id FROM sales_order_items WHERE sales_order_id = $1 AND status = 'ACTIVE'`, [salesOrderId]);
    if (!items.rows.length) throw error('VALIDATION_ERROR', 'Sales order has no active items.');
    const incomplete = await db.query(`SELECT COUNT(*)::int AS count FROM work_orders wo JOIN sales_order_items soi ON soi.id = wo.sales_order_item_id WHERE wo.sales_order_id = $1 AND soi.status = 'ACTIVE' AND wo.status <> 'COMPLETED_PRODUCTION'`, [salesOrderId]);
    if (incomplete.rows[0].count > 0) throw error('VALIDATION_ERROR', 'All active work orders must be completed before packing.');
    let packing = await repository.findBySalesOrderId(db, salesOrderId, true);
    if (!packing) packing = await repository.createPending(db, salesOrderId);
    if (packing.status === 'PACKED') throw error('VALIDATION_ERROR', 'Sales order is already packed.');
    const result = await repository.pack(db, salesOrderId, packedBy, notes);
    if (!result) throw error('VALIDATION_ERROR', 'Packing transition failed.');
    const rts = await db.query(`UPDATE sales_orders SET status = 'RTS', updated_at = NOW() WHERE id = $1 AND status = 'PACKING' RETURNING id, so_number AS "soNumber", status`, [salesOrderId]);
    if (!rts.rows[0]) throw error('VALIDATION_ERROR', 'Sales order RTS transition failed.');
    await audit.recordAudit(db, { entityType: 'SALES_ORDER', entityId: salesOrderId, action: AUDIT.PACKING_COMPLETED, newData: { salesOrderId, soNumber: order.soNumber, packingId: result.id, packedBy } });
    await db.query('COMMIT');
    return { packing: result, salesOrder: rts.rows[0] };
  } catch (e) { await db.query('ROLLBACK'); throw e; }
  finally { db.release(); }
}
