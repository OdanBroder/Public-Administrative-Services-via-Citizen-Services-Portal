import express from 'express';
const router = express.Router();
import {  createBirthRegistration,
  getAllBirthRegistrations,
  getBirthRegistrationById,
  getBirthRegistrationByApplicantId,
  changeBirthRegistrationStatus
} from '../controllers/birthRegistrationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

// @route   POST api/birth-registration
// @desc    Create a new birth registration
// @access  Public
router.post("/", authenticate, authorize("submit_request"), createBirthRegistration);

// @route   GET api/birth-registration
// @desc    Get all birth registrations with pagination
// @access  Public
router.get("/", authenticate, authorize("process_request", {checkOfficeScope: true, targetOfficeName:'UBND'}) , getAllBirthRegistrations);

// @route   GET api/birth-registration/:id
// @desc    Get birth registration by ID
// @access  Public
router.get("/:id", authenticate, authorize(["view_own_request", "process_request"],{checkOfficeScope: true, targetOfficeName:'UBND'} ), getBirthRegistrationById);

router.get("/user/:applicantId",authenticate, authorize(["view_own_request", "process_request"],{checkOfficeScope: true, targetOfficeName:'UBND'} ), getBirthRegistrationByApplicantId)
router.patch("/status/:id", authenticate, authorize("process_request"), changeBirthRegistrationStatus );
export default router;
