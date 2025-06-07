import BirthRegistration from '../models/BirthRegistration.js';
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
        message: "Vui lòng điền đầy đủ thông tin cha"
      });
    }

    if (!motherName || !motherDob || !motherEthnicity || !motherNationality || 
        !motherResidenceType || !motherAddress) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin mẹ"
      });
    }

    // Create new birth registration
    const birthApplication_new = await BirthRegistration.create({
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
    });

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
    
    if (!birthRegistration) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đăng ký khai sinh"
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
