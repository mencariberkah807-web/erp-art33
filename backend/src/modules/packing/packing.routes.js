import { Router } from 'express';
import * as controller from './packing.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', controller.list);
router.get('/:salesOrderId', controller.getBySalesOrder);
router.post('/:salesOrderId/pack', controller.pack);

export default router;
