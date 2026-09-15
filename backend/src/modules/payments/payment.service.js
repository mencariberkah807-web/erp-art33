import * as repository from './payment.repository.js';

function error(code, message) { return Object.assign(new Error(message), { code }); }
function text(value) { if (value === undefined || value === null) return null; const v = String(value).trim(); return v || null; }

export async function createPayment(db, salesOrderId, input) {
  const amount = Number(input.amount);
  if (!salesOrderId) throw error('VALIDATION_ERROR', 'Sales order is required.');
  if (!Number.isFinite(amount) || amount <= 0) throw error('VALIDATION_ERROR', 'Payment amount must be greater than zero.');
  const paymentMethod = text(input.paymentMethod);
  if (!paymentMethod) throw error('VALIDATION_ERROR', 'Payment method is required.');

  const context = await repository.getPaymentContext(db, salesOrderId);
  if (!context) throw error('NOT_FOUND', 'Sales order not found.');
  if (context.orderType === 'MARKETPLACE') throw error('VALIDATION_ERROR', 'Marketplace orders are automatically paid.');
  const balance = Math.max(0, Number(context.grandTotal) - Number(context.totalPaid));
  if (amount > balance + 0.000001) throw error('VALIDATION_ERROR', 'Payment amount cannot exceed the remaining balance.');

  const payment = {
    paymentNumber: await repository.nextPaymentNumber(db), salesOrderId, amount,
    paymentMethod, paymentDate: text(input.paymentDate) || new Date().toISOString().slice(0, 10),
    referenceNumber: text(input.referenceNumber), notes: text(input.notes), createdBy: input.createdBy || null,
  };
  return repository.createPayment(db, payment);
}

export async function listPayments(db, salesOrderId) {
  const context = await repository.getPaymentContext(db, salesOrderId);
  if (!context) throw error('NOT_FOUND', 'Sales order not found.');
  return repository.listPaymentsBySalesOrder(db, salesOrderId);
}
