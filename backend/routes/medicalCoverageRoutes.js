import express from 'express';
import {
  getMedicalCoverage,
  createMedicalCoverage,
  updateMedicalCoverage,
  deleteMedicalCoverage
} from '../controllers/medicalCoverageController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get medical coverage (all authenticated users)
router.get('/:userId', authenticate, getMedicalCoverage);

// Create medical coverage (admin/staff can create for others, users can create for themselves)
router.post('/', authenticate, createMedicalCoverage);

// Update medical coverage (admin/staff only)
router.put('/:id', authenticate, authorize('manage_users'), updateMedicalCoverage);

// Delete medical coverage (admin only)
router.delete('/:id', authenticate, authorize('manage_users'), deleteMedicalCoverage);

export default router; 