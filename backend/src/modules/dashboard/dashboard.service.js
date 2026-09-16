import * as repository from './dashboard.repository.js';

export async function getDashboard(pool) {
  const db = await pool.connect();
  try {
    const result = await repository.getDashboardSummary(db);
    const production = Object.fromEntries(result.production.map((row) => [row.status, row.total]));
    const fulfillment = Object.fromEntries(result.fulfillment.map((row) => [row.status, row.total]));
    return {
      summary: {
        totalSO: result.summary.total_so,
        draft: 0,
        dpPaid: result.summary.dp_paid,
        readyWO: result.summary.ready_wo,
        delivered: result.summary.delivered,
      },
      production: {
        ready: production.READY_FOR_PRODUCTION || 0,
        inProduction: production.IN_PRODUCTION || 0,
        completed: production.COMPLETED_PRODUCTION || 0,
      },
      fulfillment: {
        packing: fulfillment.PACKING || 0,
        rts: fulfillment.RTS || 0,
      },
      recentSalesOrders: result.recent,
    };
  } finally {
    db.release();
  }
}
