import { Router } from 'express';
import * as controller from './productionEvent.controller.js';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', requirePermission('PRODUCTION_VIEW'), controller.list);
router.post('/', requirePermission('PRODUCTION_ACTION'), controller.create);

export default router;
