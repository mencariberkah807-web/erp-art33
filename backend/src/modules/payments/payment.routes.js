import { Router } from 'express';
import * as controller from './payment.controller.js';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/:salesOrderId', requirePermission('PAYMENT_VIEW'), controller.list);
router.post('/:salesOrderId', requirePermission('PAYMENT_CREATE'), controller.create);
// Compatibility route for Sales Order Detail payment action.
router.post('/:salesOrderId/payments', requirePermission('PAYMENT_CREATE'), controller.create);

export default router;
