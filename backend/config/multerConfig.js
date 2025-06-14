import multer from 'multer';
import path from 'path';
import { encrypt } from './cryptoUtils.js';

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
  { name: 'hinhAnhCCCDSau', maxCount: 1 },
  { name: 'csr', maxCount: 1 }, // Add CSR field
  { name: 'certificate', maxCount: 1 }, // Add certificate field for self-signed certificates
  { name: 'caCert', maxCount: 1 }, // Add CA certificate field
  { name: 'userCert', maxCount: 1 }, // Add user certificate field
  { name: 'caCsr', maxCount: 1 }, // Add CA CSR field
  { name: 'signature', maxCount: 1 } // Add signature field for signed certificates
]);

// Middleware to encrypt the file buffer (but NOT for CSR files)
const encryptFileMiddleware = (req, res, next) => {
  if (req.files) {
    // req.files is an object where keys are field names and values are arrays of files
    for (const fieldName in req.files) {
      req.files[fieldName].forEach(file => {
        // Only encrypt image files, not certificate-related files
        if (!['csr', 'certificate', 'caCert', 'userCert', 'caCsr'].includes(fieldName)) {
          const encrypted = encrypt(file.buffer);
          file.buffer = encrypted;
        }
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

// Check file type - updated to handle CSR files
function checkFileType(file, cb) {
  // Allow CSR files
  if (file.fieldname === 'csr' || file.fieldname === 'caCsr') {
    const csrTypes = /csr|pem|txt/;
    const extname = csrTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'text/plain' || 
                     file.mimetype === 'application/x-pem-file' || 
                     file.mimetype === 'application/octet-stream';
    
    if (mimetype || extname || file.originalname.endsWith('.csr')) {
      return cb(null, true);
    } else {
      cb("Error: Invalid CSR file type!");
    }
  } 
  // Allow certificate files
  else if (['certificate', 'caCert', 'userCert'].includes(file.fieldname)) {
    // Accept common certificate mime types and extensions
    const certTypes = /pem|crt|cer|der/;
    const extname = certTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/x-x509-ca-cert' ||
                     file.mimetype === 'application/pkix-cert' ||
                     file.mimetype === 'application/x-pem-file' ||
                     file.mimetype === 'application/octet-stream' ||
                     file.mimetype === 'text/plain';
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb("Error: Invalid certificate file type!");
    }
  }
  else if (file.fieldname === 'signature') {
    const signatureTypes = /pem|txt/;
    const extname = signatureTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'text/plain' || 
                     file.mimetype === 'application/x-pem-file' || 
                     file.mimetype === 'application/octet-stream';
    if (mimetype || extname ) {
      return cb(null, true);
    }
    else {
      cb("Error: Invalid signature file type!");
    }
  }
  else {
    // Handle image files
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images Only!");
    }
  }
}

export { upload, encryptFileMiddleware, generateFilename };

