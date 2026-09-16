import * as repository from './salesOrder.repository.js';
import * as detailRepository from './salesOrderDetail.repository.js';
import * as itemService from './salesOrderItems.service.js';
import * as paymentService from '../payments/payment.service.js';
import * as workOrderRepository from '../workOrders/workOrder.repository.js';
import * as workOrderCreationRepository from '../workOrders/workOrderCreation.repository.js';
import * as workOrderSnapshotRepository from '../workOrders/workOrderSnapshot.repository.js';

const ORDER_TYPES = new Set(['DIRECT', 'MARKETPLACE']);
const PRIORITIES = new Set(['REGULAR', 'SAME_DAY', 'INSTANT']);
const STATUSES = new Set(['NEW_ORDER', 'READY_PRODUCTION', 'IN_PRODUCTION', 'PACKING', 'RTS', 'COMPLETED', 'INACTIVE']);
const MARKETPLACES = new Set(['SHOPEE', 'TOKOPEDIA', 'TIKTOK_SHOP', 'LAZADA', 'BLIBLI', 'OTHER']);
function error(code, message) { return Object.assign(new Error(message), { code }); }
function text(value) { if (value === undefined || value === null) return null; const v = String(value).trim(); return v || null; }
function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')); }
function validate(input) {
  const orderType = text(input.orderType)?.toUpperCase();
  if (!ORDER_TYPES.has(orderType)) throw error('VALIDATION_ERROR', 'Order type must be DIRECT or MARKETPLACE.');
  const orderDate = text(input.orderDate) || new Date().toISOString().slice(0, 10);
  const deadline = text(input.deadline);
  if (!validDate(orderDate) || !deadline || !validDate(deadline)) throw error('VALIDATION_ERROR', 'Order date and deadline must use YYYY-MM-DD.');
  if (deadline < orderDate) throw error('VALIDATION_ERROR', 'Deadline must be on or after order date.');
  const priority = (text(input.priority) || 'REGULAR').toUpperCase();
  if (!PRIORITIES.has(priority)) throw error('VALIDATION_ERROR', 'Priority must be REGULAR, SAME_DAY, or INSTANT.');
  const customerId = text(input.customerId); const marketplace = text(input.marketplace)?.toUpperCase(); const trackingNumber = text(input.trackingNumber);
  if (orderType === 'DIRECT') { if (!customerId) throw error('VALIDATION_ERROR', 'Customer is required for direct orders.'); if (marketplace || trackingNumber) throw error('VALIDATION_ERROR', 'Marketplace and tracking number are not allowed for direct orders.'); }
  else { if (!marketplace || !MARKETPLACES.has(marketplace)) throw error('VALIDATION_ERROR', 'Marketplace is required for marketplace orders.'); if (!trackingNumber) throw error('VALIDATION_ERROR', 'Tracking number is required for marketplace orders.'); }
  return { orderType, customerId, marketplace, trackingNumber, orderDate, deadline, priority };
}
function validatePatch(current, input) {
  const merged = { ...current, ...input, orderType: current.orderType };
  if (input.orderType && String(input.orderType).toUpperCase() !== current.orderType) throw error('VALIDATION_ERROR', 'Order type cannot be changed after creation.');
  return validate(merged);
}
export async function listSalesOrders(pool, query) { const page = Math.max(Number.parseInt(query.page, 10) || 1, 1); const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize, 10) || 20, 1), 100); const status = query.status ? String(query.status).trim().toUpperCase() : undefined; if (status && !STATUSES.has(status)) throw error('VALIDATION_ERROR', 'Invalid sales order status.'); const result = await repository.listSalesOrders(pool, { page, pageSize, search: text(query.search), status }); return { data: result.rows, meta: { page, pageSize, total: result.total } }; }
export async function getSalesOrder(pool, id) { return repository.findSalesOrderById(pool, id); }
export async function getSalesOrderDetail(pool, id) { return detailRepository.findDetail(pool, id); }
export async function createSalesOrder(pool, input) {
  const order = validate(input); if (!Array.isArray(input.items) || input.items.length < 1) throw error('VALIDATION_ERROR', 'At least one sales order item is required.'); const db = await pool.connect();
  try { await db.query('BEGIN'); order.soNumber = await repository.nextSalesOrderNumber(db); const salesOrder = await repository.createSalesOrder(db, order); const items = await itemService.validateAndCreateItems(db, salesOrder.id, input.items); let payment = null; let workOrders = [];
    if (order.orderType === 'MARKETPLACE') { const grandTotal = items.reduce((sum, item) => sum + Number(item.itemTotal || 0), 0); payment = await paymentService.createPayment(db, salesOrder.id, { amount: grandTotal, paymentMethod: 'MARKETPLACE', paymentDate: order.orderDate, referenceNumber: order.trackingNumber, notes: 'Marketplace order auto-paid.' }); for (const item of items) { const woNumber = await workOrderRepository.nextWorkOrderNumber(db); const workOrder = await workOrderRepository.createWorkOrder(db, { woNumber, salesOrderId: salesOrder.id, salesOrderItemId: item.id, status: 'READY_FOR_PRODUCTION' }); const source = await workOrderCreationRepository.createSnapshotSource(db, salesOrder.id, item.id); if (!source) throw error('VALIDATION_ERROR', 'Unable to build work order production snapshot.'); const snapshot = await workOrderSnapshotRepository.createSnapshot(db, { workOrderId: workOrder.id, customerName: source.customer_name, productName: source.product_name, quantity: source.quantity, material: source.material, specification: source.specification, dimension: source.dimension, color: source.color, thickness: source.thickness, productionNotes: source.production_notes, artworkFileUrl: source.artwork_file_url, artworkDriveUrl: source.artwork_drive_url }); workOrders.push({ ...workOrder, snapshot }); } }
    await db.query('COMMIT'); return { ...salesOrder, items, payment, workOrders };
  } catch (e) { await db.query('ROLLBACK'); if (e.code === '23505') throw error('CONFLICT', 'Sales order, payment, work order, or snapshot already exists.'); if (e.code === '23503') throw error('VALIDATION_ERROR', 'Customer or product reference does not exist.'); throw e; } finally { db.release(); }
}

export async function updateSalesOrder(pool, id, input) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const current = await repository.findSalesOrderById(db, id, true);
    if (!current) throw error('NOT_FOUND', 'Sales order not found.');
    if (!['NEW_ORDER', 'READY_PRODUCTION'].includes(current.status)) throw error('CONFLICT', 'Sales order can only be edited before production starts.');
    const order = validatePatch(current, input || {});
    const updated = await repository.updateSalesOrder(db, id, order);

    if (Array.isArray(input?.items)) {
      const normalized = itemService.validateAndNormalizeItems(id, input.items);
      const currentItems = await itemService.listItems(db, id);
      const incomingIds = new Set(normalized.map((item) => item.id).filter(Boolean));
      const currentIds = new Set(currentItems.map((item) => item.id));
      const removed = currentItems.filter((item) => !incomingIds.has(item.id));
      if (normalized.length < 1) throw error('VALIDATION_ERROR', 'At least one active sales order item is required.');

      for (const item of removed) {
        await itemService.removeItemForEdit(db, item.id);
        await workOrderRepository.deactivateBySalesOrderItem(db, item.id);
      }

      for (const item of normalized) {
        let saved;
        if (item.id && currentIds.has(item.id)) {
          saved = await itemService.updateExistingItem(db, item.id, item);
        } else {
          saved = await itemService.createNewItem(db, item);
        }
        const source = await workOrderCreationRepository.createSnapshotSource(db, id, saved.id);
        if (source) {
          await workOrderSnapshotRepository.updateBySalesOrderItem(db, saved.id, {
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
        }
      }

      const changedSet = new Set([...removed.map((item) => item.id), ...normalized.filter((item) => !item.id).map((item) => item.productId)]);
      if (removed.length || normalized.some((item) => !item.id)) {
        await db.query(`UPDATE sales_orders SET status = 'NEW_ORDER', updated_at = NOW() WHERE id = $1 AND status = 'READY_PRODUCTION'`, [id]);
      }
      void changedSet;
    }

    if (updated.orderType === 'DIRECT' && updated.customerId) {
      const customer = await db.query('SELECT name FROM customers WHERE id = $1', [updated.customerId]);
      if (customer.rows[0]) await workOrderSnapshotRepository.updateCustomerNameBySalesOrder(db, id, customer.rows[0].name);
    }
    await db.query('COMMIT');
    return detailRepository.findDetail(pool, id);
  } catch (e) { await db.query('ROLLBACK'); if (e.code === '23503') throw error('VALIDATION_ERROR', 'Customer or product reference does not exist.'); throw e; } finally { db.release(); }
}

export async function cancelSalesOrder(pool, id) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const current = await repository.findSalesOrderById(db, id, true);
    if (!current) throw error('NOT_FOUND', 'Sales order not found.');
    if (!['NEW_ORDER', 'READY_PRODUCTION'].includes(current.status)) throw error('CONFLICT', 'Sales order cannot be cancelled after production has started.');
    await repository.cancelSalesOrder(db, id);
    await itemService.deactivateActiveItems(db, id);
    await workOrderRepository.deactivateActiveBySalesOrder(db, id);
    await db.query('COMMIT');
    return detailRepository.findDetail(pool, id);
  } catch (e) { await db.query('ROLLBACK'); throw e; } finally { db.release(); }
}
