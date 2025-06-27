import BirthRegistration from '../models/BirthRegistration.js';
import crypto from 'crypto';
import tpmService from '../utils/crypto/tpmController.js';
import path from 'path';
import Mldsa_wrapper from '../utils/crypto/MLDSAWrapper.js';
import FilePath from '../models/FilePath.js';
import fs from 'fs'
import Sigs from '../models/Sigs.js';
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
      motherAddress,
      message
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
    
    if(!req.files || !req.files.signature[0]) {
      // console.error("Signature file is missing or not provided", req.files);
      // console.error(req);
      return res.status(400).json({
        success: false,
        message: "Chữ ký không hợp lệ hoặc không được cung cấp"
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

    if(req.files && req.files.signature) {
      const signatureFile = req.files.signature[0];
      if (!signatureFile) {
        return res.status(400).json({
          success: false,
          message: "Chữ ký không hợp lệ hoặc không được cung cấp"
        });
      }

      // Read the signature file
      const signature = signatureFile.buffer.toString('utf8');

      // Create a message to sign
      const clone = birthApplicationData;
      delete clone.status;
      // const message = JSON.stringify(clone);
      // Verify the signature using the user's certificate
      const userPath = await FilePath.findOne({
        where: { user_id: applicantId },
        attributes: ['certificate']
      });

      if (!userPath || !userPath.certificate) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chứng chỉ cho người nộp đơn"
        });
      }

      const certData = fs.readFileSync(userPath.certificate, 'utf8');
      const sigData = Buffer.from(signature, 'base64');

      // Verify the signature
      // console.log("Message:", message);
      // // console.log("Certificate:", certData);
      // console.log("Signature Data:", sigData.toString('base64'));
      const is_verified = await Mldsa_wrapper.verifyWithCertificate(
        certData,
        sigData,
        message
      );

      if (!is_verified) {
        return res.status(400).json({
          success: false,
          message: "Xác minh chữ ký thất bại"
        });
      }
      const applicationPath = await FilePath.findOne({
        where: { user_id: applicantId }});      // Save the file path and signature to the birth registration
      applicationPath.application = path.join(process.cwd(), '/working', 'user', applicantId.toString(), 'application', birthApplication_new.id.toString());
      await fs.promises.mkdir(applicationPath.application, { recursive: true });
      await fs.promises.mkdir(path.join(applicationPath.application, 'sig'), { recursive: true });
      // await fs.promises.mkdir(path.join(applicationPath.application, 'message'), { recursive: true });
      if (!applicationPath || !applicationPath.application) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đường dẫn tệp cho người nộp đơn"
        });
      }
      const sigPath = path.join(applicationPath.application, 'sig', 'signature.txt');
      // const messagePath = path.join(applicationPath.application, 'message', 'message.txt');
      const sigToSave = JSON.stringify({message:message, signature: signature});
      await fs.promises.writeFile(sigPath, sigToSave); // Save the signature file in base64
      await birthApplication_new.update({
        file_path: applicationPath.application,
        status: 'pending',
      });
      await Sigs.create({
        birth_registration_id: birthApplication_new.id,
        UUID: crypto.randomUUID(),
        type: 'requester',
        path: sigPath
      })
      await applicationPath.save();
      // await fs.promises.writeFile(messagePath, message); // Save the message fil
    }
    birthApplication_new.status = "awaiting_signature"; 
    await birthApplication_new.save();

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
    if (req.files && req.files.signature) {
      req.files.signature.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      });
    }
    // Delete entry in database if necessary
    if (req.body && req.body.applicantId) {
      await BirthRegistration.destroy({
        where: { applicantId: req.body.applicantId }
      });
    }
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

export const getBirthRegistrationSubmitterSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const signature = await Sigs.findOne({
      where: { birth_registration_id: id, type: 'requester' }
    }); 
    if (!signature) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chữ ký của người nộp đơn"
      });
    }
    const signatureUrl = `https://citizen-citizen-service-portal.free.nf/signature/requester/${signature.UUID}`;
    res.status(200).json({
      success: true,
      data: signatureUrl
    });
  } catch (error) {
    console.error("Error fetching birth registration signature:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
}

export const getBirthRegistrationIssuerSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const signature = await Sigs.findOne({
      where: { birth_registration_id: id, type: 'issuer' }
    });
    if (!signature) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chữ ký của cơ quan chức năng"
      });
    }
    const signatureUrl = `https://citizen-citizen-service-portal.free.nf/signature/issuer/${signature.UUID}`;
    res.status(200).json({
      success: true,
      data: signatureUrl
    });
  } catch (error) {
    console.error("Error fetching birth registration issuer signature:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
}