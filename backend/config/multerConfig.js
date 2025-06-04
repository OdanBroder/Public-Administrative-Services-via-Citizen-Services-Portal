import multer from 'multer';
import path from 'path';
// import { v4: uuidv4 } from "uuid";
// 
// Set storage engine
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    // Generate UUID if not already in request
    if (req.user.userId === "" || req.user.userId === undefined) {
      throw new Error("Empty id");
    }
    
    // Determine if this is front or back image based on field name
    const suffix = file.fieldname === "hinhAnhCCCDTruoc" ? "-1" : "-2";
    
    // Create filename with UUID and suffix
    const filename = `CCCD-${req.user.userId}${suffix}${path.extname(file.originalname)}`;
    
    cb(null, filename);
  },
});

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // Limit file size (e.g., 10MB)
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).fields([
  { name: 'hinhAnhCCCDTruoc', maxCount: 1 },
  { name: 'hinhAnhCCCDSau', maxCount: 1 }
]);

// Check file type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

export {upload};