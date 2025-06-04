import ServiceHealth from '../models/ServiceHealth.js';

export const getServiceHealth = async (req, res) => {
  try {
    const services = await ServiceHealth.findAll();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createServiceHealth = async (req, res) => {
  try {
    const { serviceName, status, responseTime, lastChecked, uptime } = req.body;
    const service = await ServiceHealth.create({
      serviceName,
      status,
      responseTime,
      lastChecked,
      uptime
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateServiceHealth = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, responseTime, lastChecked, uptime } = req.body;
    const service = await ServiceHealth.findByPk(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    await service.update({
      status,
      responseTime,
      lastChecked,
      uptime
    });
    res.json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteServiceHealth = async (req, res) => {
  try {
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