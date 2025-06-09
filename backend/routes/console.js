import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { getUsers, updateUserRole } from '../controllers/consoleController.js';

const router = express.Router();

// Route: GET /api/admin/console/users
// Description: Fetches a list of users for the admin console
// Access: Admin role with 'manage_users' permission
router.get('/console/users', authenticate, authorize('manage_users'), getUsers);

// Route: PATCH /api/admin/console/users/:id/role
// Description: Updates a user's role
// Access: Admin role with 'manage_users' permission
router.patch('/console/users/:id/role', authenticate, authorize('manage_users'), updateUserRole);

export default router;

