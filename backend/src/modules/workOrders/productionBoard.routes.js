import { Router } from 'express';
import { getBoard } from './productionBoard.controller.js';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('PRODUCTION_VIEW'), getBoard);

export default router;
