import {authenticate, authorize, ROLES} from '../middleware/authMiddleware.js';
import Citizen from '../models/Citizen.js';
import {upload, encryptFileMiddleware, generateFilename} from '../config/multerConfig.js';
import express from 'express';
import { createCitizen, getCitizenById, getMyCsr, getMyCert } from '../controllers/citizenController.js';
const router = express.Router();

router.post("/", 
  authenticate, 
  authorize("submit_request", {
    requiredRoles: [ROLES.CITIZEN, ROLES.ADMIN]
  }),
  upload, 
  encryptFileMiddleware,
  createCitizen
);

router.get("/my-csr", 
  authenticate,
  authorize(["view_own_request"]),
  getMyCsr
);

router.get("/my-certificate", 
  authenticate,
  authorize(["view_own_request"]),
  getMyCert
);

router.get("/:id", 
  authenticate,
  authorize(["view_own_request", "manage_users"], {
    // Staff roles can view any citizen data
    requiredRoles: [ROLES.CITIZEN, ROLES.ADMIN, ROLES.BCA, ROLES.SYT, ROLES.POLICE]
  }),
  getCitizenById
);

export default router;

