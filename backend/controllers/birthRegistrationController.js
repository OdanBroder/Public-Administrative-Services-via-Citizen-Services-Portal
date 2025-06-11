import BirthRegistration from '../models/BirthRegistration.js';
import crypto from 'crypto';
import tpmService from '../utils/crypto/tpmController.js';
import path from 'path';
import Mldsa_wrapper from '../utils/crypto/MLDSAWrapper.js';
import FilePath from '../models/FilePath.js';
import fs from 'fs'
// Controller to create a new birth registration
export const createBirthRegistration = async (req, res) => {
  try {
    const {
      // Applicant Information
      applicantId,
      applicantName,
      applicantDob,
      applicantPhone,
      applicantCccd,
      applicantCccdIssueDate,
      applicantCccdIssuePlace,
      applicantAddress,

      // Birth Registrant Information
      registrantName,
      registrantGender,
      registrantEthnicity,
      registrantNationality,
      registrantDob,
      registrantDobInWords,
      registrantBirthPlace,
      registrantProvince,
      registrantHometown,

      // Father Information
      fatherName,
      fatherDob,
      fatherEthnicity,
      fatherNationality,
      fatherResidenceType,
      fatherAddress,

      // Mother Information
      motherName,
      motherDob,
      motherEthnicity,
      motherNationality,
      motherResidenceType,
      motherAddress
    } = req.body;

    // Validation
    if (!applicantName || !applicantDob || !applicantPhone || !applicantCccd ||
      !applicantCccdIssueDate || !applicantCccdIssuePlace || !applicantAddress) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin người nộp"
      });
    }

    if (!registrantName || !registrantGender || !registrantEthnicity || !registrantNationality ||
      !registrantDob || !registrantDobInWords || !registrantBirthPlace ||
      !registrantProvince || !registrantHometown) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin người được khai sinh"
      });
    }

    if (!fatherName || !fatherDob || !fatherEthnicity || !fatherNationality ||
      !fatherResidenceType || !fatherAddress) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin cha",
        error: "Vui lòng điền đầy đủ thông tin cha"
      });
    }

    if (!motherName || !motherDob || !motherEthnicity || !motherNationality ||
      !motherResidenceType || !motherAddress) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin mẹ",
        error: "Vui lòng điền đầy đủ thông tin mẹ"
      });
    }

    const birthApplicationData = {
      applicantId,
      applicantName,
      applicantDob,
      applicantPhone,
      applicantCccd,
      applicantCccdIssueDate,
      applicantCccdIssuePlace,
      applicantAddress,

      registrantName,
      registrantGender,
      registrantEthnicity,
      registrantNationality,
      registrantDob,
      registrantDobInWords,
      registrantBirthPlace,
      registrantProvince,
      registrantHometown,

      fatherName,
      fatherDob,
      fatherEthnicity,
      fatherNationality,
      fatherResidenceType,
      fatherAddress,

      motherName,
      motherDob,
      motherEthnicity,
      motherNationality,
      motherResidenceType,
      motherAddress,

      status: "pending"
    };

    // Create new birth registration 
    const birthApplication_new = await BirthRegistration.create(birthApplicationData);

    delete birthApplicationData.status; // Remove status from the data to be signed

    const message_tmp = JSON.stringify(birthApplicationData);

    const userFilePath = await FilePath.findOne({
      where: { user_id: req.user.id }
    });

    if (!userFilePath || !userFilePath.private_key) {
      throw new Error('Không tìm thấy private key của người dùng. Vui lòng tạo key pair trước.');
    }

    // Create message and sign by private key
    const message = crypto.createHash('sha512').update(message_tmp).digest('hex');

    // Decrypt private key
    const privateKeyContent = await tpmService.decryptWithRootKey(
      await fs.promises.readFile(userFilePath.private_key, 'utf8')
    );

    // Get base application directory from FilePath
    const applicationDir = path.join(userFilePath.application, 'birthRegistrations', birthApplication_new.id.toString());
    const sigDir = path.join(applicationDir, 'sig');
    const messageDir = path.join(applicationDir, 'message');

    try {
      // Create directories
      await fs.promises.mkdir(sigDir, { recursive: true });
      await fs.promises.mkdir(messageDir, { recursive: true });

      // Define file paths
      const sigPath = path.join(sigDir, 'signature.bin');
      const messagePath = path.join(messageDir, 'message.txt');

      // Sign the message
      const signature = await Mldsa_wrapper.sign(
        privateKeyContent,
        message,
        sigPath
      );

      if (!signature) {
        throw new Error('Failed to create signature');
      } 


      // Save message and metadata
      await fs.promises.writeFile(messagePath, message);
      const msg_load = await fs.promises.readFile(messagePath);
      console.log("Message:", msg_load.toString());
      console.log("Certificate Path:", userFilePath.certificate);
      console.log("Signature Path:", sigPath);
      const verified = await Mldsa_wrapper.verifyWithCertificate(msg_load, userFilePath.certificate, sigPath);
      if (!verified) {
        throw new Error('Signature verification failed');
      }
      // Update the birth registration with file paths
      await birthApplication_new.update({
        file_path: applicationDir
      });
    }
    catch (error) {
      console.error("Signing failed: ", error);

    }
    res.status(201).json({
      success: true,
      message: "Đăng ký khai sinh thành công",
      data: birthApplication_new
    });
  } catch (error) {
    console.error("Error creating birth registration:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const verifyBirthRegistration = async (req, res) => {
  try {
    const { birthRegistrationId } = req.params;

    const birthRegistration = await BirthRegistration.findByPk(birthRegistrationId, {
      attributes: ['id', 'applicant_id', 'file_path', 'status'],
    });

    if (!birthRegistration) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đăng ký khai sinh"
      });
    }
    if (birthRegistration.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Đơn đăng ký không ở trạng thái chờ duyệt"
      });
    }

    if (!birthRegistration.file_path) {
      return res.status(400).json({
        success: false,
        message: "File path is invalid or undefined."
      });
    }

    const userPath = await FilePath.findOne({
      where: { user_id: birthRegistration.applicant_id },
      attributes: ['certificate'] // Only select the application (file_path) column
    });

    if (!userPath) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đường dẫn tệp cho người nộp đơn"
      });
    }

    if (!userPath.certificate) {
      return res.status(400).json({
        success: false,
        message: "Certificate not found for the user."
      });
    }


    // Define file paths
    const sigPath = path.join(birthRegistration.file_path, 'sig', 'signature.bin');
    const messagePath = path.join(birthRegistration.file_path, 'message', 'message.txt');

    // Read signature and message
    const signature = await fs.promises.readFile(sigPath, 'utf8');
    const message = await fs.promises.readFile(messagePath);

    console.log("Message:", message.toString());
    console.log("Certificate Path:", userPath.certificate);
    console.log("Signature Path:", sigPath);
    // Verify the signature
    const is_verified = await Mldsa_wrapper.verifyWithCertificate(
      message,
      userPath.certificate,
      sigPath
    );

    if (!is_verified) {
      return res.status(400).json({
        success: false,
        message: "Xác minh chữ ký thất bại"
      });
    }

    // Update the status to 'verified'
    await birthRegistration.update({
      status: 'awaiting_signature',
      processed_by: req.user.id,
      processed_at: new Date()
    });

    return res.status(200).json({
      success: true,
      message: "Xác minh đăng ký khai sinh thành công",
      data: birthRegistration
    });
  } catch (error) {
    console.error("Error verifying birth registration:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Controller to get all birth registrations
export const getAllBirthRegistrations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const birthRegistrations = await BirthRegistration.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: birthRegistrations.count,
      data: birthRegistrations.rows,
      totalPages: Math.ceil(birthRegistrations.count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Error fetching birth registrations:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Controller to get birth registration by ID
export const getBirthRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    const birthRegistration = await BirthRegistration.findByPk(id);
    const regId = birthRegistration ? birthRegistration.applicantId : null;
    const userId = req.user.userId;
    const role = req.user.role;
    if (role === "Citizen" && parseInt(userId) !== parseInt(regId)) {
      return res.status(403).json({
        success: false,
        error: "Bạn không có quyền truy cập vào đăng ký khai sinh này"
      });
    }

    if (!birthRegistration) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy đăng ký khai sinh"
      });
    }

    res.status(200).json({
      success: true,
      data: birthRegistration
    });
  } catch (error) {
    console.error("Error fetching birth registration:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const getBirthRegistrationByApplicantId = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;
    console.log("User ID:", userId);
    if (role === "Citizen" && parseInt(userId) !== parseInt(applicantId)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập vào đăng ký khai sinh này"
      });
    }
    const birthRegistrations = await BirthRegistration.findAll({
      where: { applicantId: applicantId },
      order: [['createdAt', 'DESC']]
    });

    if (birthRegistrations.length === 0) {
      return res.status(200).json({
        success: false,
        message: "Người nộp đơn không có đăng ký khai sinh nào"
      });
    }

    res.status(200).json({
      success: true,
      data: birthRegistrations
    });
  } catch (error) {
    console.error("Error fetching birth registrations by applicant ID:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
}

export const changeBirthRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không được để trống"
      });
    }

    const birthRegistration = await BirthRegistration.findByPk(id);

    if (!birthRegistration) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đăng ký khai sinh"
      });
    }

    birthRegistration.status = status;
    await birthRegistration.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: birthRegistration
    });
  } catch (error) {
    console.error("Error changing birth registration status:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
}