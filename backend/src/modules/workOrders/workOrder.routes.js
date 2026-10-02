import { Router } from 'express';
import * as controller from './workOrder.controller.js';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('WORK_ORDER_VIEW'), controller.list);
router.get('/:id', requirePermission('WORK_ORDER_VIEW'), controller.getById);
router.post('/:id/start', requirePermission('WORK_ORDER_ACTION'), controller.start);
router.post('/:id/complete', requirePermission('WORK_ORDER_ACTION'), controller.complete);

export default router;
