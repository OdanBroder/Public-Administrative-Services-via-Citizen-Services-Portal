import User from '../models/User.js';
import FilePath from '../models/FilePath.js';
import { MLDSAWrapper } from '../utils/MLDSAWrapper.js';
import path from 'path';
import fs from 'fs/promises';

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
        attributes: ['csr', 'public_key'],
        required: true
      }]
    });

    // Read the CSR and public key files for each user
    const usersWithKeys = await Promise.all(unverifiedUsers.map(async (user) => {
      try {
        const csrContent = await fs.readFile(user.FilePath.csr, 'utf8');
        const publicKeyContent = await fs.readFile(user.FilePath.public_key, 'utf8');
        
        return {
          ...user.toJSON(),
          csr_content: csrContent,
          public_key_content: publicKeyContent
        };
      } catch (error) {
        console.error(`Error reading files for user ${user.id}:`, error);
        return {
          ...user.toJSON(),
          csr_content: null,
          public_key_content: null
        };
      }
    }));

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách người dùng chưa xác thực thành công",
      data: usersWithKeys
    });
  } catch (error) {
    console.error("Error fetching unverified users:", error);
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
    
    // Read police's private key and certificate
    const policePrivateKey = ScalableTPMService.decryptWithRootKey(
      await fs.readFile(policeFilePath.private_key, 'utf8')
    );
    const policeCertificate = await fs.readFile(policeFilePath.certificate, 'utf8');

    // Create certificate directory for user if it doesn't exist
    const userCertDir = path.join(process.cwd(), 'working', 'user', userId.toString(), 'cert');
    await fs.mkdir(userCertDir, { recursive: true });

    // Define paths for user's certificate
    const userCertPath = path.join(userCertDir, 'signed_cert.pem');

    // Sign the user's CSR using police's private key and certificate
    await MLDSAWrapper.signCertificate(
      policePrivateKey,  // Police's private key as CA key
      365,               // Certificate valid for 1 year
      userFilePath.csr,  // User's CSR path
      policeCertificate, // Police's certificate as CA cert
      userCertPath       // Path to save signed certificate
    );

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
    console.error("Error signing certificate:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
}; 