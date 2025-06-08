import {authenticate} from '../middleware/auth.js';
import Citizen from '../models/Citizen.js';
import {upload} from '../config/multerConfig.js';
import express from 'express';
const router = express.Router();
import User from '../models/User.js';


router.post("/", authenticate, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ msg: "Error uploading files", error: err });
    }

    // Check if both front and back images are provided
    if (!req.files || !req.files.hinhAnhCCCDTruoc || !req.files.hinhAnhCCCDSau) {
      return res.status(400).json({ 
        msg: "Error: Both front and back CCCD images are required!" 
      });
    }

    const {
      hoVaTen,
      soCCCD,
      noiCapCCCD,
      ngayCapCCCD,
      ngaySinh,
      gioiTinh,
      queQuan,
      noiThuongTru,
    } = req.body;

    // Basic validation (more robust validation can be added)
    if (
      !hoVaTen ||
      !soCCCD ||
      !noiCapCCCD ||
      !ngayCapCCCD ||
      !ngaySinh ||
      !gioiTinh ||
      !queQuan ||
      !noiThuongTru
    ) {
      // Consider deleting the uploaded file if validation fails
      return res.status(400).json({ msg: "Please fill in all fields" });
    }
    const id = req.user.userId;
    try {
      const newCitizen = await Citizen.create({
        id: req.user.userId, 
        hoVaTen,
        soCCCD,
        hinhAnhCCCDTruoc: req.files.hinhAnhCCCDTruoc[0].path,
        hinhAnhCCCDSau: req.files.hinhAnhCCCDSau[0].path,
        noiCapCCCD,
        ngayCapCCCD,
        ngaySinh,
        gioiTinh,
        queQuan,
        noiThuongTru,
      });
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }
      user.completeProfile = true; // Mark user profile as complete
      await user.save();

      res.status(201).json({
        msg: "Citizen record created successfully",
        citizen: newCitizen,
        frontImagePath: `/uploads/${req.files.hinhAnhCCCDTruoc[0].filename}`,
        backImagePath: `/uploads/${req.files.hinhAnhCCCDSau[0].filename}`
      });
    } catch (error) {
      console.error("Database error:", error);
      // Consider deleting the uploaded file if DB insertion fails
      res.status(500).json({ msg: "Server error", error: error.message });
    }
  });
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    console.log("User ID from token:", userId);
    console.log("Requested citizen ID:", id);
    if(parseInt(userId )!== parseInt(id)) {
      return res.status(403).json({ 
        success: false, 
        message: "You are not authorized to access this citizen's data" 
      });
    }
    // Find citizen by ID
    const citizen = await Citizen.findByPk(id);
    
    // Check if citizen exists
    if (!citizen) {
      return res.status(404).json({ 
        success: false, 
        message: "Citizen not found" 
      });
    }
    
    // Return citizen data
    return res.status(200).json({
      success: true,
      data: citizen
    });
  } catch (error) {
    console.error("Error fetching citizen:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
} )
// Controller to get citizen by ID



export default router;