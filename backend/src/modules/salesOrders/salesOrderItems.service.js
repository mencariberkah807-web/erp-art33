import * as repository from './salesOrderItems.repository.js';

function error(code, message) { return Object.assign(new Error(message), { code }); }
function text(value) { if (value === undefined || value === null) return null; const v = String(value).trim(); return v || null; }

function normalize(item, index, salesOrderId) {
  const productId = text(item.productId);
  const quantity = Number(item.quantity);
  const unitPrice = Number(item.unitPrice);
  const discountType = (text(item.discountType) || 'NOMINAL').toUpperCase();
  const discountValue = Number(item.discountValue ?? 0);
  if (!productId) throw error('VALIDATION_ERROR', `Item ${index + 1}: product is required.`);
  if (!Number.isInteger(quantity) || quantity < 1) throw error('VALIDATION_ERROR', `Item ${index + 1}: quantity must be at least 1.`);
  if (!Number.isFinite(unitPrice) || unitPrice < 0) throw error('VALIDATION_ERROR', `Item ${index + 1}: unit price must be non-negative.`);
  if (!['NOMINAL', 'PERCENTAGE'].includes(discountType)) throw error('VALIDATION_ERROR', `Item ${index + 1}: invalid discount type.`);
  if (!Number.isFinite(discountValue) || discountValue < 0) throw error('VALIDATION_ERROR', `Item ${index + 1}: discount must be non-negative.`);
  if (discountType === 'PERCENTAGE' && discountValue > 100) throw error('VALIDATION_ERROR', `Item ${index + 1}: percentage discount cannot exceed 100%.`);
  const gross = quantity * unitPrice;
  const discount = discountType === 'PERCENTAGE' ? gross * discountValue / 100 : discountValue;
  if (discount > gross) throw error('VALIDATION_ERROR', `Item ${index + 1}: discount cannot exceed item gross total.`);
  return {
    salesOrderId,
    id: text(item.id),
    productId,
    itemNumber: index + 1,
    quantity,
    unitPrice,
    discountType,
    discountValue,
    itemTotal: Math.round((gross - discount) * 100) / 100,
    isCustom: Boolean(item.isCustom),
    productionNotes: text(item.productionNotes),
    artworkFileUrl: text(item.artworkFileUrl),
    artworkDriveUrl: text(item.artworkDriveUrl),
  };
}

export function validateAndNormalizeItems(salesOrderId, items) {
  if (!Array.isArray(items) || items.length < 1) throw error('VALIDATION_ERROR', 'At least one sales order item is required.');
  return items.map((item, index) => normalize(item ?? {}, index, salesOrderId));
}

export async function validateAndCreateItems(db, salesOrderId, items) {
  const normalized = validateAndNormalizeItems(salesOrderId, items);
  return Promise.all(normalized.map((item) => repository.createItem(db, item)));
}

export async function listItems(db, salesOrderId) { return repository.listItems(db, salesOrderId); }
