import { Router } from 'express';
import { create, getById, list, update } from './customer.controller.js';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('CUSTOMER_VIEW'), list);
router.get('/:id', requirePermission('CUSTOMER_VIEW'), getById);
router.post('/', requirePermission('CUSTOMER_CREATE'), create);
router.patch('/:id', requirePermission('CUSTOMER_EDIT'), update);

export default router;
