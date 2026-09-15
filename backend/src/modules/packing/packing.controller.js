import * as service from './packing.service.js';
import { getPool } from '../../db/pool.js';

function sendError(response, error) {
  const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'CONFLICT' ? 409 : error.code === 'VALIDATION_ERROR' ? 400 : 500;
  response.status(status).json({ error: { code: error.code || 'INTERNAL_SERVER_ERROR', message: error.message || 'An unexpected error occurred.', details: {} } });
}

export async function list(request, response) {
  try { response.json({ data: await service.listPacking(getPool()) }); }
  catch (error) { sendError(response, error); }
}

export async function getBySalesOrder(request, response) {
  try {
    const result = await service.getPacking(getPool(), request.params.salesOrderId);
    if (!result) return response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Packing order not found.', details: {} } });
    response.json({ data: result });
  } catch (error) { sendError(response, error); }
}

export async function pack(request, response) {
  try { response.status(200).json({ data: await service.packSalesOrder(getPool(), request.params.salesOrderId, request.body || {}) }); }
  catch (error) { sendError(response, error); }
}
