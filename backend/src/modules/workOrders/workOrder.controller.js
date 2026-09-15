import { pool } from '../../db/pool.js';
import * as repository from './workOrder.repository.js';
import * as detailRepository from './workOrderDetail.repository.js';
import * as lifecycle from './workOrderLifecycle.service.js';

function sendError(response, error) {
  const status = error.code === 'VALIDATION_ERROR' ? 400 : error.code === 'NOT_FOUND' ? 404 : 500;
  response.status(status).json({ error: { code: error.code || 'INTERNAL_SERVER_ERROR', message: error.message || 'An unexpected error occurred.', details: {} } });
}

export async function getById(request, response) {
  try {
    const data = await detailRepository.findOperationalDetail(pool, request.params.id);
    if (!data) return response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Work order not found.', details: {} } });
    response.json({ data });
  } catch (error) { sendError(response, error); }
}

export async function start(request, response) {
  try { response.json({ data: await lifecycle.startWorkOrder(pool, request.params.id) }); }
  catch (error) { sendError(response, error); }
}

export async function complete(request, response) {
  try { response.json({ data: await lifecycle.completeWorkOrder(pool, request.params.id) }); }
  catch (error) { sendError(response, error); }
}
