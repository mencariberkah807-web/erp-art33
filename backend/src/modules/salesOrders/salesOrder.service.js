import * as repository from './salesOrder.repository.js';
import * as itemService from './salesOrderItems.service.js';
import * as paymentService from '../payments/payment.service.js';
import * as workOrderRepository from '../workOrders/workOrder.repository.js';

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
  const customerId = text(input.customerId);
  const marketplace = text(input.marketplace)?.toUpperCase();
  const trackingNumber = text(input.trackingNumber);
  if (orderType === 'DIRECT') {
    if (!customerId) throw error('VALIDATION_ERROR', 'Customer is required for direct orders.');
    if (marketplace || trackingNumber) throw error('VALIDATION_ERROR', 'Marketplace and tracking number are not allowed for direct orders.');
  } else {
    if (!marketplace || !MARKETPLACES.has(marketplace)) throw error('VALIDATION_ERROR', 'Marketplace is required for marketplace orders.');
    if (!trackingNumber) throw error('VALIDATION_ERROR', 'Tracking number is required for marketplace orders.');
  }
  return { orderType, customerId, marketplace, trackingNumber, orderDate, deadline, priority };
}

export async function listSalesOrders(pool, query) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize, 10) || 20, 1), 100);
  const status = query.status ? String(query.status).trim().toUpperCase() : undefined;
  if (status && !STATUSES.has(status)) throw error('VALIDATION_ERROR', 'Invalid sales order status.');
  const result = await repository.listSalesOrders(pool, { page, pageSize, search: text(query.search), status });
  return { data: result.rows, meta: { page, pageSize, total: result.total } };
}

export async function getSalesOrder(pool, id) { return repository.findSalesOrderById(pool, id); }

export async function createSalesOrder(pool, input) {
  const order = validate(input);
  if (!Array.isArray(input.items) || input.items.length < 1) throw error('VALIDATION_ERROR', 'At least one sales order item is required.');
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    order.soNumber = await repository.nextSalesOrderNumber(db);
    const salesOrder = await repository.createSalesOrder(db, order);
    const items = await itemService.validateAndCreateItems(db, salesOrder.id, input.items);

    let payment = null;
    let workOrders = [];
    if (order.orderType === 'MARKETPLACE') {
      const grandTotal = items.reduce((sum, item) => sum + Number(item.itemTotal || 0), 0);
      payment = await paymentService.createPayment(db, salesOrder.id, {
        amount: grandTotal,
        paymentMethod: 'MARKETPLACE',
        paymentDate: order.orderDate,
        referenceNumber: order.trackingNumber,
        notes: 'Marketplace order auto-paid.',
      });
      for (const item of items) {
        const woNumber = await workOrderRepository.nextWorkOrderNumber(db);
        workOrders.push(await workOrderRepository.createWorkOrder(db, {
          woNumber,
          salesOrderId: salesOrder.id,
          salesOrderItemId: item.id,
          status: 'READY_FOR_PRODUCTION',
        }));
      }
    }

    await db.query('COMMIT');
    return { ...salesOrder, items, payment, workOrders };
  } catch (e) {
    await db.query('ROLLBACK');
    if (e.code === '23505') throw error('CONFLICT', 'Sales order, payment, or work order number already exists.');
    if (e.code === '23503') throw error('VALIDATION_ERROR', 'Customer or product reference does not exist.');
    throw e;
  } finally { db.release(); }
}
