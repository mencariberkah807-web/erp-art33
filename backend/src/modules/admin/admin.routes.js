import { Router } from 'express';
import { requireAuth, requireOwner } from '../auth/auth.middleware.js';
import * as controller from './admin.controller.js';
import * as userController from './admin.user.controller.js';

const router = Router();

router.use(requireAuth, requireOwner);

router.get('/roles', controller.listRoles);
router.get('/roles/:id', controller.getRole);
router.post('/roles', controller.createRole);
router.patch('/roles/:id', controller.updateRole);
router.put('/roles/:id/permissions', controller.replaceRolePermissions);

router.get('/users', userController.listUsers);
router.get('/users/:id', userController.getUser);
router.post('/users', userController.createUser);
router.patch('/users/:id', userController.updateUser);
router.put('/users/:id/roles', userController.replaceUserRoles);

export default router;
