import express from 'express';
import { verifyToken, verifySYT } from '../middleware/authMiddleware.js';
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
router.get('/medical-coverage/pending', verifyToken, verifySYT, getPendingMedicalCoverage);
router.get('/medical-coverage/:applicationId', verifyToken, verifySYT, getMedicalCoverageById);
router.post('/medical-coverage/:applicationId/approve', verifyToken, verifySYT, approveMedicalCoverage);
router.post('/medical-coverage/:applicationId/reject', verifyToken, verifySYT, rejectMedicalCoverage);

// Service Health Routes
router.get('/service-health/pending', verifyToken, verifySYT, getPendingServiceHealth);
router.get('/service-health/:applicationId', verifyToken, verifySYT, getServiceHealthById);
router.post('/service-health/:applicationId/approve', verifyToken, verifySYT, approveServiceHealth);
router.post('/service-health/:applicationId/reject', verifyToken, verifySYT, rejectServiceHealth);

export default router; 