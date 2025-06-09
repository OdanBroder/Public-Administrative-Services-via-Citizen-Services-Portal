import express from 'express';
import {
  getUserApplications,
  getAllApplications,
  createApplication,
  updateApplicationStatus,
  deleteApplication
} from '../controllers/applicationController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get user's applications
router.get('/my-applications', authenticate, getUserApplications);

// Get all applications (admin only)
router.get('/', authenticate, authorize('manage_users'), getAllApplications);

// Create new application
router.post('/', authenticate, authorize('submit_request'), createApplication);

// Update application status (staff/head only)
router.put('/:id', authenticate, authorize('process_request'), updateApplicationStatus);

// Delete application (admin only)
router.delete('/:id', authenticate, authorize('manage_users'), deleteApplication);

export default router; 