import express from 'express';
import { authenticate, authorize, ROLES } from '../middleware/authMiddleware.js';
import {
  getPendingApplications,
  getApplicationById,
  approveApplication,
  rejectApplication
} from '../controllers/bcaController.js';

const router = express.Router();

// Get all pending birth registration applications
router.get('/applications/pending', 
  authenticate, 
  authorize('view_bca_applications', { 
    requiredRoles: ROLES.BCA,
    checkOfficeScope: true,
    targetOfficeName: 'Birth Certificate Authority'
  }), 
  getPendingApplications
);

// Get a specific birth registration application
router.get('/applications/:applicationId', 
  authenticate, 
  authorize('view_bca_applications', { 
    requiredRoles: ROLES.BCA,
    checkOfficeScope: true,
    targetOfficeName: 'Birth Certificate Authority'
  }), 
  getApplicationById
);

// Approve a birth registration application
router.post('/applications/:applicationId/approve', 
  authenticate, 
  authorize('process_bca_applications', { 
    requiredRoles: ROLES.BCA,
    checkOfficeScope: true,
    targetOfficeName: 'Birth Certificate Authority'
  }), 
  approveApplication
);

// Reject a birth registration application
router.post('/applications/:applicationId/reject', 
  authenticate, 
  authorize('process_bca_applications', { 
    requiredRoles: ROLES.BCA,
    checkOfficeScope: true,
    targetOfficeName: 'Birth Certificate Authority'
  }), 
  rejectApplication
);

export default router;