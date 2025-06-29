import express from 'express';
const router = express.Router();
import { upload } from '../config/multerConfig.js';
import {
  createBirthRegistration,
  verifyBirthRegistration,
  getAllBirthRegistrations,
  getBirthRegistrationById,
  getBirthRegistrationByApplicantId,
  changeBirthRegistrationStatus,
  getBirthRegistrationSubmitterSignature,
  getBirthRegistrationIssuerSignature
} from '../controllers/birthRegistrationController.js';
import { authenticate, authorize, ROLES } from '../middleware/authMiddleware.js';

router.post("/", 
  authenticate, 
  authorize("submit_request", { 
    requiredRoles: ROLES.CITIZEN 
  }), 
  upload,
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

router.get("/:id/signature",
  authenticate,
  getBirthRegistrationSubmitterSignature
)

router.get("/:id/issuer-signature",
  authenticate,
  getBirthRegistrationIssuerSignature
)
export default router;
