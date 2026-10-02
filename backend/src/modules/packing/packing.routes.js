import { Router } from 'express';
import * as controller from './packing.controller.js';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('PACKING_VIEW'), controller.list);
router.get('/:salesOrderId', requirePermission('PACKING_VIEW'), controller.getBySalesOrder);
router.post('/:salesOrderId/pack', requirePermission('PACKING_ACTION'), controller.pack);

export default router;
