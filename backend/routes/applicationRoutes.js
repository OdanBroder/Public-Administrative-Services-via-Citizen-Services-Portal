import express from 'express';
import {
  getUserApplications,
  getAllApplications,
  createApplication,
  updateApplicationStatus,
  deleteApplication
} from '../controllers/applicationController.js';
import { authenticate, authorize, ROLES } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get user's applications - any authenticated user can get their own applications
router.get('/my-applications', authenticate, getUserApplications);

// Get all applications (admin only)
router.get('/', authenticate, authorize('manage_applications', { 
  requiredRoles: [ROLES.ADMIN, ROLES.BCA, ROLES.SYT, ROLES.POLICE] 
}), getAllApplications);

// Create new application (citizens only)
router.post('/', authenticate, authorize('submit_request', { 
  requiredRoles: ROLES.CITIZEN 
}), createApplication);

// Update application status (staff/admin only)
router.put('/:id', authenticate, authorize('process_request', { 
  requiredRoles: [ROLES.ADMIN, ROLES.BCA, ROLES.SYT, ROLES.POLICE],
  checkOfficeScope: true
}), updateApplicationStatus);

// Delete application (admin only)
router.delete('/:id', authenticate, authorize('manage_applications', { 
  requiredRoles: ROLES.ADMIN 
}), deleteApplication);

export default router;