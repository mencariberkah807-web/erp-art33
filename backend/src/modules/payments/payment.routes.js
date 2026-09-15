import { Router } from 'express';
import * as controller from './payment.controller.js';

const router = Router();
router.get('/:salesOrderId', controller.list);
router.post('/:salesOrderId', controller.create);

export default router;
