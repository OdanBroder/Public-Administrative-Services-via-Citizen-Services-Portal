import express from 'express';
import { authenticate, authorize, ROLES } from '../middleware/authMiddleware.js';
import {
  getPendingMedicalCoverage,
  getPendingServiceHealth,
  getMedicalCoverageById,
  getServiceHealthById,
  approveMedicalCoverage,
  approveServiceHealth,
  rejectMedicalCoverage,
  rejectServiceHealth
} from '../controllers/sytController.js';

const router = express.Router();

// Medical Coverage Routes
router.get('/medical-coverage/pending', 
  authenticate, 
  authorize('process_request', {
    requiredRoles: ROLES.SYT,
    checkOfficeScope: true,
    targetOfficeName: 'SYT'
  }), 
  getPendingMedicalCoverage
);

router.get('/medical-coverage/:applicationId', 
  authenticate, 
  authorize('process_request', {
    requiredRoles: ROLES.SYT,
    checkOfficeScope: true,
    targetOfficeName: 'SYT'
  }), 
  getMedicalCoverageById
);

router.post('/medical-coverage/:applicationId/approve', 
  authenticate, 
  authorize('approve_request', {
    requiredRoles: ROLES.SYT,
    checkOfficeScope: true,
    targetOfficeName: 'SYT'
  }), 
  approveMedicalCoverage
);

router.post('/medical-coverage/:applicationId/reject', 
  authenticate, 
  authorize('process_request', {
    requiredRoles: ROLES.SYT,
    checkOfficeScope: true,
    targetOfficeName: 'SYT'
  }), 
  rejectMedicalCoverage
);

// Service Health Routes
router.get('/service-health/pending', 
  authenticate, 
  authorize('manage_service_health', {
    requiredRoles: ROLES.SYT,
    checkOfficeScope: true,
    targetOfficeName: 'SYT'
  }), 
  getPendingServiceHealth
);

router.get('/service-health/:applicationId', 
  authenticate, 
  authorize('manage_service_health', {
    requiredRoles: ROLES.SYT,
    checkOfficeScope: true,
    targetOfficeName: 'SYT'
  }), 
  getServiceHealthById
);

router.post('/service-health/:applicationId/approve', 
  authenticate, 
  authorize('manage_service_health', {
    requiredRoles: ROLES.SYT,
    checkOfficeScope: true,
    targetOfficeName: 'SYT'
  }), 
  approveServiceHealth
);

router.post('/service-health/:applicationId/reject', 
  authenticate, 
  authorize('manage_service_health', {
    requiredRoles: ROLES.SYT,
    checkOfficeScope: true,
    targetOfficeName: 'SYT'
  }), 
  rejectServiceHealth
);

export default router;