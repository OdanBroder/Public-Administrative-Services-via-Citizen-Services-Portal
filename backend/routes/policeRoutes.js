import express from 'express';
import { getUnverifiedUsers, signUserCertificate } from '../controllers/policeController.js';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';

const router = express.Router();

// Get all unverified users
router.get('/unverified-users',
    authenticate,
    checkRole(['police']),
    getUnverifiedUsers
);

// Sign user certificate
router.post('/sign-certificate/:userId',
    authenticate,
    checkRole(['police']),
    signUserCertificate
);

export default router; 