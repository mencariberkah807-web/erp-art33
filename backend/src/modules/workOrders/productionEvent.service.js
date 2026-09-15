import * as repository from './productionEvent.repository.js';
import * as workOrderRepository from './workOrder.repository.js';

const PROCESS_TYPES = new Set(['LASER_CUTTING', 'UV_PRINTING', 'ASSEMBLY', 'LASER_MARKING', 'FINISHING']);
const STATUSES = new Set(['START', 'IN_PROGRESS', 'DONE']);

function error(code, message) { return Object.assign(new Error(message), { code }); }
function text(value) { if (value === undefined || value === null) return null; const v = String(value).trim(); return v || null; }

function normalize(input, workOrderId) {
  const processType = text(input.processType)?.toUpperCase();
  const status = text(input.status)?.toUpperCase();
  if (!PROCESS_TYPES.has(processType)) throw error('VALIDATION_ERROR', 'Invalid production process type.');
  if (!STATUSES.has(status)) throw error('VALIDATION_ERROR', 'Production status must be START, IN_PROGRESS, or DONE.');
  return {
    workOrderId,
    processType,
    status,
    startedAt: input.startedAt || null,
    completedAt: input.completedAt || null,
    notes: text(input.notes),
    createdBy: text(input.createdBy),
  };
}

export async function listProductionEvents(db, workOrderId) {
  const workOrder = await workOrderRepository.findWorkOrderById(db, workOrderId);
  if (!workOrder) throw error('NOT_FOUND', 'Work order not found.');
  return repository.listProductionEvents(db, workOrderId);
}

export async function createProductionEvent(db, workOrderId, input) {
  const workOrder = await workOrderRepository.findWorkOrderById(db, workOrderId);
  if (!workOrder) throw error('NOT_FOUND', 'Work order not found.');
  if (workOrder.status !== 'IN_PRODUCTION') throw error('VALIDATION_ERROR', 'Production events can only be recorded while the work order is in production.');
  return repository.createProductionEvent(db, workOrderId, normalize(input, workOrderId));
}
