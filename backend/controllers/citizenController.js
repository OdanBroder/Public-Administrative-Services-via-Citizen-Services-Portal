import Citizen from "../models/Citizen.js";
import User from "../models/User.js";
import FilePath from "../models/FilePath.js";
import  Mldsa_wrapper  from "../utils/crypto/MLDSAWrapper.js";
import tpmService from "../utils/crypto/tpmController.js";
import { generateFilename } from "../config/multerConfig.js";
import path from "path";
import fs from "fs";
import {encrypt, decrypt} from "../config/cryptoUtils.js";
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
      where: { id: req.user.userId },
    });

    if (existingCitizen) {
      return res.status(400).json({
        success: false,
        message:
          "Bạn đã đăng ký thông tin, vui lòng liên hệ cơ quan chức năng để cập nhật",
      });
    }

    // Create user directory if it doesn't exist

    const userDir = path.join(process.cwd(), 'working', 'user', id.toString());
    const certDir = path.join(userDir, 'cert');
    const applicationDir = path.join(userDir, 'application');

    try {
      // Create directories
      await fs.promises.mkdir(userDir, { recursive: true });
      await fs.promises.mkdir(certDir, { recursive: true });
      await fs.promises.mkdir(applicationDir, { recursive: true });

      // Generate key pair and CSR using MLDSAWrapper
      const { privateKey, publicKey } = await Mldsa_wrapper.generateKeyPair();
      const csrPath = path.join(certDir, 'req.csr');
      const privateKeyPath = path.join(certDir, 'private.key');
      const publicKeyPath = path.join(certDir, 'public.key');

      const subjectInfo = ["C=VN", `L=${noiThuongTru}`, `CN=${hoVaTen}`];

      // Generate CSR
      const csrGenerated = await Mldsa_wrapper.generateCSR(privateKey, publicKey, subjectInfo, csrPath);
      if (!csrGenerated) {
        throw new Error('Failed to generate CSR');
      }

      // Save file paths to database
      const filePath = await FilePath.create({
        user_id: id,
        private_key: privateKeyPath,
        public_key: publicKeyPath,
        csr: csrPath,
        certificate: null, // Will be updated when certificate is signed
        application: applicationDir // Set base application directory
      });

      // Save private and public keys to files
      await fs.promises.writeFile(
      privateKeyPath,
      await tpmService.encryptWithRootKey(privateKey)
    );
      await fs.promises.writeFile(publicKeyPath, publicKey);

      // Verify files were created successfully
      const filesExist = await Promise.all([
        fs.promises.access(privateKeyPath).then(() => true).catch(() => false),
        fs.promises.access(publicKeyPath).then(() => true).catch(() => false),
        fs.promises.access(csrPath).then(() => true).catch(() => false)
      ]);

      if (filesExist.some(exists => !exists)) {
        throw new Error('Failed to create one or more key files');
      }
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const hinhAnhCCCDTruocFile = req.files.hinhAnhCCCDTruoc[0];
    const hinhAnhCCCDSauFile = req.files.hinhAnhCCCDSau[0];

    const frontFilename = generateFilename(req, hinhAnhCCCDTruocFile);
    const backFilename = generateFilename(req, hinhAnhCCCDSauFile);

    const frontImagePath = path.join(uploadDir, frontFilename);
    const backImagePath = path.join(uploadDir, backFilename);

    // Save encrypted buffers to disk
    fs.writeFileSync(frontImagePath, hinhAnhCCCDTruocFile.buffer);
    fs.writeFileSync(backImagePath, hinhAnhCCCDSauFile.buffer);

      const newCitizen = await Citizen.create({
        id: req.user.userId,
        hoVaTen,
        soCCCD,
        hinhAnhCCCDTruoc: frontImagePath,
        hinhAnhCCCDSau: backImagePath,
        noiCapCCCD,
        ngayCapCCCD,
        ngaySinh,
        gioiTinh,
        queQuan,
        noiThuongTru,
      });

      if (!newCitizen) {
        throw new Error('Failed to create citizen record');
      }

      user.completeProfile = true;
      await user.save();

      res.status(201).json({
        success: true,
        message: "Đăng ký thông tin công dân thành công",
        citizen: newCitizen,
        frontImagePath: `/${frontImagePath}`,
        backImagePath: `/${backImagePath}`
      });
    } catch (error) {
      // Cleanup on failure
      try {
        await fs.promises.rm(userDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Error cleaning up user directory:', cleanupError);
      }

      // Delete any created database records
      try {
        await FilePath.destroy({ where: { user_id: id } });
        await Citizen.destroy({ where: { id: id } });
        if (user.completeProfile) {
          user.completeProfile = false;
          await user.save();
        }
      } catch (dbCleanupError) {
        console.error('Error cleaning up database records:', dbCleanupError);
      }

      console.error("Error creating citizen:", error);
      res.status(500).json({ 
        success: false,
        message: "Lỗi khi đăng ký thông tin công dân", 
        error: error.message 
      });
    }
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
        message: "Bạn không có quyền truy cập thông tin công dân này",
      });
    }

    const citizen = await Citizen.findByPk(id);

    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin công dân",
      });
    }
  
    // Decrypt images before sending
    let decryptedFrontImageBase64 = null;
    let decryptedBackImageBase64 = null;

    if (citizen.hinhAnhCCCDTruoc) {
      const encryptedFrontBuffer = fs.readFileSync(citizen.hinhAnhCCCDTruoc);
      const decryptedFrontBuffer = decrypt(encryptedFrontBuffer);
      decryptedFrontImageBase64 = decryptedFrontBuffer.toString('base64');
    }

    if (citizen.hinhAnhCCCDSau) {
      const encryptedBackBuffer = fs.readFileSync(citizen.hinhAnhCCCDSau);
      const decryptedBackBuffer = decrypt(citizen.hinhAnhCCCDSau);
      decryptedBackImageBase64 = decryptedBackBuffer.toString('base64');
    }
    
    return res.status(200).json({
      success: true,
      message: "Lấy thông tin công dân thành công",
      data: {
        ...citizen.toJSON(),
        hinhAnhCCCDTruocDecrypted: decryptedFrontImageBase64 ? `data:image/jpeg;base64,${decryptedFrontImageBase64}` : null, // Assuming JPEG, adjust as needed
        hinhAnhCCCDSauDecrypted: decryptedBackImageBase64 ? `data:image/jpeg;base64,${decryptedBackImageBase64}` : null, // Assuming JPEG, adjust as needed
      }
    });
  } catch (error) {
    console.error("Error fetching citizen:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
};
