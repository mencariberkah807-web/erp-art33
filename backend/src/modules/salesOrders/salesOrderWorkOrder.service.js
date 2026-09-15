import * as salesOrderRepository from './salesOrder.repository.js';
import * as itemRepository from './salesOrderItems.repository.js';
import * as workOrderRepository from '../workOrders/workOrder.repository.js';
import * as snapshotSourceRepository from '../workOrders/workOrderCreation.repository.js';
import * as snapshotRepository from '../workOrders/workOrderSnapshot.repository.js';

function error(code, message) { return Object.assign(new Error(message), { code }); }

export async function createWorkOrdersForSalesOrder(pool, salesOrderId, requestedItemIds = null) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const salesOrder = await salesOrderRepository.findSalesOrderById(db, salesOrderId);
    if (!salesOrder) throw error('NOT_FOUND', 'Sales order not found.');
    if (salesOrder.orderType !== 'DIRECT') throw error('VALIDATION_ERROR', 'Work orders for marketplace orders are created atomically with the marketplace order.');
    if (salesOrder.status === 'INACTIVE') throw error('VALIDATION_ERROR', 'Inactive sales orders cannot create work orders.');

    const items = await itemRepository.listItems(db, salesOrderId);
    const activeItems = items.filter((item) => item.status === 'ACTIVE');
    const selected = requestedItemIds?.length
      ? activeItems.filter((item) => requestedItemIds.includes(item.id))
      : activeItems;
    if (!selected.length) throw error('VALIDATION_ERROR', 'At least one active sales order item is required.');
    if (requestedItemIds?.length && selected.length !== requestedItemIds.length) throw error('VALIDATION_ERROR', 'One or more requested sales order items are not active or do not belong to the sales order.');

    const created = [];
    for (const item of selected) {
      const existing = await db.query(`SELECT id FROM work_orders WHERE sales_order_item_id = $1 AND status <> 'INACTIVE'`, [item.id]);
      if (existing.rows[0]) throw error('CONFLICT', `A work order already exists for sales order item ${item.itemNumber}.`);
      const woNumber = await workOrderRepository.nextWorkOrderNumber(db);
      const workOrder = await workOrderRepository.createWorkOrder(db, {
        woNumber, salesOrderId, salesOrderItemId: item.id, status: 'READY_FOR_PRODUCTION',
      });
      const source = await snapshotSourceRepository.createSnapshotSource(db, salesOrderId, item.id);
      if (!source) throw error('VALIDATION_ERROR', 'Unable to build work order production snapshot.');
      const snapshot = await snapshotRepository.createSnapshot(db, {
        workOrderId: workOrder.id,
        customerName: source.customer_name,
        productName: source.product_name,
        quantity: source.quantity,
        material: source.material,
        specification: source.specification,
        dimension: source.dimension,
        color: source.color,
        thickness: source.thickness,
        productionNotes: source.production_notes,
        artworkFileUrl: source.artwork_file_url,
        artworkDriveUrl: source.artwork_drive_url,
      });
      created.push({ ...workOrder, snapshot });
    }

    await db.query(`UPDATE sales_orders SET status = 'READY_PRODUCTION', updated_at = NOW() WHERE id = $1 AND status = 'NEW_ORDER'`, [salesOrderId]);
    await db.query('COMMIT');
    return created;
  } catch (e) {
    await db.query('ROLLBACK');
    if (e.code === '23505') throw error('CONFLICT', 'A work order or snapshot already exists for the requested item.');
    if (e.code === '23503') throw error('VALIDATION_ERROR', 'Sales order item reference is invalid.');
    throw e;
  } finally { db.release(); }
}
