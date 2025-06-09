import express from 'express';
import { authenticate, authorize, ROLES } from '../middleware/authMiddleware.js';
import { getUsers, updateUserRole } from '../controllers/consoleController.js';

const router = express.Router();

router.get('/console/users', 
  authenticate, 
  authorize('manage_users', { 
    requiredRoles: ROLES.ADMIN 
  }), 
  getUsers
);

router.patch('/console/users/:id/role', 
  authenticate, 
  authorize('assign_roles', { 
    requiredRoles: ROLES.ADMIN 
  }), 
  updateUserRole
);

export default router;

