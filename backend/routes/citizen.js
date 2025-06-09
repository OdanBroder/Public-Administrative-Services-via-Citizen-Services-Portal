import {authenticate} from '../middleware/auth.js';
import Citizen from '../models/Citizen.js';
import {upload, encryptFileMiddleware, generateFilename} from '../config/multerConfig.js';
import express from 'express';
import { createCitizen, getCitizenById } from '../controllers/citizenController.js';

const router = express.Router();

router.post("/", authenticate, upload, createCitizen);
router.get("/:id", authenticate, getCitizenById);

export default router;

