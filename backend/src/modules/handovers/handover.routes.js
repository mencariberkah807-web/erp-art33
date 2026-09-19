import { Router } from 'express';
import { create, list } from './handover.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/handovers', list);
router.post('/sales-orders/:id/handovers', create);

export default router;
