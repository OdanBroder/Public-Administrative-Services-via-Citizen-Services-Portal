import BirthRegistration from '../models/BirthRegistration.js';
import { Op } from 'sequelize';
import User from '../models/User.js';
import FilePath from '../models/FilePath.js';
import path from 'path';
import fs from 'fs/promises';
import Mldsa_wrapper from '../utils/crypto/MLDSAWrapper.js';
import tpmController from '../utils/crypto/tpmController.js';

// Get all birth registration applications awaiting signature
export const getPendingApplications = async (req, res) => {
  try {
    const applications = await BirthRegistration.findAll({
      attributes: ['id', 'registrantName', 'registrantDob', 'status'],
      include: [{
        model: User,
        as: 'applicant',
        attributes: ['username']
      }],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách đơn đăng ký khai sinh thành công",
      data: applications
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn đăng ký khai sinh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Get a specific birth registration application
export const getApplicationById = async (req, res) => {
  try {
    const { birthRegistrationId } = req.params;

    const application = await BirthRegistration.findByPk(birthRegistrationId, {
      include: [{
        model: User,
        as: 'applicant',
        attributes: ['id', 'username', 'email', 'first_name', 'last_name']
      }]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đăng ký khai sinh"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin đơn đăng ký khai sinh thành công",
      data: application
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn đăng ký khai sinh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Verify a birth registration application
export const verifyApplication = async (req, res) => {
  try {
    const { birthRegistrationId } = req.params;
    const bcaId = req.user.userId;

    const application = await BirthRegistration.findByPk(birthRegistrationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đăng ký khai sinh"
      });
    }

    if (application.status !== 'awaiting_signature') {
      return res.status(400).json({
        success: false,
        message: "Đơn đăng ký không ở trạng thái chờ ký"
      });
    }

    // Update application status to verified
    await application.update({
      status: 'verified',
      processed_by: bcaId,
      processed_at: new Date()
    });

    return res.status(200).json({
      success: true,
      message: "Xác minh đơn đăng ký khai sinh thành công",
      data: {
        applicationId: application.id
      }
    });
  } catch (error) {
    console.error("Lỗi khi xác minh đơn đăng ký khai sinh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
}

// Approve a birth registration application
export const approveApplication = async (req, res) => {
  try {
    const { birthRegistrationId } = req.params;
    const bcaId = req.user.userId;

    const application = await BirthRegistration.findByPk(birthRegistrationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đăng ký khai sinh"
      });
    }

    if (application.status !== 'awaiting_signature') {
      return res.status(400).json({
        success: false,
        message: "Đơn đăng ký không ở trạng thái chờ ký"
      });
    }

    // Get BCA's private key and certificate
    const bcaFilePath = await FilePath.findOne({
      where: { user_id: bcaId }
    });

    if (!bcaFilePath) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin chứng chỉ của Bộ Công An"
      });
    }

    // Construct application file path
    const applicationPath =  application.file_path 
    // Verify all required files exist
    const requiredFiles = [
      bcaFilePath.private_key,
      bcaFilePath.certificate,
      applicationPath
    ];

    const filesExist = await Promise.all(
      requiredFiles.map(file => fs.access(file).then(() => true).catch(() => false))
    );

    if (filesExist.some(exists => !exists)) {
      return res.status(400).json({
        success: false,
        message: "Một hoặc nhiều file cần thiết không tồn tại"
      });
    }

    // Read BCA's private key and certificate
    const bcaPrivateKey = await tpmController.decryptWithRootKey(
      await fs.readFile(bcaFilePath.private_key, 'utf8')
    );

    // Create signature directory if it doesn't exist
    const signatureDir = path.join(applicationPath, 'sig');
    await fs.mkdir(signatureDir, { recursive: true });

    const sigFile = path.join(applicationPath, 'sig', 'signature.bin');   // signature that backend sign in application
    const sigData = await fs.readFile(sigFile, 'utf8');
    const message = {
      signature: sigData,
      time: Date.now()
    };
    const messagePath = path.join(applicationPath, "message", "issuer_message.txt");
    // Sign the application
    const signaturePath = path.join(signatureDir, 'issuer_signature.sig');
    const signed = await Mldsa_wrapper.sign(
      bcaPrivateKey,
      JSON.stringify(message),
      signaturePath
    );message
    await fs.writeFile(messagePath, JSON.stringify(message));
    

    if (!signed ) {
      throw new Error('Không thể ký đơn đăng ký');
    }

    // Update application status
    await application.update({
      status: 'approved',
      processed_by: bcaId,
      processed_at: new Date()
    });

    return res.status(200).json({
      success: true,
      message: "Phê duyệt đơn đăng ký khai sinh thành công",
      data: {
        applicationId: application.id,
        signaturePath: signaturePath
      }
    });
  } catch (error) {
    console.error("Lỗi khi phê duyệt đơn đăng ký khai sinh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Reject a birth registration application
export const rejectApplication = async (req, res) => {
  try {
    const { birthRegistrationId } = req.params;
    const { reason } = req.body;
    const bcaId = req.user.userId;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp lý do từ chối"
      });
    }

    const application = await BirthRegistration.findByPk(birthRegistrationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đăng ký khai sinh"
      });
    }

    if (application.status !== 'awaiting_signature') {
      return res.status(400).json({
        success: false,
        message: "Đơn đăng ký không ở trạng thái chờ ký"
      });
    }

    // Update application status
    await application.update({
      status: 'rejected',
      processed_by: bcaId,
      processed_at: new Date(),
      rejection_reason: reason
    });

    return res.status(200).json({
      success: true,
      message: "Từ chối đơn đăng ký khai sinh thành công",
      data: {
        applicationId: application.id,
        rejectionReason: reason
      }
    });
  } catch (error) {
    console.error("Lỗi khi từ chối đơn đăng ký khai sinh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
}; 