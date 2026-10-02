import { Router } from 'express';
import { create, getById, list, update } from './product.controller.js';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('PRODUCT_VIEW'), list);
router.get('/:id', requirePermission('PRODUCT_VIEW'), getById);
router.post('/', requirePermission('PRODUCT_CREATE'), create);
router.patch('/:id', requirePermission('PRODUCT_EDIT'), update);

export default router;
