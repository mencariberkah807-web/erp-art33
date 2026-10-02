import { Router } from 'express';
import { cancel, complete, create, createWorkOrders, getById, list, readyProduction, update } from './salesOrder.controller.js';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('SALES_ORDER_VIEW'), list);
router.get('/:id', requirePermission('SALES_ORDER_VIEW'), getById);
router.post('/', requirePermission('SALES_ORDER_CREATE'), create);
router.patch('/:id', requirePermission('SALES_ORDER_EDIT'), update);
router.post('/:id/ready-production', requirePermission('SALES_ORDER_ACTION'), readyProduction);
router.post('/:id/work-orders', requirePermission('SALES_ORDER_ACTION'), createWorkOrders);
router.post('/:id/cancel', requirePermission('SALES_ORDER_ACTION'), cancel);
router.post('/:id/complete', requirePermission('SALES_ORDER_ACTION'), complete);

export default router;
