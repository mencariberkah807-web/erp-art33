import { Router } from 'express';
import { create, getById, list } from './salesOrder.controller.js';

const router = Router();
router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
export default router;
