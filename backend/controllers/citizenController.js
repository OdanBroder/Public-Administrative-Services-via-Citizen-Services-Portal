import Citizen from "../models/Citizen.js";
import User from "../models/User.js";
import FilePath from "../models/FilePath.js";
import { generateFilename } from "../config/multerConfig.js";
import path from "path";
import fs from "fs";
import { decrypt } from "../config/cryptoUtils.js";
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
      noiThuongTru
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

    const hinhAnhCCCDTruocFile = req.files.hinhAnhCCCDTruoc[0];
    const hinhAnhCCCDSauFile = req.files.hinhAnhCCCDSau[0];

    if (!hinhAnhCCCDTruocFile || !hinhAnhCCCDSauFile) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng tải lên hình ảnh CCCD trước và sau"
      });
    }

    let csr = null;
    if (req.files.csr && req.files.csr[0]) {

      const csrFile = req.files.csr[0];
      // Convert buffer to UTF-8 string
      csr = csrFile.buffer.toString('utf8');

      // Validate CSR format
      if (!csr.includes('-----BEGIN CERTIFICATE REQUEST-----') ||
        !csr.includes('-----END CERTIFICATE REQUEST-----')) {
        return res.status(400).json({
          success: false,
          message: "CSR format không hợp lệ. Vui lòng cung cấp file CSR đúng định dạng PEM."
        });
      }
    }

    if (!hinhAnhCCCDTruocFile || !hinhAnhCCCDSauFile) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng tải lên hình ảnh CCCD trước và sau"
      });
    }

    if (!csr) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp CSR (Certificate Signing Request)"
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
        message: "Ban đã đăng ký thông tin công dân, không thể đăng ký lại, vui lòng liên hệ cơ quan chức năng để cập nhật thông tin"
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

      const csrPath = path.join(certDir, 'user_csr.csr');
      // Write CSR to file
      await fs.promises.writeFile(csrPath, csr);

      // Save file paths to database
      const filePath = await FilePath.create({
        user_id: id,
        csr: csrPath,
        certificate: null, // Will be updated when certificate is signed
        application: applicationDir // Set base application directory
      });

      if (!filePath) {
        throw new Error('Failed to create file path record');
      }

      // Verify files were created successfully
      const filesExist = await Promise.all([
        fs.promises.access(csrPath).then(() => true).catch(() => false)
      ]);

      if (filesExist.some(exists => !exists)) {
        throw new Error('Failed to create one or more key files');
      }
      const uploadDir = `uploads/${id}`;
      if (!fs.existsSync(uploadDir)) {
        await fs.promises.mkdir(uploadDir);
      }

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
      return res.status(200).json({
        success: true,
        message: "Không tìm thấy thông tin công dân",
      });
    }

    // Decrypt images before sending
    let decryptedFrontImageBase64 = null;
    let decryptedBackImageBase64 = null;

    if (citizen.hinhAnhCCCDTruoc) {
      const encryptedFrontBuffer = fs.readFileSync(citizen.hinhAnhCCCDTruoc);
      const decryptedFrontBuffer = decrypt(encryptedFrontBuffer.toString());
      decryptedFrontImageBase64 = decryptedFrontBuffer.toString('base64');
    }

    if (citizen.hinhAnhCCCDSau) {
      const encryptedBackBuffer = fs.readFileSync(citizen.hinhAnhCCCDSau);
      const decryptedBackBuffer = decrypt(encryptedBackBuffer.toString());
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
