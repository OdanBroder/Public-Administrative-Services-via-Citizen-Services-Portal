import Application from '../models/Application.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import BirthRegistration from '../models/BirthRegistration.js';
import MedicalCoverage from '../models/MedicalCoverage.js';
import ServiceHealth from '../models/ServiceHealth.js';
import crypto from "crypto";
import path from 'path';
import fs from 'fs/promises';

import Mldsa_wrapper from "../utils/crypto/MLDSAWrapper.js";
import tpmService from "../utils/crypto/tpmController.js";
import FilePath from '../models/FilePath.js';

// Get user's applications
export const getUserApplications = async (req, res) => {
  try {
    const applications = await Application.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'description', 'status']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn đăng ký' });
  }
};

// Get all applications (admin sees all, staff sees only their office's applications)
export const getAllApplications = async (req, res) => {
  try {
    // Build query based on user role and office
    let queryOptions = {
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName']
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'description', 'status', 'office_id']
        },
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName']
        }
      ],
      order: [['created_at', 'DESC']]
    };

    // If user is not an admin, filter by office
    if (req.user.role !== 'Admin') {
      // Find user's office ID
      const user = await User.findByPk(req.user.id, {
        attributes: ['office_id']
      });

      if (user && user.office_id) {
        // Join with Service and filter by office_id
        queryOptions.include[1].where = { office_id: user.office_id };
      } else {
        return res.status(403).json({ 
          error: 'Bạn không được phân công cho bất kỳ phòng ban nào' 
        });
      }
    }

    const applications = await Application.findAll(queryOptions);

    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ 
      error: 'Lỗi khi lấy danh sách đơn đăng ký',
      details: error.message 
    });
  }
};

// Create new application
// ...existing code...

// Create new application (refactored to not send response, but return result or throw error)
export const createApplication = async (req) => {
  try {
    const { service_id } = req.body;

    // Check if service exists
    const service = await Service.findByPk(service_id);
    if (!service) {
      throw new Error('Không tìm thấy dịch vụ');
    }

    // Check if user has registered for this service and get service data
    let serviceRegistration;
    let serviceData = {};
    switch (service.name.toLowerCase()) {
      case 'đăng ký khai sinh':
        serviceRegistration = await BirthRegistration.findOne({
          where: { applicantId: req.user.id, service_id },
          include: [{
            model: User,
            as: 'applicant',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          }]
        });
        if (serviceRegistration) {
          serviceData = {
            applicant_name: serviceRegistration.applicant_name,
            applicant_dob: serviceRegistration.applicant_dob,
            applicant_phone: serviceRegistration.applicant_phone,
            applicant_cccd: serviceRegistration.applicant_cccd,
            applicant_cccd_issue_date: serviceRegistration.applicant_cccd_issue_date,
            applicant_cccd_issue_place: serviceRegistration.applicant_cccd_issue_place,
            applicant_address: serviceRegistration.applicant_address,
            registrant_name: serviceRegistration.registrant_name,
            registrant_gender: serviceRegistration.registrant_gender,
            registrant_ethnicity: serviceRegistration.registrant_ethnicity,
            registrant_nationality: serviceRegistration.registrant_nationality,
            registrant_dob: serviceRegistration.registrant_dob,
            registrant_dob_in_words: serviceRegistration.registrant_dob_in_words,
            registrant_birth_place: serviceRegistration.registrant_birth_place,
            registrant_province: serviceRegistration.registrant_province,
            registrant_hometown: serviceRegistration.registrant_hometown,
            father_name: serviceRegistration.father_name,
            father_dob: serviceRegistration.father_dob,
            father_ethnicity: serviceRegistration.father_ethnicity,
            father_nationality: serviceRegistration.father_nationality,
            father_residence_type: serviceRegistration.father_residence_type,
            father_address: serviceRegistration.father_address,
            mother_name: serviceRegistration.mother_name,
            mother_dob: serviceRegistration.mother_dob,
            mother_ethnicity: serviceRegistration.mother_ethnicity,
            mother_nationality: serviceRegistration.mother_nationality,
            mother_residence_type: serviceRegistration.mother_residence_type,
            mother_address: serviceRegistration.mother_address,
            status: serviceRegistration.status,
            file_path: serviceRegistration.file_path
          };
        }
        break;

      case 'medical coverage':
        serviceRegistration = await MedicalCoverage.findOne({
          where: { user_id: req.user.id, service_id },
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          }]
        });
        if (serviceRegistration) {
          serviceData = {
            card_number: serviceRegistration.card_number,
            coverage_type: serviceRegistration.coverage_type,
            start_date: serviceRegistration.start_date,
            end_date: serviceRegistration.end_date,
            monthly_premium: serviceRegistration.monthly_premium
          };
        }
        break;

      case 'service health':
        serviceRegistration = await ServiceHealth.findOne({
          where: { user_id: req.user.id, service_id },
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          }]
        });
        if (serviceRegistration) {
          serviceData = {
            status: serviceRegistration.status,
            response_time: serviceRegistration.response_time,
            uptime: serviceRegistration.uptime,
            last_checked: serviceRegistration.last_checked
          };
        }
        break;

      default:
        throw new Error('Loại dịch vụ không hợp lệ');
    }

    if (!serviceRegistration) {
      throw new Error('Bạn chưa đăng ký dịch vụ này. Vui lòng đăng ký dịch vụ trước khi tạo đơn.');
    }

    // Create application with service-specific data
    const application_data = {
      service_registration_id: serviceRegistration.id,
      service_type: service.name,
      service_data: serviceData,
      submitted_at: new Date().toISOString()
    }

    const application = await Application.create({
      user_id: req.user.id,
      service_id: service.id,
      application_data: application_data,
      status: 'pending'
    });

    const applicationDataString = JSON.stringify(application_data);

    // Get user's private key from FilePath
    const userFilePath = await FilePath.findOne({
      where: { user_id: req.user.id }
    });

    if (!userFilePath || !userFilePath.private_key) {
      throw new Error('Không tìm thấy private key của người dùng. Vui lòng tạo key pair trước.');
    }

    // Create message and sign by private key
    const message = crypto.createHash('sha512').update(applicationDataString).digest('hex');

    // Decrypt private key
    const privateKeyContent = await tpmService.decryptWithRootKey(
      await fs.readFile(userFilePath.private_key, 'utf8')
    );

    // Get base application directory from FilePath
    const applicationDir = path.join(userFilePath.application, application.id.toString());
    const sigDir = path.join(applicationDir, 'sig');
    const messageDir = path.join(applicationDir, 'message');

    try {
      // Create directories
      await fs.mkdir(sigDir, { recursive: true });
      await fs.mkdir(messageDir, { recursive: true });

      // Define file paths
      const sigPath = path.join(sigDir, 'signature.bin');
      const messagePath = path.join(messageDir, 'message.txt');
      const metadataPath = path.join(applicationDir, 'metadata.json');

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
      await fs.writeFile(messagePath, message);
      await fs.writeFile(metadataPath, JSON.stringify({
        application_id: application.id,
        service_type: service.name,
        created_at: new Date().toISOString(),
        signature_path: sigPath,
        message_path: messagePath
      }, null, 2));

      // verify message with signature using certificate from FilePath
      const is_verified = await Mldsa_wrapper.verifyWithCertificate(
        signature, 
        message, 
        userFilePath.certificate, 
        sigPath
      );

      if(is_verified){
        await application.update({
          status: 'awaiting_signature',
          processed_by: req.user.id,
          processed_at: new Date()
        });
      } else {
        throw new Error('Verification failed');
      }

      // Fetch the created application with all details
      const createdApplication = await Application.findByPk(application.id, {
        include: [
          {
            model: User,
            as: 'applicant',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          },
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'name', 'description', 'status']
          }
        ]
      });

      // Instead of sending response, return the created application
      return {
        status: 'success',
        message: 'Tạo đơn đăng ký thành công',
        application: createdApplication
      };
    } catch (error) {
      // If any file operation fails, clean up the application directory
      try {
        await fs.rm(applicationDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Error cleaning up application directory:', cleanupError);
      }
      // Delete the application record
      await application.destroy();
      throw error;
    }
  } catch (error) {
    // Instead of sending response, throw error to be handled by caller
    throw error;
  }
};
// ...existing code...
// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Find application with its service information
    const application = await Application.findByPk(id, {
      include: [{
        model: Service,
        as: 'service',
        attributes: ['id', 'name', 'description', 'status', 'office_id']
      }]
    });

    if (!application) {
      return res.status(404).json({ error: 'Không tìm thấy đơn đăng ký' });
    }

    // Check if user has permission to update this application
    if (req.user.role !== 'Admin') {
      // Get user's office
      const user = await User.findByPk(req.user.id, {
        attributes: ['office_id']
      });

      // If user doesn't have office or office doesn't match service's office
      if (!user.office_id || user.office_id !== application.service.office_id) {
        return res.status(403).json({ 
          error: 'Bạn không có quyền cập nhật trạng thái đơn đăng ký này' 
        });
      }
    }

    // Update application with processor info
    await application.update({
      status,
      processed_by: req.user.id,
      processed_at: new Date()
    });

    // Fetch updated application with all details
    const updatedApplication = await Application.findByPk(id, {
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName']
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'description', 'status']
        },
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName']
        }
      ]
    });

    res.json({
      message: 'Cập nhật trạng thái đơn đăng ký thành công',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ 
      error: 'Lỗi khi cập nhật đơn đăng ký',
      details: error.message 
    });
  }
};

// Delete application
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ error: 'Không tìm thấy đơn đăng ký' });
    }

    await application.destroy();
    res.json({ message: 'Xóa đơn đăng ký thành công' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Lỗi khi xóa đơn đăng ký' });
  }
};