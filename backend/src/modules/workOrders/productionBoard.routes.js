import { Router } from 'express';
import { getBoard } from './productionBoard.controller.js';

const router = Router();
router.get('/', getBoard);

export default router;
