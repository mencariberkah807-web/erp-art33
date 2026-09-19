import { Router } from 'express';
import * as controller from './workOrder.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/:id/start', controller.start);
router.post('/:id/complete', controller.complete);

export default router;
