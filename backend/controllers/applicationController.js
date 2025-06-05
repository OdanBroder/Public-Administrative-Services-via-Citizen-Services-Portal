import Application from '../models/Application.js';
import Service from '../models/Service.js';

// Get all applications for a user
export const getUserApplications = async (req, res) => {
  try {
    const applications = await Application.findAll({
      where: { user_id: req.user.id },
      include: [Service]
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all applications (admin only)
export const getAllApplications = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }

    const applications = await Application.findAll({
      include: [Service]
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new application
export const createApplication = async (req, res) => {
  try {
    const { service_id, service_type } = req.body;

    // Check if service exists and is active
    const service = await Service.findByPk(service_id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.status !== 'active') {
      return res.status(400).json({ message: 'This service is currently inactive' });
    }

    // Check if user already has a pending application for this service
    const existingApplication = await Application.findOne({
      where: {
        user_id: req.user.userId,
        service_id: service_id,
        status: 'pending'
      }
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You already have a pending application for this service' });
    }

    // Create the application with the service name as type if not provided
    const application = await Application.create({
      user_id: req.user.userId,
      service_id,
      status: 'pending'
    });

    // Include the service details in the response
    const applicationWithService = await Application.findByPk(application.id, {
      include: [{
        model: Service,
        attributes: ['id', 'name', 'description', 'status']
      }]
    });

    res.status(201).json({
      message: 'Application created successfully',
      application: applicationWithService
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(400).json({ 
      message: error.message || 'Failed to create application',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update application status (admin only)
export const updateApplicationStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    await application.update({ status });
    res.json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete application
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findByPk(id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Only allow users to delete their own applications or admins to delete any
    if (application.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await application.destroy();
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 