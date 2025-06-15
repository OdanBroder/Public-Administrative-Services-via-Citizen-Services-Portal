import express from 'express';
import { authenticate, authorize, ROLES } from '../middleware/authMiddleware.js';
import {
  getSignatureById,
  submitCertificateRequest,
  getPendingApplications,
  getApplicationById,
  approveApplication,
  rejectApplication
} from '../controllers/bcaController.js';
import { upload } from '../config/multerConfig.js';

const router = express.Router();

router.get('/birthRegistrations/:birthRegistrationId/signature', 
  authenticate, 
  authorize('view_bca_applications', { 
    requiredRoles: ROLES.BCA,
    checkOfficeScope: true,
    targetOfficeName: 'Birth Certificate Authority'
  }), 
  getSignatureById
);

router.post('/certificates/self-signed',
    authenticate,
    authorize('sign_certificate', {
        requiredRoles: ROLES.BCA,
        checkOfficeScope: true,
        targetOfficeName: 'BCA'
    }),
    upload, 
    submitCertificateRequest
);

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
  upload,
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