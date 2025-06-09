import express from 'express';
import { getAllOffices, getAllServices } from '../controllers/servicesController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, getAllServices);

router.get('/offices', authenticate, getAllOffices);

export default router;