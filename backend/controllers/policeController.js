import User from '../models/User.js';
import FilePath from '../models/FilePath.js';
import mldsa_wrapper from '../utils/crypto/MLDSAWrapper.js';
import path from 'path';
import fs from 'fs';
import tpmService from '../utils/crypto/tpmController.js';

export const getUnverifiedUsers = async (req, res) => {
  try {
    const unverifiedUsers = await User.findAll({
      where: {
        is_verified: false,
        complete_profile: true,
        role_id: 2 // Assuming role_id 2 is for citizens
      },
      attributes: ['id', 'username', 'email', 'first_name', 'last_name'],
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách người dùng chưa xác thực thành công",
      data: unverifiedUsers
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng chưa xác thực:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const getUnverifiedUsersbyId = async (req, res) => {
  const { userId } = req.params;
  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      message: "ID người dùng không hợp lệ"
    });
  }

  try {
    const unverifiedUsers = await User.findAll({
      where: {
        is_verified: false,
        complete_profile: true,
        id: userId,
        role_id: 2 // Assuming role_id 2 is for citizens
      },
      attributes: ['id', 'username', 'email', 'first_name', 'last_name'],
      include: [{
        model: FilePath,
        as: 'FilePath',
        attributes: ['csr', 'certificate'],
        required: true
      }]
    });

    // Read the CSR and public key files for each user
    const usersWithKeys = await Promise.all(unverifiedUsers.map(async (user) => {
      try {
        // Skip users who already have certificates
        if (user.FilePath.certificate) {
          return {
            ...user.toJSON(),
            csr_content: null,
            public_key_content: null,
            error: 'Người dùng đã có chứng chỉ'
          };
        }

        // Verify files exist before reading
        const filesExist = await Promise.all([
          fs.promises.access(user.FilePath.csr).then(() => true).catch(() => false)
        ]);

        if (filesExist.some(exists => !exists)) {
          throw new Error('Một hoặc nhiều file khóa không tồn tại');
        }

        const csrContent = await fs.promises.readFile(user.FilePath.csr, 'utf8');

        return {
          ...user.toJSON(),
          csr_content: csrContent
        };
      } catch (error) {
        console.error(`Lỗi đọc file cho người dùng ${user.id}:`, error);
        return {
          ...user.toJSON(),
          csr_content: null,
          public_key_content: null,
          error: error.message
        };
      }
    }));

    // Filter out users who already have certificates
    const pendingUsers = usersWithKeys.filter(user => !user.FilePath.certificate);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách người dùng chưa xác thực thành công",
      data: pendingUsers
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng chưa xác thực:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const submitCertificateRequest = async (req, res) => {
  try {
    const policeId = req.user.userId;
    const policeFilePath = await FilePath.findOne({
      where: { user_id: policeId }
    });
    if (policeFilePath.certificate) {
      return res.status(400).json({
        success: false,
        message: "Công an đã có chứng chỉ, không thể gửi yêu cầu"
      });
    }

    let csr = null;
    let certificate = null;
    // Check if CSR file is provided
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

    if (!csr) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp CSR (Certificate Signing Request)"
      });
    }

    // Check if Certificate file is provided
    if (req.files.csr && req.files.certificate[0]) {

      const certificateFile = req.files.certificate[0];
      // Convert buffer to UTF-8 string
      certificate = certificateFile.buffer.toString('utf8');

      // Validate certificate format
      if (!certificate.includes('-----BEGIN CERTIFICATE REQUEST-----') ||
        !certificate.includes('-----END CERTIFICATE REQUEST-----')) {
        return res.status(400).json({
          success: false,
          message: "Certificate format không hợp lệ. Vui lòng cung cấp file certificate đúng định dạng PEM."
        });
      }
    }

    if (!certificate) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp Certificate (Certificate Signing Request)"
      });
    }

    const certDir = path.join(process.cwd(), '/working', 'police', policeId.toString(), 'cert');

    // Create directory if it doesn't exist
    await fs.promises.mkdir(certDir, { recursive: true });

    // Define paths for police's CSR and certificate
    const csrPath = path.join(certDir, 'police_csr.pem');
    const certificatePath = path.join(certDir, 'police_certificate.pem');

    // Write CSR and certificate to files
    await fs.promises.writeFile(csrPath, csr);
    await fs.promises.writeFile(certificatePath, certificate);

    // Update police's file paths in the database
    await FilePath.upsert({
      user_id: policeId,
      csr: csrPath,
      certificate: certificatePath
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

export const signUserCertificate = async (req, res) => {
  try {
    const { userId } = req.params;
    const policeId = req.user.userId;

    // Find user and their file paths
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    // Get police's private key and certificate
    const policeFilePath = await FilePath.findOne({
      where: { user_id: policeId }
    });

    if (!policeFilePath) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin chứng chỉ của công an"
      });
    }

    // Get user's file paths
    const userFilePath = await FilePath.findOne({
      where: { user_id: userId }
    });

    if (!userFilePath) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin chứng chỉ của người dùng"
      });
    }

    if (!userFilePath.csr) {
      return res.status(400).json({
        success: false,
        message: "Người dùng chưa có CSR để ký chứng chỉ"
      });
    }

    // Check if user already has a certificate
    if (userFilePath.certificate) {
      return res.status(400).json({
        success: false,
        message: "Người dùng đã có chứng chỉ"
      });
    }

    const caCertpath = policeFilePath.certificate;
    // Read CA certificate
    const caCert = await fs.promises.readFile(caCertpath, 'utf8');
    
    let userCert = null;

    if (req.files.userCert && req.files.userCert[0]) {

      const userCertFile = req.files.caCert[0];
      // Convert buffer to UTF-8 string
      userCert = userCertFile.buffer.toString('utf8');

      // Validate CSR format
      if (!userCert.includes('-----BEGIN CERTIFICATE REQUEST-----') ||
        !userCert.includes('-----END CERTIFICATE REQUEST-----')) {
        return res.status(400).json({
          success: false,
          message: "Certificate format của người dân không hợp lệ. Vui lòng cung cấp file certificate đúng định dạng PEM."
        });
      }
    }

    if (!userCert) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp certificate của người dân"
      });
    }

    const signed = await mldsa_wrapper.verifyCertificateIssuedByCA(userCert, caCert);

    if (!signed) {
      throw new Error('Không thể ký chứng chỉ');
    }

    // Define paths for user's signed certificate
    const userCertPath = path.join(process.cwd(), '/working', 'user', userId, 'cert', 'user_cert.pem');
    // Create directory if it doesn't exist
    await fs.promises.mkdir(path.dirname(userCertPath), { recursive: true });
    // Write the signed certificate to file
    await fs.promises.writeFile(userCertPath, userCert);

    // Verify the signed certificate exists
    const certExists = await fs.promises.access(userCertPath).then(() => true).catch(() => false);
    if (!certExists) {
      throw new Error('Chứng chỉ không được tạo thành công');
    }

    // Update user's file path in database
    await userFilePath.update({
      certificate: userCertPath
    });

    // Update user verification status
    await user.update({
      is_verified: true
    });

    return res.status(200).json({
      success: true,
      message: "Ký chứng chỉ thành công",
      data: {
        userId: user.id,
        certificatePath: userCertPath
      }
    });
  } catch (error) {
    console.error("Lỗi khi ký chứng chỉ:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};