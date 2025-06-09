import Application from '../models/Application.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import BirthRegistration from '../models/BirthRegistration.js';
import MedicalCoverage from '../models/MedicalCoverage.js';
import ServiceHealth from '../models/ServiceHealth.js';
import crypto from "crypto";
import path from 'path';
import fs from 'fs/promises';

import MLDSAWrapper from "../utils/crypto/MLDSAWrapper.js";
import ScalableTPMService from "../utils/crypto/ScalableTPMService.js";
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

// Get all applications (admin only)
export const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.findAll({
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
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching all applications:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn đăng ký' });
  }
};

// Create new application
export const createApplication = async (req, res) => {
  try {
    const { service_id } = req.body;

    // Check if service exists
    const service = await Service.findByPk(service_id);
    if (!service) {
      return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
    }

    // Check if user has registered for this service and get service data
    let serviceRegistration;
    let serviceData = {};

    switch (service.name.toLowerCase()) {
      case 'birth registration':
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
            // Applicant Information
            applicant_name: serviceRegistration.applicant_name,
            applicant_dob: serviceRegistration.applicant_dob,
            applicant_phone: serviceRegistration.applicant_phone,
            applicant_cccd: serviceRegistration.applicant_cccd,
            applicant_cccd_issue_date: serviceRegistration.applicant_cccd_issue_date,
            applicant_cccd_issue_place: serviceRegistration.applicant_cccd_issue_place,
            applicant_address: serviceRegistration.applicant_address,

            // Registrant Information
            registrant_name: serviceRegistration.registrant_name,
            registrant_gender: serviceRegistration.registrant_gender,
            registrant_ethnicity: serviceRegistration.registrant_ethnicity,
            registrant_nationality: serviceRegistration.registrant_nationality,
            registrant_dob: serviceRegistration.registrant_dob,
            registrant_dob_in_words: serviceRegistration.registrant_dob_in_words,
            registrant_birth_place: serviceRegistration.registrant_birth_place,
            registrant_province: serviceRegistration.registrant_province,
            registrant_hometown: serviceRegistration.registrant_hometown,

            // Father's Information
            father_name: serviceRegistration.father_name,
            father_dob: serviceRegistration.father_dob,
            father_ethnicity: serviceRegistration.father_ethnicity,
            father_nationality: serviceRegistration.father_nationality,
            father_residence_type: serviceRegistration.father_residence_type,
            father_address: serviceRegistration.father_address,

            // Mother's Information
            mother_name: serviceRegistration.mother_name,
            mother_dob: serviceRegistration.mother_dob,
            mother_ethnicity: serviceRegistration.mother_ethnicity,
            mother_nationality: serviceRegistration.mother_nationality,
            mother_residence_type: serviceRegistration.mother_residence_type,
            mother_address: serviceRegistration.mother_address,

            // Additional Information
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
        return res.status(400).json({ error: 'Loại dịch vụ không hợp lệ' });
    }

    if (!serviceRegistration) {
      return res.status(400).json({
        error: 'Bạn chưa đăng ký dịch vụ này. Vui lòng đăng ký dịch vụ trước khi tạo đơn.'
      });
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

    try {
      // Get user's private key from FilePath
      const userFilePath = await FilePath.findOne({
        where: { user_id: req.user.id }
      });

      if (!userFilePath || !userFilePath.private_key) {
        return res.status(400).json({ 
          error: 'Không tìm thấy private key của người dùng. Vui lòng tạo key pair trước.' 
        });
      }

      // Create message and sign by private key
      const message = crypto.createHash('sha512').update(applicationDataString).digest('hex');

      // Decrypt private key
      const privateKeyContent = ScalableTPMService.decryptWithRootKey(
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
        const signature = await MLDSAWrapper._sign_mldsa65(
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
        const userCertificate = await fs.readFile(userFilePath.certificate, 'utf8');
        const is_verified = MLDSAWrapper.verifyWithCertificate(
          userCertificate, 
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

        res.status(201).json({
          message: 'Tạo đơn đăng ký thành công',
          application: createdApplication
        });
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
      console.error('Error creating application:', error);
      res.status(500).json({ error: 'Lỗi khi tạo đơn đăng ký' });
    }
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Lỗi khi tạo đơn đăng ký' });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ error: 'Không tìm thấy đơn đăng ký' });
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
    res.status(500).json({ error: 'Lỗi khi cập nhật đơn đăng ký' });
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