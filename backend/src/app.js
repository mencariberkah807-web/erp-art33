import cors from 'cors';
import express from 'express';
import { checkDatabaseHealth, isDatabaseConfigured } from './db/pool.js';
import customerRoutes from './modules/customers/customer.routes.js';
import productRoutes from './modules/products/product.routes.js';
import salesOrderRoutes from './modules/salesOrders/salesOrder.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import productionEventRoutes from './modules/workOrders/productionEvent.routes.js';
import workOrderRoutes from './modules/workOrders/workOrder.routes.js';
import productionBoardRoutes from './modules/workOrders/productionBoard.routes.js';
import packingRoutes from './modules/packing/packing.routes.js';
import handoverRoutes from './modules/handovers/handover.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/health', async (_request, response) => {
  const database = isDatabaseConfigured()
    ? await checkDatabaseHealth()
    : { status: 'not_configured' };
  const healthy = database.status !== 'error';
  response.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', service: 'erp-art33-api', database, timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/sales-orders', salesOrderRoutes);
app.use('/api/v1/sales-orders', paymentRoutes);
app.use('/api/v1/work-orders/:id/production-events', productionEventRoutes);
app.use('/api/v1/work-orders', workOrderRoutes);
app.use('/api/v1/production-board', productionBoardRoutes);
app.use('/api/v1/packing', packingRoutes);
app.use('/api/v1', handoverRoutes);

app.use((_request, response) => response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.', details: {} } }));
app.use((error, _request, response, _next) => { console.error(error); response.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.', details: {} } }); });

export default app;
