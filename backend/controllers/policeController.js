import User from '../models/User.js';
import FilePath from '../models/FilePath.js';
import  mldsa_wrapper from '../utils/crypto/MLDSAWrapper.js';
import path from 'path';
import fs from 'fs/promises';
import tpmService from '../utils/crypto/tpmController.js';

export const getUnverifiedUsers = async (req, res) => {
  try {
    const unverifiedUsers = await User.findAll({
      where: {
        is_verified: false,
        complete_profile: true
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
          fs.access(user.FilePath.csr).then(() => true).catch(() => false)
        ]);

        if (filesExist.some(exists => !exists)) {
          throw new Error('Một hoặc nhiều file khóa không tồn tại');
        }

        const csrContent = await fs.readFile(user.FilePath.csr, 'utf8');
        
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

    // Check if user already has a certificate
    if (userFilePath.certificate) {
      return res.status(400).json({
        success: false,
        message: "Người dùng đã có chứng chỉ"
      });
    }

    // Verify all required files exist
    const requiredFiles = [
      policeFilePath.private_key,
      policeFilePath.certificate,
      userFilePath.csr
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
    
    // Read police's private key and certificate
    const policePrivateKey = await tpmService.decryptWithRootKey(
      await fs.readFile(policeFilePath.private_key, 'utf8')
    );

    // Get user's cert directory from FilePath
    const userCertDir = path.dirname(userFilePath.private_key);
    await fs.mkdir(userCertDir, { recursive: true });

    // Define paths for user's certificate
    const userCertPath = path.join(userCertDir, 'signed_cert.pem');

    // Sign the user's CSR using police's private key and certificate
    const signed = await mldsa_wrapper.signCertificate(
      policePrivateKey,  // Police's private key as CA key
      365,               // Certificate valid for 1 year
      userFilePath.csr,  // User's CSR path
      policeFilePath.certificate, // Police's certificate as CA cert
      userCertPath       // Path to save signed certificate
    );

    if (!signed) {
      throw new Error('Không thể ký chứng chỉ');
    }

    // Verify the signed certificate exists
    const certExists = await fs.access(userCertPath).then(() => true).catch(() => false);
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