import express from 'express';
import { authenticate, verifyRole, ROLES } from '../middleware/authMiddleware.js';
import {
  // User Management
  listUsers,
  getUserById,
  updateUserRole,
  deactivateUser,
  activateUser,
  resetUserPassword,
  
  // Role Management
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions,
  
  // Permission Management
  listPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  
  // Application Management
  listAllApplications,
  getApplicationById,
  updateApplicationStatus,
  
  // Statistics & Reports
  getSystemStats,
  getApplicationStats,
  getUserStats,
  
  // Audit Logs
  getAuditLogs,
  getAuditLogById
} from '../controllers/adminController.js';

const router = express.Router();

// Apply authentication and admin verification middleware to all routes
router.use(authenticate);
router.use(verifyRole(ROLES.ADMIN));

// User Management Routes
router.get('/users', listUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId/role', updateUserRole);
router.put('/users/:userId/deactivate', deactivateUser);
router.put('/users/:userId/activate', activateUser);
router.put('/users/:userId/reset-password', resetUserPassword);

// Role Management Routes
router.get('/roles', listRoles);
router.get('/roles/:roleId', getRoleById);
router.post('/roles', createRole);
router.put('/roles/:roleId', updateRole);
router.delete('/roles/:roleId', deleteRole);
router.put('/roles/:roleId/permissions', updateRolePermissions);

// Permission Management Routes
router.get('/permissions', listPermissions);
router.get('/permissions/:permissionId', getPermissionById);
router.post('/permissions', createPermission);
router.put('/permissions/:permissionId', updatePermission);
router.delete('/permissions/:permissionId', deletePermission);

// Application Management Routes
router.get('/applications', listAllApplications);
router.get('/applications/:applicationId', getApplicationById);
router.put('/applications/:applicationId/status', updateApplicationStatus);

// Statistics & Reports Routes
router.get('/stats/system', getSystemStats);
router.get('/stats/applications', getApplicationStats);
router.get('/stats/users', getUserStats);

// Audit Logs Routes
router.get('/audit-logs', getAuditLogs);
router.get('/audit-logs/:logId', getAuditLogById);

export default router; 