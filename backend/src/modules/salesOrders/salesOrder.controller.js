import { pool } from '../../db/pool.js';
import * as service from './salesOrder.service.js';
import * as itemService from './salesOrderItems.service.js';

function sendError(response, e) {
  const status = e.code === 'VALIDATION_ERROR' ? 400 : e.code === 'CONFLICT' ? 409 : 500;
  response.status(status).json({ error: { code: e.code || 'INTERNAL_SERVER_ERROR', message: e.message, details: {} } });
}

export async function list(request, response) { try { response.json(await service.listSalesOrders(pool, request.query)); } catch (e) { sendError(response, e); } }
export async function getById(request, response) {
  try {
    const data = await service.getSalesOrder(pool, request.params.id);
    if (!data) return response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Sales order not found.', details: {} } });
    const items = await itemService.listItems(pool, request.params.id);
    response.json({ data: { ...data, items } });
  } catch (e) { sendError(response, e); }
}
export async function create(request, response) { try { response.status(201).json({ data: await service.createSalesOrder(pool, request.body ?? {}) }); } catch (e) { sendError(response, e); } }
