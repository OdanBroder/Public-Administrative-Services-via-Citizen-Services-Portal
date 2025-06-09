import multer from 'multer';
import path from 'path';
import { encrypt } from './cryptoUtils.js';
import tpmController from '../utils/crypto/tpmController.js'
// Set storage engine to memoryStorage to get file buffer
const upload = multer({
  storage: multer.memoryStorage(), 
  limits: { fileSize: 10000000 }, // Limit file size (e.g., 10MB)
  fileFilter: function (req, file, cb) {
    if (!req.user || !req.user.userId) {
        return cb(new Error("User not authenticated or user ID missing."));
    }
    checkFileType(file, cb);
  },
}).fields([
  { name: 'hinhAnhCCCDTruoc', maxCount: 1 },
  { name: 'hinhAnhCCCDSau', maxCount: 1 }
]);

// Middleware to encrypt the file buffer
const encryptFileMiddleware = (req, res, next) => {
  if (req.files) {
    // req.files is an object where keys are field names and values are arrays of files
    for (const fieldName in req.files) {
      req.files[fieldName].forEach(file => {
        const encrypted = encrypt(file.buffer);
        file.buffer = encrypted;
      });
    }
  }
  next();
};

function generateFilename(req, file) {
  if (!req.user || req.user.userId === "" || req.user.userId === undefined) {
    throw new Error("User ID is missing or empty. Cannot generate filename.");
  }

  const suffix = file.fieldname === "hinhAnhCCCDTruoc" ? "-1" : "-2";
  return `CCCD-${req.user.userId}${suffix}${path.extname(file.originalname)}`;
}

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

export { upload, encryptFileMiddleware, generateFilename };

