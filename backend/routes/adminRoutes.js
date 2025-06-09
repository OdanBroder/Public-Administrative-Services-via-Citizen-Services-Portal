import express from 'express';
import { checkPermission } from '../middleware/authMiddleware.js';
import {
  listUsers,
  updateUserRole,
  listRoles,
  createRole,
  updateRolePermissions,
  listPermissions,
  createPermission
} from '../controllers/adminController.js';

const router = express.Router();

// User management routes
router.get('/users', checkPermission('manage_users'), listUsers);
router.patch('/users/:userId/role', checkPermission('assign_roles'), updateUserRole);

// Role management routes
router.get('/roles', checkPermission('manage_users'), listRoles);
router.post('/roles', checkPermission('assign_roles'), createRole);
router.patch('/roles/:roleId/permissions', checkPermission('assign_roles'), updateRolePermissions);

// Permission management routes
router.get('/permissions', checkPermission('manage_users'), listPermissions);
router.post('/permissions', checkPermission('assign_roles'), createPermission);

export default router; 