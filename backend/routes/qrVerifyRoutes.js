import express from 'express';
import { authenticate, authorize, ROLES } from '../middleware/authMiddleware.js';
import { fetchSignatureFromUUID } from '../controllers/qrVerifyController.js';

const router = express.Router();
// router.get('/qr/birth-registration/:id/issuer',authenticate,getIssuerQrSignature);
// router.get('/qr/birth-registration/:id/applicant',authenticate,getApplicantQrSignature);
// router.post('/qr/verify', authenticate, verifyQrSignature);

router.get("/signature/requester/:uuid",fetchSignatureFromUUID);

export default router;