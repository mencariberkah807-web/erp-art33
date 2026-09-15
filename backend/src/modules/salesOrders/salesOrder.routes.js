import { Router } from 'express';
import { create, createWorkOrders, getById, list, readyProduction } from './salesOrder.controller.js';

const router = Router();
router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.post('/:id/ready-production', readyProduction);
router.post('/:id/work-orders', createWorkOrders);
export default router;
