import { Router } from 'express';
import { requireAuth, requireOwner } from '../auth/auth.middleware.js';
import * as controller from './admin.controller.js';

const router = Router();

router.use(requireAuth, requireOwner);

router.get('/roles', controller.listRoles);
router.get('/roles/:id', controller.getRole);
router.post('/roles', controller.createRole);
router.patch('/roles/:id', controller.updateRole);
router.put('/roles/:id/permissions', controller.replaceRolePermissions);

export default router;
