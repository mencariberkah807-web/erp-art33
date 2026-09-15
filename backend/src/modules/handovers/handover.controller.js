import { getPool } from '../../db/pool.js';
import * as service from './handover.service.js';

function sendError(response, error) {
  const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'CONFLICT' ? 409 : error.code === 'VALIDATION_ERROR' ? 400 : 500;
  response.status(status).json({ error: { code: error.code || 'INTERNAL_SERVER_ERROR', message: error.message || 'Unexpected error.', details: {} } });
}

export async function list(request, response) {
  try { response.json({ data: await service.listHandovers(getPool()) }); }
  catch (error) { sendError(response, error); }
}

export async function create(request, response) {
  try { const result = await service.createHandover(getPool(), request.params.id, request.body || {}); response.status(201).json({ data: result }); }
  catch (error) { sendError(response, error); }
}
