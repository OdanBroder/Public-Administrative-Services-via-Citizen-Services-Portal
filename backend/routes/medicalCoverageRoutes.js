import express from 'express';
import {
  getMedicalCoverage,
  createMedicalCoverage,
  updateMedicalCoverage,
  deleteMedicalCoverage
} from '../controllers/medicalCoverageController.js';
import { authenticate, authorize, ROLES } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:userId', 
  authenticate, 
  authorize(['view_own_request', 'manage_service_health'], {
    requiredRoles: [ROLES.CITIZEN, ROLES.ADMIN, ROLES.SYT]
  }),
  getMedicalCoverage
);

router.post('/', 
  authenticate, 
  authorize(['process_request', 'manage_service_health'], {
    requiredRoles: [ROLES.ADMIN, ROLES.SYT],
    checkOfficeScope: true,
    targetOfficeName: 'SYT'
  }), 
  createMedicalCoverage
);

router.put('/:id', 
  authenticate, 
  authorize('manage_service_health', {
    requiredRoles: [ROLES.ADMIN, ROLES.SYT],
    checkOfficeScope: true,
    targetOfficeName: 'SYT'
  }), 
  updateMedicalCoverage
);

router.delete('/:id', 
  authenticate, 
  authorize('manage_service_health', {
    requiredRoles: ROLES.ADMIN
  }), 
  deleteMedicalCoverage
);

export default router;