import MedicalCoverage from '../models/MedicalCoverage.js';
import ServiceHealth from '../models/ServiceHealth.js';
import User from '../models/User.js';
import FilePath from '../models/FilePath.js';
import path from 'path';
import fs from 'fs/promises';
import { MLDSAWrapper } from '../utils/MLDSAWrapper.js';
import ScalableTPMService from '../utils/crypto/ScalableTPMService.js';

// Get all medical coverage applications awaiting signature
export const getPendingMedicalCoverage = async (req, res) => {
  try {
    const applications = await MedicalCoverage.findAll({
      where: {
        status: 'awaiting_signature'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'first_name', 'last_name']
      }],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách đơn bảo hiểm y tế thành công",
      data: applications
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn bảo hiểm y tế:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Get all service health applications awaiting signature
export const getPendingServiceHealth = async (req, res) => {
  try {
    const applications = await ServiceHealth.findAll({
      where: {
        status: 'awaiting_signature'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'first_name', 'last_name']
      }],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách đơn kiểm tra sức khỏe thành công",
      data: applications
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn kiểm tra sức khỏe:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Get a specific medical coverage application
export const getMedicalCoverageById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await MedicalCoverage.findByPk(applicationId, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'first_name', 'last_name']
      }]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn bảo hiểm y tế"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin đơn bảo hiểm y tế thành công",
      data: application
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn bảo hiểm y tế:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Get a specific service health application
export const getServiceHealthById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await ServiceHealth.findByPk(applicationId, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'first_name', 'last_name']
      }]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn kiểm tra sức khỏe"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin đơn kiểm tra sức khỏe thành công",
      data: application
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn kiểm tra sức khỏe:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Approve a medical coverage application
export const approveMedicalCoverage = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const sytId = req.user.userId;

    const application = await MedicalCoverage.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn bảo hiểm y tế"
      });
    }

    if (application.status !== 'awaiting_signature') {
      return res.status(400).json({
        success: false,
        message: "Đơn bảo hiểm y tế không ở trạng thái chờ ký"
      });
    }

    // Get SYT's private key and certificate
    const sytFilePath = await FilePath.findOne({
      where: { user_id: sytId }
    });

    if (!sytFilePath) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin chứng chỉ của Sở Y tế"
      });
    }

    // Verify all required files exist
    const requiredFiles = [
      sytFilePath.private_key,
      sytFilePath.certificate,
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

    // Read SYT's private key and certificate
    const sytPrivateKey = ScalableTPMService.decryptWithRootKey(
      await fs.readFile(sytFilePath.private_key, 'utf8')
    );
    const sytCertificate = await fs.readFile(sytFilePath.certificate, 'utf8');

    // Create signature directory if it doesn't exist
    const signatureDir = path.join(path.dirname(application.file_path), 'signatures');
    await fs.mkdir(signatureDir, { recursive: true });

    // Sign the application
    const signaturePath = path.join(signatureDir, 'syt_signature.sig');
    const signed = await MLDSAWrapper.signFile(
      sytPrivateKey,
      application.file_path,
      signaturePath
    );

    if (!signed) {
      throw new Error('Không thể ký đơn bảo hiểm y tế');
    }

    // Update application status
    await application.update({
      status: 'approved',
      processed_by: sytId,
      processed_at: new Date()
    });

    return res.status(200).json({
      success: true,
      message: "Phê duyệt đơn bảo hiểm y tế thành công",
      data: {
        applicationId: application.id,
        signaturePath: signaturePath
      }
    });
  } catch (error) {
    console.error("Lỗi khi phê duyệt đơn bảo hiểm y tế:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Approve a service health application
export const approveServiceHealth = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const sytId = req.user.userId;

    const application = await ServiceHealth.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn kiểm tra sức khỏe"
      });
    }

    if (application.status !== 'awaiting_signature') {
      return res.status(400).json({
        success: false,
        message: "Đơn kiểm tra sức khỏe không ở trạng thái chờ ký"
      });
    }

    // Get SYT's private key and certificate
    const sytFilePath = await FilePath.findOne({
      where: { user_id: sytId }
    });

    if (!sytFilePath) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin chứng chỉ của Sở Y tế"
      });
    }

    // Verify all required files exist
    const requiredFiles = [
      sytFilePath.private_key,
      sytFilePath.certificate,
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

    // Read SYT's private key and certificate
    const sytPrivateKey = ScalableTPMService.decryptWithRootKey(
      await fs.readFile(sytFilePath.private_key, 'utf8')
    );
    const sytCertificate = await fs.readFile(sytFilePath.certificate, 'utf8');

    // Create signature directory if it doesn't exist
    const signatureDir = path.join(path.dirname(application.file_path), 'signatures');
    await fs.mkdir(signatureDir, { recursive: true });

    // Sign the application
    const signaturePath = path.join(signatureDir, 'syt_signature.sig');
    const signed = await MLDSAWrapper.signFile(
      sytPrivateKey,
      application.file_path,
      signaturePath
    );

    if (!signed) {
      throw new Error('Không thể ký đơn kiểm tra sức khỏe');
    }

    // Update application status
    await application.update({
      status: 'approved',
      processed_by: sytId,
      processed_at: new Date()
    });

    return res.status(200).json({
      success: true,
      message: "Phê duyệt đơn kiểm tra sức khỏe thành công",
      data: {
        applicationId: application.id,
        signaturePath: signaturePath
      }
    });
  } catch (error) {
    console.error("Lỗi khi phê duyệt đơn kiểm tra sức khỏe:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Reject a medical coverage application
export const rejectMedicalCoverage = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { reason } = req.body;
    const sytId = req.user.userId;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp lý do từ chối"
      });
    }

    const application = await MedicalCoverage.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn bảo hiểm y tế"
      });
    }

    if (application.status !== 'awaiting_signature') {
      return res.status(400).json({
        success: false,
        message: "Đơn bảo hiểm y tế không ở trạng thái chờ ký"
      });
    }

    // Update application status
    await application.update({
      status: 'rejected',
      processed_by: sytId,
      processed_at: new Date(),
      rejection_reason: reason
    });

    return res.status(200).json({
      success: true,
      message: "Từ chối đơn bảo hiểm y tế thành công",
      data: {
        applicationId: application.id,
        rejectionReason: reason
      }
    });
  } catch (error) {
    console.error("Lỗi khi từ chối đơn bảo hiểm y tế:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Reject a service health application
export const rejectServiceHealth = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { reason } = req.body;
    const sytId = req.user.userId;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp lý do từ chối"
      });
    }

    const application = await ServiceHealth.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn kiểm tra sức khỏe"
      });
    }

    if (application.status !== 'awaiting_signature') {
      return res.status(400).json({
        success: false,
        message: "Đơn kiểm tra sức khỏe không ở trạng thái chờ ký"
      });
    }

    // Update application status
    await application.update({
      status: 'rejected',
      processed_by: sytId,
      processed_at: new Date(),
      rejection_reason: reason
    });

    return res.status(200).json({
      success: true,
      message: "Từ chối đơn kiểm tra sức khỏe thành công",
      data: {
        applicationId: application.id,
        rejectionReason: reason
      }
    });
  } catch (error) {
    console.error("Lỗi khi từ chối đơn kiểm tra sức khỏe:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
}; 