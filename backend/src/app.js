import cors from 'cors';
import express from 'express';
import { checkDatabaseHealth, isDatabaseConfigured } from './db/pool.js';

const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', async (_request, response) => {
  const database = isDatabaseConfigured()
    ? await checkDatabaseHealth()
    : { status: 'not_configured' };

  const healthy = database.status !== 'error';

  response.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    service: 'erp-art33-api',
    database,
    timestamp: new Date().toISOString(),
  });
});

app.use((_request, response) => {
  response.status(404).json({
    error: 'NOT_FOUND',
    message: 'Route not found.',
  });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred.',
  });
});

export default app;
