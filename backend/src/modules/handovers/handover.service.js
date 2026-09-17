import * as repository from './handover.repository.js';
import * as audit from '../audit/audit.service.js';
import { AUDIT } from '../audit/audit.events.js';

function error(code, message) { return Object.assign(new Error(message), { code }); }

export async function listHandovers(pool) {
  const db = await pool.connect();
  try { return await repository.listHandovers(db); }
  finally { db.release(); }
}

export async function createHandover(pool, salesOrderId, data = {}) {
  const handoverType = String(data.handoverType || '').trim().toUpperCase();
  if (!['CUSTOMER_PICKUP', 'COURIER'].includes(handoverType)) throw error('VALIDATION_ERROR', 'Handover type must be CUSTOMER_PICKUP or COURIER.');
  if (handoverType === 'CUSTOMER_PICKUP' && !String(data.recipientName || '').trim()) throw error('VALIDATION_ERROR', 'Recipient name is required for customer pickup.');
  if (handoverType === 'COURIER' && !String(data.courierName || '').trim()) throw error('VALIDATION_ERROR', 'Courier name is required for courier handover.');

  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const orderResult = await db.query(`SELECT id, so_number AS "soNumber", status, order_type AS "orderType" FROM sales_orders WHERE id = $1 FOR UPDATE`, [salesOrderId]);
    const order = orderResult.rows[0];
    if (!order) throw error('NOT_FOUND', 'Sales order not found.');
    if (order.status !== 'RTS') throw error('VALIDATION_ERROR', `Sales order cannot be handed over from ${order.status}.`);

    const packingResult = await db.query(`SELECT status FROM packing_orders WHERE sales_order_id = $1 ORDER BY created_at DESC LIMIT 1`, [salesOrderId]);
    if (packingResult.rows[0]?.status !== 'PACKED') throw error('VALIDATION_ERROR', 'Sales order must be packed before handover.');

    const existing = await db.query(`SELECT id FROM handovers WHERE sales_order_id = $1 LIMIT 1`, [salesOrderId]);
    if (existing.rows[0]) throw error('CONFLICT', 'Sales order already has a handover record.');

    const result = await repository.createHandover(db, { salesOrderId, handoverType, recipientName: data.recipientName, courierName: data.courierName, handoverAt: data.handoverAt, handedOverBy: data.handedOverBy, notes: data.notes });
    if (!result) throw error('VALIDATION_ERROR', 'Handover creation failed.');

    await audit.recordAudit(db, { entityType: 'SALES_ORDER', entityId: salesOrderId, action: AUDIT.HANDOVER_RECORDED, newData: { salesOrderId, soNumber: order.soNumber, handoverId: result.id, handoverType, completed: false } });
    await db.query('COMMIT');
    return { ...result, salesOrder: { id: order.id, soNumber: order.soNumber, status: order.status } };
  } catch (e) { await db.query('ROLLBACK'); throw e; }
  finally { db.release(); }
}
