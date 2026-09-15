import * as repository from './workOrder.repository.js';

const STATUSES = new Set(['READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'COMPLETED_PRODUCTION', 'INACTIVE']);

function error(code, message) { return Object.assign(new Error(message), { code }); }

export async function listWorkOrders(pool, query) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize, 10) || 20, 1), 100);
  const status = query.status ? String(query.status).trim().toUpperCase() : undefined;
  if (status && !STATUSES.has(status)) throw error('VALIDATION_ERROR', 'Invalid work order status.');
  const search = query.search ? String(query.search).trim() : undefined;
  const result = await repository.listWorkOrders(pool, { page, pageSize, search, status });
  return { data: result.rows, meta: { page, pageSize, total: result.total } };
}
