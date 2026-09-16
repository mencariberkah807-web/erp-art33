import * as repository from './payment.repository.js';
import * as audit from '../audit/audit.service.js';
import { AUDIT } from '../audit/audit.events.js';

const PAYMENT_METHODS = new Set(['Cash', 'Transfer', 'QRIS']);
function error(code, message) { return Object.assign(new Error(message), { code }); }
function text(value) { if (value === undefined || value === null) return null; const v = String(value).trim(); return v || null; }
function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')); }

export async function createPayment(db, salesOrderId, input) {
  const amount = Number(input.amount);
  if (!salesOrderId) throw error('VALIDATION_ERROR', 'Sales order is required.');
  if (!Number.isFinite(amount) || amount <= 0) throw error('VALIDATION_ERROR', 'Payment amount must be greater than zero.');

  const paymentMethod = text(input.paymentMethod);
  const marketplaceAutoPay = paymentMethod === 'MARKETPLACE';
  if ((!paymentMethod || (!PAYMENT_METHODS.has(paymentMethod) && !marketplaceAutoPay))) {
    throw error('VALIDATION_ERROR', 'Payment method must be Cash, Transfer, or QRIS.');
  }

  const paymentDate = text(input.paymentDate) || new Date().toISOString().slice(0, 10);
  if (!validDate(paymentDate)) throw error('VALIDATION_ERROR', 'Payment date must use YYYY-MM-DD.');

  const client = typeof db.connect === 'function' ? await db.connect() : null;
  const connection = client || db;
  try {
    if (client) await connection.query('BEGIN');
    const context = await repository.getPaymentContextForUpdate(connection, salesOrderId);
    if (!context) throw error('NOT_FOUND', 'Sales order not found.');
    if (marketplaceAutoPay && context.orderType !== 'MARKETPLACE') throw error('VALIDATION_ERROR', 'Marketplace auto-payment is only valid for marketplace orders.');
    if (context.orderType === 'MARKETPLACE' && !marketplaceAutoPay) throw error('VALIDATION_ERROR', 'Marketplace orders are automatically paid.');

    const grandTotal = Number(context.grandTotal || 0);
    const totalPaid = Number(context.totalPaid || 0);
    if (grandTotal <= 0) throw error('CONFLICT', 'Sales order has no payable balance.');
    const balance = Math.max(0, grandTotal - totalPaid);
    if (balance <= 0) throw error('CONFLICT', 'Sales order is already fully paid.');
    if (amount > balance + 0.000001) throw error('VALIDATION_ERROR', 'Payment amount cannot exceed the remaining balance.');

    const payment = {
      paymentNumber: await repository.nextPaymentNumber(connection), salesOrderId, amount,
      paymentMethod, paymentDate,
      referenceNumber: text(input.referenceNumber), notes: text(input.notes), createdBy: input.createdBy || null,
    };
    const result = await repository.createPayment(connection, payment);
    await audit.recordAudit(connection, { entityType: 'PAYMENT', entityId: result.id, action: AUDIT.PAYMENT_CREATED, newData: result });
    if (client) await connection.query('COMMIT');
    return result;
  } catch (e) {
    if (client) await connection.query('ROLLBACK');
    throw e;
  } finally {
    if (client) client.release();
  }
}

export async function listPayments(db, salesOrderId) {
  const context = await repository.getPaymentContext(db, salesOrderId);
  if (!context) throw error('NOT_FOUND', 'Sales order not found.');
  return repository.listPaymentsBySalesOrder(db, salesOrderId);
}
