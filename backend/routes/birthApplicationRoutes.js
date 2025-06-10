import express from 'express';
const router = express.Router();
import {
  createBirthRegistration,
  verifyBirthRegistration,
  getAllBirthRegistrations,
  getBirthRegistrationById,
  getBirthRegistrationByApplicantId,
  changeBirthRegistrationStatus
} from '../controllers/birthRegistrationController.js';
import { authenticate, authorize, ROLES } from '../middleware/authMiddleware.js';

router.post("/", 
  authenticate, 
  authorize("submit_request", { 
    requiredRoles: ROLES.CITIZEN 
  }), 
  createBirthRegistration
);

router.post("/verify/:birthRegistrationId",
  authenticate, 
  authorize("process_request", {
    requiredRoles: [ROLES.ADMIN, ROLES.BCA],
    checkOfficeScope: true, 
    targetOfficeName: 'Birth Certificate Authority'
  }), 
  verifyBirthRegistration
); 

router.get("/", 
  authenticate, 
  authorize("process_request", {
    requiredRoles: [ROLES.ADMIN, ROLES.BCA, ROLES.SYT],
    checkOfficeScope: true, 
    targetOfficeName: 'Birth Certificate Authority'
  }),
  getAllBirthRegistrations
);

router.get("/:id", 
  authenticate, 
  authorize(["view_own_request", "process_request"], {
    checkOfficeScope: true, 
    targetOfficeName: 'Birth Certificate Authority'
  }), 
  getBirthRegistrationById
);

router.get("/user/:applicantId", 
  authenticate, 
  authorize(["view_own_request", "process_request"], {
    checkOfficeScope: true, 
    targetOfficeName: 'Birth Certificate Authority'
  }), 
  getBirthRegistrationByApplicantId
);

router.patch("/status/:id", 
  authenticate, 
  authorize("process_request", {
    requiredRoles: [ROLES.ADMIN, ROLES.BCA],
    checkOfficeScope: true, 
    targetOfficeName: 'Birth Certificate Authority'
  }), 
  changeBirthRegistrationStatus
);

export default router;
