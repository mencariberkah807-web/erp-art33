import { getPool } from '../../db/pool.js';
import * as service from './dashboard.service.js';

export async function getDashboard(_request, response) {
  try {
    response.json({ data: await service.getDashboard(getPool()) });
  } catch (error) {
    response.status(500).json({ error: { code: error.code || 'INTERNAL_SERVER_ERROR', message: error.message || 'Unable to load dashboard.', details: {} } });
  }
}
