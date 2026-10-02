import { Router } from 'express';
import { create, list } from './handover.controller.js';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/handovers', requirePermission('HANDOVER_VIEW'), list);
router.post('/sales-orders/:id/handovers', requirePermission('HANDOVER_ACTION'), create);

export default router;
