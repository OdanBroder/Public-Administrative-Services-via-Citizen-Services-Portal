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
router.get('/birthRegistrations', 
  authenticate, 
  authorize('view_bca_applications', { 
    requiredRoles: ROLES.BCA,
    checkOfficeScope: true,
    targetOfficeName: 'Birth Certificate Authority'
  }), 
  getPendingApplications
);

// Get a specific birth registration application
router.get('/birthRegistrations/:birthRegistrationId', 
  authenticate, 
  authorize('view_bca_applications', { 
    requiredRoles: ROLES.BCA,
    checkOfficeScope: true,
    targetOfficeName: 'Birth Certificate Authority'
  }), 
  getApplicationById
);

// Approve a birth registration application
router.post('/birthRegistrations/:birthRegistrationId/approve', 
  authenticate, 
  authorize('process_bca_applications', { 
    requiredRoles: ROLES.BCA,
    checkOfficeScope: true,
    targetOfficeName: 'Birth Certificate Authority'
  }), 
  approveApplication
);

// Reject a birth registration application
router.post('/birthRegistrations/:birthRegistrationId/reject', 
  authenticate, 
  authorize('process_bca_applications', { 
    requiredRoles: ROLES.BCA,
    checkOfficeScope: true,
    targetOfficeName: 'Birth Certificate Authority'
  }), 
  rejectApplication
);

export default router;