import { getPool } from '../../db/pool.js';
import * as service from './productionBoard.service.js';

export async function getBoard(request, response) {
  try {
    response.json({ data: await service.getProductionBoard(getPool(), request.query) });
  } catch (error) {
    const status = error.code === 'VALIDATION_ERROR' ? 400 : 500;
    response.status(status).json({ error: { code: error.code || 'INTERNAL_SERVER_ERROR', message: error.message || 'An unexpected error occurred.', details: {} } });
  }
}
