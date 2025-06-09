import express from 'express';
import { getUnverifiedUsers, signUserCertificate } from '../controllers/policeController.js';
import { authenticate, authorize, ROLES } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/unverified-users',
    authenticate,
    authorize('view_unverified_users', {
        requiredRoles: ROLES.POLICE,
        checkOfficeScope: true,
        targetOfficeName: 'BCA'
    }),
    getUnverifiedUsers
);

router.post('/sign-certificate/:userId',
    authenticate,
    authorize('sign_certificate', {
        requiredRoles: ROLES.POLICE,
        checkOfficeScope: true,
        targetOfficeName: 'BCA'
    }),
    signUserCertificate
);

export default router;