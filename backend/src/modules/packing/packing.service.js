import * as repository from './packing.repository.js';
import * as detailRepository from '../salesOrders/salesOrderDetail.repository.js';
import * as audit from '../audit/audit.service.js';
import { AUDIT } from '../audit/audit.events.js';

function error(code, message) { return Object.assign(new Error(message), { code }); }

export async function listPacking(pool) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');

    // Reconcile production-complete sales orders into the packing queue.
    // This also repairs orders completed before the WO -> PACKING transition hook existed.
    await db.query(`
      UPDATE sales_orders so
      SET status = 'PACKING', updated_at = NOW()
      WHERE so.status = 'IN_PRODUCTION'
        AND EXISTS (
          SELECT 1
          FROM sales_order_items soi
          WHERE soi.sales_order_id = so.id
            AND soi.status = 'ACTIVE'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM sales_order_items soi
          LEFT JOIN work_orders wo
            ON wo.sales_order_item_id = soi.id
           AND wo.sales_order_id = so.id
          WHERE soi.sales_order_id = so.id
            AND soi.status = 'ACTIVE'
            AND (wo.id IS NULL OR wo.status <> 'COMPLETED_PRODUCTION')
        )
    `);

    await db.query(`
      INSERT INTO packing_orders (sales_order_id, status)
      SELECT so.id, 'PENDING'
      FROM sales_orders so
      WHERE so.status = 'PACKING'
        AND EXISTS (
          SELECT 1
          FROM sales_order_items soi
          WHERE soi.sales_order_id = so.id
            AND soi.status = 'ACTIVE'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM packing_orders po
          WHERE po.sales_order_id = so.id
        )
      ON CONFLICT (sales_order_id) DO NOTHING
    `);

    const result = await repository.listPackingOrders(db);
    await db.query('COMMIT');
    return result;
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  } finally {
    db.release();
  }
}

export async function getPacking(pool, salesOrderId) {
  const db = await pool.connect();
  try {
    const packing = await repository.findBySalesOrderId(db, salesOrderId);
    if (!packing) return null;
    const detail = await detailRepository.findDetail(db, salesOrderId);
    if (!detail) return packing;
    return { ...packing, ...detail, salesOrderNumber: packing.salesOrderNumber };
  } finally { db.release(); }
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
