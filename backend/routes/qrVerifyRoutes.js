import express from 'express';
import { authenticate, authorize, ROLES } from '../middleware/authMiddleware.js';
import { getApplicantQrSignature } from '../controllers/qrVerifyController.js';
import { getIssuerQrSignature } from '../controllers/qrVerifyController.js';