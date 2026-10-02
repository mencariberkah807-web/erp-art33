import { Router } from 'express';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { getDashboard } from './dashboard.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', requirePermission('DASHBOARD_VIEW'), getDashboard);

export default router;
