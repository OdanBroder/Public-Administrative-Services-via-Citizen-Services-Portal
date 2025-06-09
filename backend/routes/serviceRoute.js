import express from 'express';
const router = express.Router();
import {getAllOffices, getAllServices} from '../controllers/servicesController.js';
import { authenticate } from '../middleware/authMiddleware.js';
// @route   GET api/services
// @desc    Get all services with optional office filter
// @access  Public
router.get('/', authenticate,getAllServices);

// @route   GET api/services/offices
// @desc    Get all offices for filter dropdown
// @access  Public
router.get('/offices', authenticate, getAllOffices);

export default router;