import express from 'express';
import {
  getServiceHealth,
  createServiceHealth,
  updateServiceHealth,
  deleteServiceHealth
} from '../controllers/serviceHealthController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get service health (all authenticated users)
router.get('/', authenticate, getServiceHealth);

// Create service health (admin only)
router.post('/', authenticate, authorize('manage_service_health'), createServiceHealth);

// Update service health (admin only)
router.put('/:id', authenticate, authorize('manage_service_health'), updateServiceHealth);

// Delete service health (admin only)
router.delete('/:id', authenticate, authorize('manage_service_health'), deleteServiceHealth);

export default router; 