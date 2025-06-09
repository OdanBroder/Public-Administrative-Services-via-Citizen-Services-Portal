import BirthRegistration from '../models/BirthRegistration.js';
import User from '../models/User.js';
import FilePath from '../models/FilePath.js';
import path from 'path';
import fs from 'fs/promises';
import { MLDSAWrapper } from '../utils/MLDSAWrapper.js';
import ScalableTPMService from '../utils/crypto/ScalableTPMService.js';

// Get all birth registration applications awaiting signature
export const getPendingApplications = async (req, res) => {
  try {
    const applications = await BirthRegistration.findAll({
      where: {
        status: 'awaiting_signature'
      },
      include: [{
        model: User,
        as: 'applicant',
        attributes: ['id', 'username', 'email', 'first_name', 'last_name']
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
    const { applicationId } = req.params;

    const application = await BirthRegistration.findByPk(applicationId, {
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

// Approve a birth registration application
export const approveApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const bcaId = req.user.userId;

    const application = await BirthRegistration.findByPk(applicationId);
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

    // Verify all required files exist
    const requiredFiles = [
      bcaFilePath.private_key,
      bcaFilePath.certificate,
      application.file_path
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
    const bcaPrivateKey = ScalableTPMService.decryptWithRootKey(
      await fs.readFile(bcaFilePath.private_key, 'utf8')
    );
    const bcaCertificate = await fs.readFile(bcaFilePath.certificate, 'utf8');

    // Create signature directory if it doesn't exist
    const signatureDir = path.join(path.dirname(application.file_path), 'signatures');
    await fs.mkdir(signatureDir, { recursive: true });

    // Sign the application
    const signaturePath = path.join(signatureDir, 'bca_signature.sig');
    const signed = await MLDSAWrapper.signFile(
      bcaPrivateKey,
      application.file_path,
      signaturePath
    );

    if (!signed) {
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
    const { applicationId } = req.params;
    const { reason } = req.body;
    const bcaId = req.user.userId;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp lý do từ chối"
      });
    }

    const application = await BirthRegistration.findByPk(applicationId);
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