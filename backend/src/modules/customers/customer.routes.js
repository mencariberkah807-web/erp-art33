import { Router } from 'express';
import { create, getById, list, update } from './customer.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.patch('/:id', update);

export default router;
