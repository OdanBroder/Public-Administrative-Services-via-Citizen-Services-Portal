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
        id: req.user.userId, // UUID generated in multer config
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
      await User.update({
        completedProfile: true
      },
      {
        where:{
          id: id
        }
      });
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

export default router;