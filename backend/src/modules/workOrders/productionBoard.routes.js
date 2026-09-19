import { Router } from 'express';
import { getBoard } from './productionBoard.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getBoard);

export default router;
