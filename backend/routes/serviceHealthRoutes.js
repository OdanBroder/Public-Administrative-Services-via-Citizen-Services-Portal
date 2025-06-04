import express from 'express';
import {
  getServiceHealth,
  createServiceHealth,
  updateServiceHealth,
  deleteServiceHealth
} from '../controllers/serviceHealthController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getServiceHealth);
router.post('/', auth, createServiceHealth);
router.put('/:id', auth, updateServiceHealth);
router.delete('/:id', auth, deleteServiceHealth);

export default router; 