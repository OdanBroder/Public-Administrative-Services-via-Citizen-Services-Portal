import express from 'express';
import {
  getServiceHealth,
  createServiceHealth,
  updateServiceHealth,
  deleteServiceHealth
} from '../controllers/serviceHealthController.js';
import { authenticate, authorize, ROLES } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, getServiceHealth);

router.post('/', 
  authenticate, 
  authorize('manage_service_health', {
    requiredRoles: [ROLES.ADMIN, ROLES.SYT]
  }), 
  createServiceHealth
);

router.put('/:id', 
  authenticate, 
  authorize('manage_service_health', {
    requiredRoles: [ROLES.ADMIN, ROLES.SYT]
  }), 
  updateServiceHealth
);

router.delete('/:id', 
  authenticate, 
  authorize('manage_service_health', {
    requiredRoles: ROLES.ADMIN
  }), 
  deleteServiceHealth
);

export default router;