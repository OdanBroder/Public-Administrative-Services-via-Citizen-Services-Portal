import BirthRegistration from '../models/BirthRegistration.js';
import User from '../models/User.js';
import FilePath from '../models/FilePath.js';
import path from 'path';
import fs from 'fs';
import Mldsa_wrapper from '../utils/crypto/MLDSAWrapper.js';
import tpmController from '../utils/crypto/tpmController.js';
import Sigs from '../models/Sigs.js';
import { sign } from 'crypto';

const convertPEMToDER = (pemKey) => {
  // Remove the PEM headers and footers
  const base64Key = pemKey
    .replace(/-----BEGIN [^-]+-----/, "") // Remove the BEGIN header
    .replace(/-----END [^-]+-----/, "")   // Remove the END footer
    .replace(/\n/g, "");                  // Remove newlines

  // Decode the Base64 content
  const binaryString = atob(base64Key);

  // Convert the binary string to a Uint8Array
  const derData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    derData[i] = binaryString.charCodeAt(i);
  }

  return derData;
};
// Get a specific signature birth registration application
export const getSignatureById = async (req, res) => {
  try {
    const { birthRegistrationId } = req.params;

    const application = await BirthRegistration.findByPk(birthRegistrationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đăng ký khai sinh"
      });
    }

    // Get signature from the file path
    const filePath = application.file_path;
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: "Đơn đăng ký khai sinh không có đường dẫn đến chứng chỉ"
      });
    }
    const signaturePath = path.join(filePath, 'sig', 'signature.txt');
    const signatureExists = await fs.promises.access(signaturePath)
      .then(() => true)
      .catch(() => false);
    if (!signatureExists) {
      return res.status(400).json({
        success: false,
        message: "Đơn đăng ký khai sinh chưa được ký"
      });
    }
    // Read the signature file
    const signature = await fs.promises.readFile(signaturePath, 'utf8');

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin signature của đơn đăng ký khai sinh thành công",
      data: signature
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

// Self signed certificate request
export const submitCertificateRequest = async (req, res) => {
  if (!req.files || !req.files.bcaCsr || !req.files.bcaCert) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng cung cấp cả CSR và Certificate"
    });
  }

  try {
    const bcaId = req.user.userId;
    const bcaFilePath = await FilePath.findOne({
      where: { user_id: bcaId }
    });
    if (bcaFilePath && bcaFilePath.certificate) {
      return res.status(400).json({
        success: false,
        message: "BCA đã có chứng chỉ, không thể gửi yêu cầu"
      });
    }

    let bcaCsr = null;
    let bcaCert = null;
    // Check if CSR file is provided
    if (req.files.bcaCsr && req.files.bcaCsr[0]) {

      const csrFile = req.files.bcaCsr[0];
      // Convert buffer to UTF-8 string
      bcaCsr = csrFile.buffer.toString('utf8');

      // Validate CSR format
      if (!bcaCsr.includes('-----BEGIN CERTIFICATE REQUEST-----') ||
        !bcaCsr.includes('-----END CERTIFICATE REQUEST-----')) {
        return res.status(400).json({
          success: false,
          message: "CSR format không hợp lệ. Vui lòng cung cấp file CSR đúng định dạng PEM."
        });
      }
    }

    if (!bcaCsr) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp CSR (Certificate Signing Request)"
      });
    }

    // Check if Certificate file is provided
    if (req.files.bcaCert && req.files.bcaCert[0]) {

      const certificateFile = req.files.bcaCert[0];
      // Convert buffer to UTF-8 string
      bcaCert = certificateFile.buffer.toString('utf8');

      // Validate certificate format
      if (!bcaCert.includes('-----BEGIN CERTIFICATE-----') ||
        !bcaCert.includes('-----END CERTIFICATE-----')) {
        return res.status(400).json({
          success: false,
          message: "Certificate format không hợp lệ. Vui lòng cung cấp file certificate đúng định dạng PEM."
        });
      }
    }

    if (!bcaCert) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp Certificate (Certificate Signing Request)"
      });
    }

    const certDir = path.join(process.cwd(), '/working', 'bca', bcaId.toString(), 'cert');

    // Create directory if it doesn't exist
    console.log(`Creating directory for BCA certificate: ${certDir}`);
    await fs.promises.mkdir(certDir, { recursive: true });

    // Define paths for bca's CSR and certificate
    const csrPath = path.join(certDir, 'bca_csr.pem');
    const certificatePath = path.join(certDir, 'bca_certificate.pem');

    // Write CSR and certificate to files
    await fs.promises.writeFile(csrPath, bcaCsr);
    await fs.promises.writeFile(certificatePath, bcaCert);
    console.log("CSR and certificate files created successfully");
    // Update bca's file paths in the database
    await FilePath.upsert({
      user_id: bcaId,
      csr: csrPath,
      certificate: certificatePath
    });

    return res.status(200).json({
      success: true,
      message: "Yêu cầu chứng chỉ đã được gửi thành công",
    });

  } catch (error) {
    console.error("Lỗi khi gửi yêu cầu chứng chỉ:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
}

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

// Approve a birth registration application
export const approveApplication = async (req, res) => {
  try {
    const { birthRegistrationId,} = req.params;
    const{ message }= req.body;
    const bcaMessage = message; 
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
    // console.log(req.files);
    let bcaSignMessage = null;
    // Read BCA sign message
    if (req.files && req.files.bcaSignMessage && req.files.bcaSignMessage[0]) {
      const bcaSignMessageFile = req.files.bcaSignMessage[0];
      // bcaMessage = req.files.message[0].buffer.toString('utf8');
      // Convert buffer to UTF-8 string
      bcaSignMessage = bcaSignMessageFile.buffer.toString('utf8');

      // Validate BCA sign message format
      if (!bcaSignMessage.includes('-----BEGIN SIGNATURE-----') ||
        !bcaSignMessage.includes('-----END SIGNATURE-----')) {
        return res.status(400).json({
          success: false,
          message: "BCA sign message format không hợp lệ. Vui lòng cung cấp file BCA sign message đúng định dạng PEM."
        });
      }
    }
    if (!bcaSignMessage) {
      return res.status(400).json({
        success: false,
        message: "BCA sign message không hợp lệ, không thể phê duyệt đơn đăng ký"
      });
    }

    const filePath = await FilePath.findOne({
      where: { user_id: bcaId }
    });
    if (!filePath || !filePath.certificate) {
      return res.status(400).json({
        success: false,
        message: "BCA chưa có chứng chỉ, không thể phê duyệt đơn đăng ký"
      });
    }

    const certificatePath = filePath.certificate;
    // read the certificate file
    const certificateContent = await fs.promises.readFile(certificatePath, 'utf8');
    // console.log(bcaSignMessage);
    const signatureContent = convertPEMToDER(bcaSignMessage);
    const is_verified = await Mldsa_wrapper.verifyWithCertificate(certificateContent, signatureContent, bcaMessage);
    
    if (!is_verified) {
      return res.status(400).json({
        success: false,
        message: "Chữ ký BCA không hợp lệ, không thể phê duyệt đơn đăng ký"
      });
    }
    console.log(application.applicant_id);
    const applicationFiles = await FilePath.findOne({
      where: { user_id: application.applicant_id }
    });
    // Create signature directory if it doesn't exist
    const applicationPath = applicationFiles.application;
    const signatureDir = path.join(applicationPath, 'sig');
    await fs.promises.mkdir(signatureDir, { recursive: true });

    const signaturePath = path.join(signatureDir, 'issuer_signature.sig');
    const signatureToSave = JSON.stringify({
      message: bcaMessage,
      signature: Buffer.from(signatureContent).toString('base64')
    });
    await fs.promises.writeFile(signaturePath, signatureToSave, 'utf8');

    await Sigs.create({
      UUID: crypto.randomUUID(),
      birth_registration_id: application.id,
      type: 'issuer',
      path: signaturePath
    })
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