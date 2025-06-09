import express from 'express';
import {
  getMedicalCoverage,
  createMedicalCoverage,
  updateMedicalCoverage,
  deleteMedicalCoverage
} from '../controllers/medicalCoverageController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get Bảo hiểm Y tế (all authenticated users)
router.get('/:userId', authenticate, getMedicalCoverage);

// Create Bảo hiểm Y tế (admin/staff can create for others, users can create for themselves)
router.post('/', authenticate, createMedicalCoverage);

// Update Bảo hiểm Y tế (admin/staff only)
router.put('/:id', authenticate, authorize('manage_users'), updateMedicalCoverage);

// Delete Bảo hiểm Y tế (admin only)
router.delete('/:id', authenticate, authorize('manage_users'), deleteMedicalCoverage);

export default router; 