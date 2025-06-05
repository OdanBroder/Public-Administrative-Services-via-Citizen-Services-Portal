import ServiceHealth from '../models/ServiceHealth.js';

export const getServiceHealth = async (req, res) => {
  try {
    const services = await ServiceHealth.findAll();
    
    // If user is not admin, only return service names and status
    if (req.user.role !== 'Admin') {
      const simplifiedServices = services.map(service => ({
        id: service.id,
        serviceName: service.serviceName,
        status: service.status
      }));
      return res.json(simplifiedServices);
    }
    
    res.json(services);
  } catch (error) {
    console.error('Error fetching service health:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createServiceHealth = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }

    const { serviceName, status, responseTime, uptime } = req.body;
    
    // Validate status
    const validStatuses = ['UP', 'DOWN', 'DEGRADED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    // Convert uptime to a decimal number between 0 and 100
    const uptimeValue = parseFloat(uptime);
    if (isNaN(uptimeValue) || uptimeValue < 0 || uptimeValue > 100) {
      return res.status(400).json({ message: 'Uptime must be a number between 0 and 100' });
    }

    const service = await ServiceHealth.create({
      serviceName,
      status: status.toUpperCase(), // Ensure status is uppercase
      responseTime,
      uptime: uptimeValue,
      lastChecked: new Date()
    });
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service health:', error);
    res.status(400).json({ message: error.message });
  }
};

export const updateServiceHealth = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }

    const { id } = req.params;
    const { status, responseTime, uptime } = req.body;
    
    // Validate status
    const validStatuses = ['UP', 'DOWN', 'DEGRADED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    // Convert uptime to a decimal number between 0 and 100
    const uptimeValue = parseFloat(uptime);
    if (isNaN(uptimeValue) || uptimeValue < 0 || uptimeValue > 100) {
      return res.status(400).json({ message: 'Uptime must be a number between 0 and 100' });
    }

    const service = await ServiceHealth.findByPk(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    await service.update({
      status: status.toUpperCase(), // Ensure status is uppercase
      responseTime,
      uptime: uptimeValue,
      lastChecked: new Date()
    });
    res.json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteServiceHealth = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }

    const { id } = req.params;
    const service = await ServiceHealth.findByPk(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    await service.destroy();
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};