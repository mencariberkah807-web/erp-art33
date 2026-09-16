import { Router } from 'express';
import { cancel, complete, create, createWorkOrders, getById, list, readyProduction, update } from './salesOrder.controller.js';

const router = Router();
router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.patch('/:id', update);
router.post('/:id/ready-production', readyProduction);
router.post('/:id/work-orders', createWorkOrders);
router.post('/:id/cancel', cancel);
router.post('/:id/complete', complete);
export default router;
