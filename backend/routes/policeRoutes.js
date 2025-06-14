import express from 'express';
import { getUnverifiedUsers, getUnverifiedUsersbyId, submitCertificateRequest, signUserCertificate } from '../controllers/policeController.js';
import { authenticate, authorize, ROLES } from '../middleware/authMiddleware.js';
import { upload } from '../config/multerConfig.js';
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

router.get('/unverified-users/:userId',
    authenticate,
    authorize('view_unverified_users', {
        requiredRoles: ROLES.POLICE,
        checkOfficeScope: true,
        targetOfficeName: 'BCA'
    }),
    getUnverifiedUsersbyId
);

router.post('/certificate',
    authenticate,
    authorize('sign_certificate', {
        requiredRoles: ROLES.POLICE,
        checkOfficeScope: true,
        targetOfficeName: 'BCA'
    }),
    submitCertificateRequest
);

router.post('/sign-certificate/:userId',
    authenticate,
    authorize('sign_certificate', {
        requiredRoles: ROLES.POLICE,
        checkOfficeScope: true,
        targetOfficeName: 'BCA'
    }),
    upload,
    signUserCertificate
);

export default router;