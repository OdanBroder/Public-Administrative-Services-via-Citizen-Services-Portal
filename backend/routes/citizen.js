import auth from '../middleware/auth.js';
import Citizen from '../models/Citizen.js';
import {upload} from '../config/multerConfig.js';
import express from 'express';
const router = express.Router();

router.post("/", auth, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ msg: "Error uploading file", error: err });
    }

    if (req.file == undefined) {
      return res.status(400).json({ msg: "Error: No File Selected!" });
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
    const id = req.user.id;
    try {
      const newCitizen = await Citizen.create({
        id,
        hoVaTen,
        soCCCD,
        hinhAnhCCCD: req.file.path, // Save the file path
        noiCapCCCD,
        ngayCapCCCD,
        ngaySinh,
        gioiTinh,
        queQuan,
        noiThuongTru,
      });
      res.status(201).json({
        msg: "Citizen record created successfully",
        citizen: newCitizen,
        filePath: `/uploads/${req.file.filename}` // Optionally return relative path for frontend use
      });
    } catch (error) {
      console.error("Database error:", error);
      // Consider deleting the uploaded file if DB insertion fails
      res.status(500).json({ msg: "Server error", error: error.message });
    }
  });
});

export default router;