import { pool } from '../../db/pool.js';
import * as service from './productionEvent.service.js';

function sendError(response, error) {
  const status = error.code === 'VALIDATION_ERROR' ? 400 : error.code === 'NOT_FOUND' ? 404 : 500;
  response.status(status).json({ error: { code: error.code || 'INTERNAL_SERVER_ERROR', message: error.message || 'An unexpected error occurred.', details: {} } });
}

export async function list(request, response) {
  try {
    response.json({ data: await service.listProductionEvents(pool, request.params.id) });
  } catch (error) { sendError(response, error); }
}

export async function create(request, response) {
  try {
    const data = await service.createProductionEvent(pool, request.params.id, request.body || {});
    response.status(201).json({ data });
  } catch (error) { sendError(response, error); }
}
