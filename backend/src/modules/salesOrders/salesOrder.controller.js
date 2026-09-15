import { pool } from '../../db/pool.js';
import * as service from './salesOrder.service.js';
import * as workOrderService from './salesOrderWorkOrder.service.js';
import * as lifecycleService from './salesOrderLifecycle.service.js';

function sendError(response, e) {
  const status = e.code === 'VALIDATION_ERROR' ? 400 : e.code === 'CONFLICT' ? 409 : e.code === 'NOT_FOUND' ? 404 : 500;
  response.status(status).json({ error: { code: e.code || 'INTERNAL_SERVER_ERROR', message: e.message, details: {} } });
}
export async function list(request, response) { try { response.json(await service.listSalesOrders(pool, request.query)); } catch (e) { sendError(response, e); } }
export async function getById(request, response) { try { const data = await service.getSalesOrderDetail(pool, request.params.id); if (!data) return response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Sales order not found.', details: {} } }); response.json({ data }); } catch (e) { sendError(response, e); } }
export async function create(request, response) { try { response.status(201).json({ data: await service.createSalesOrder(pool, request.body ?? {}) }); } catch (e) { sendError(response, e); } }
export async function createWorkOrders(request, response) { try { const itemIds = Array.isArray(request.body?.itemIds) ? request.body.itemIds : null; const data = await workOrderService.createWorkOrdersForSalesOrder(pool, request.params.id, itemIds); response.status(201).json({ data }); } catch (e) { sendError(response, e); } }
export async function readyProduction(request, response) { try { response.json({ data: await lifecycleService.markReadyForProduction(pool, request.params.id) }); } catch (e) { sendError(response, e); } }
