import { Router } from 'express';
import * as controller from './packing.controller.js';

const router = Router();
router.get('/', controller.list);
router.get('/:salesOrderId', controller.getBySalesOrder);
router.post('/:salesOrderId/pack', controller.pack);

export default router;
