import express from 'express';
import { verifyToken, verifyBCA } from '../middleware/authMiddleware.js';
import {
  getPendingApplications,
  getApplicationById,
  approveApplication,
  rejectApplication
} from '../controllers/bcaController.js';

const router = express.Router();

// Get all pending birth registration applications
router.get('/applications/pending', verifyToken, verifyBCA, getPendingApplications);

// Get a specific birth registration application
router.get('/applications/:applicationId', verifyToken, verifyBCA, getApplicationById);

// Approve a birth registration application
router.post('/applications/:applicationId/approve', verifyToken, verifyBCA, approveApplication);

// Reject a birth registration application
router.post('/applications/:applicationId/reject', verifyToken, verifyBCA, rejectApplication);

export default router; 