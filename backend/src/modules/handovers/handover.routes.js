import { Router } from 'express';
import { create, list } from './handover.controller.js';

const router = Router();
router.get('/handovers', list);
router.post('/sales-orders/:id/handovers', create);

export default router;
