import { Router } from 'express';
import { create, getById, list, update } from './product.controller.js';

const router = Router();

router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.patch('/:id', update);

export default router;
