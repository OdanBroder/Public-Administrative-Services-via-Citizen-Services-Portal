import Citizen from '../models/Citizen.js';
import User from '../models/User.js';
import FilePath from '../models/FilePath.js';
import { MLDSAWrapper } from '../utils/crypto/MLDSAWrapper.js';
import { ScalableTPMService } from '../utils/crypto/MLDSAWrapper.js';

import path from 'path';
import fs from 'fs/promises';

export const createCitizen = async (req, res) => {
  try {
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

    // Basic validation
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
      return res.status(400).json({ 
        success: false,
        message: "Vui lòng điền đầy đủ thông tin" 
      });
    }

    const id = req.user.userId;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy người dùng" 
      });
    }

    // Check if citizen record already exists
    const existingCitizen = await Citizen.findOne({
      where: { id: req.user.userId }
    });

    if (existingCitizen) {
      return res.status(400).json({ 
        success: false,
        message: "Bạn đã đăng ký thông tin, vui lòng liên hệ cơ quan chức năng để cập nhật"
      });
    }

    // Create user directory if it doesn't exist
    const userDir = path.join(process.cwd(), 'working', 'user', id.toString());
    await fs.mkdir(userDir, { recursive: true });
    await fs.mkdir(path.join(userDir, 'csr'), { recursive: true });

    // Generate key pair and CSR using MLDSAWrapper
    const { privateKey, publicKey } = await MLDSAWrapper.generateKeyPair();
    const csrPath = path.join(userDir, 'csr', 'req.csr');

    const subjectInfo = {
      id: req.user.userId,
      hoVaTen,
      ngaySinh,
      gioiTinh,
      queQuan,
      noiThuongTru,
    };

    await MLDSAWrapper.generateCSR(privateKey, publicKey, subjectInfo, csrPath);

    // Save file paths to database
    const filePath = await FilePath.create({
      id: undefined,
      user_id: id,
      private_key: path.join(userDir, 'private.key'),
      public_key: path.join(userDir, 'public.key'),
      csr: csrPath,
      certificate: certPath
    });

    // Save private and public keys to files
    await fs.writeFile(filePath.private_key, ScalableTPMService.encryptWithRootKey(privateKey));
    await fs.writeFile(filePath.public_key, publicKey);

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

    user.completeProfile = true;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Đăng ký thông tin công dân thành công",
      citizen: newCitizen,
      frontImagePath: `/uploads/${req.files.hinhAnhCCCDTruoc[0].filename}`,
      backImagePath: `/uploads/${req.files.hinhAnhCCCDSau[0].filename}`
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi máy chủ", 
      error: error.message 
    });
  }
};

export const getCitizenById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (parseInt(userId) !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập thông tin công dân này"
      });
    }

    const citizen = await Citizen.findByPk(id);

    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin công dân"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin công dân thành công",
      data: citizen
    });
  } catch (error) {
    console.error("Error fetching citizen:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
}; 