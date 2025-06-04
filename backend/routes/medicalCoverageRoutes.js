import express from 'express';
import {
  getMedicalCoverage,
  createMedicalCoverage,
  updateMedicalCoverage,
  deleteMedicalCoverage
} from '../controllers/medicalCoverageController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/:citizenId', auth, getMedicalCoverage);
router.post('/', auth, createMedicalCoverage);
router.put('/:id', auth, updateMedicalCoverage);
router.delete('/:id', auth, deleteMedicalCoverage);

export default router; 