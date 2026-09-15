import * as repository from './workOrder.repository.js';

const STATUSES = new Set(['READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'COMPLETED_PRODUCTION']);

function error(code, message) { return Object.assign(new Error(message), { code }); }

export async function getProductionBoard(pool, query) {
  const status = query.status ? String(query.status).trim().toUpperCase() : undefined;
  if (status && !STATUSES.has(status)) throw error('VALIDATION_ERROR', 'Invalid production board status.');
  const search = query.search ? String(query.search).trim() : undefined;
  const result = await repository.listWorkOrders(pool, { page: 1, pageSize: 100, search, status });
  const columns = {
    READY_FOR_PRODUCTION: [],
    IN_PRODUCTION: [],
    COMPLETED_PRODUCTION: [],
  };
  for (const workOrder of result.rows) columns[workOrder.status]?.push(workOrder);
  return {
    columns,
    meta: { total: result.total, generatedAt: new Date().toISOString() },
  };
}
