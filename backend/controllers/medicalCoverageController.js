import { User, MedicalCoverage } from '../models/associations.js';
import { Role } from '../models/Association.js';

export const getMedicalCoverage = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUser = await User.findOne({
      where: { id: req.user.userId },
      include: [{ model: Role, as: 'role' }]
    });
    
    // If admin/staff, get all coverage
    if (requestingUser.role.name === 'Admin' || requestingUser.role.name === 'Staff') {
      const allCoverage = await MedicalCoverage.findAll({
        attributes: [
          'id',
          'user_id',
          'type',
          'startDate',
          'endDate',
          'monthlyPremium',
          'status'
        ],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }]
      });
      
      return res.json(allCoverage);
    }

    // For regular users, only get their own coverage
    if (requestingUser.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Not authorized to view this coverage' });
    }

    const coverage = await MedicalCoverage.findAll({
      where: { citizenId: userId },
      attributes: [
        'id',
        'citizenId',
        'type',
        'startDate',
        'endDate',
        'monthlyPremium',
        'status'
      ],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });
    
    if (!coverage || coverage.length === 0) {
      return res.status(404).json({ message: 'No Bảo hiểm Y tế found for this user' });
    }
    
    res.json(coverage);
  } catch (error) {
    console.error('Error in getMedicalCoverage:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createMedicalCoverage = async (req, res) => {
  try {
    const { citizenId, coverageType, startDate, endDate, monthlyPremium } = req.body;
    const requestingUser = await User.findOne({
      where: { id: req.user.userId },
      include: [{ model: Role, as: 'role' }]
    });

    // Check if target user exists
    const targetUser = await User.findOne({ where: { id: citizenId } });
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    // Only allow admin/staff to create coverage for others
    if (requestingUser.role.name !== 'Admin' && 
        requestingUser.role.name !== 'Staff' && 
        requestingUser.id !== parseInt(citizenId)) {
      return res.status(403).json({ message: 'Not authorized to create coverage for this user' });
    }

    const coverage = await MedicalCoverage.create({
      citizenId,
      type: coverageType,
      startDate,
      endDate,
      monthlyPremium,
      status: 'ACTIVE'
    });

    res.status(201).json(coverage);
  } catch (error) {
    console.error('Error in createMedicalCoverage:', error);
    res.status(400).json({ message: error.message });
  }
};

export const updateMedicalCoverage = async (req, res) => {
  try {
    const { id } = req.params;
    const { coverageType, startDate, endDate, monthlyPremium, status } = req.body;
    const requestingUser = await User.findOne({
      where: { id: req.user.userId },
      include: [{ model: Role, as: 'role' }]
    });
    
    const coverage = await MedicalCoverage.findOne({ where: { id } });
    if (!coverage) {
      return res.status(404).json({ message: 'Coverage not found' });
    }

    // Only allow admin/staff to update coverage
    if (requestingUser.role.name !== 'Admin' && 
        requestingUser.role.name !== 'Staff') {
      return res.status(403).json({ message: 'Not authorized to update coverage' });
    }

    await coverage.update({
      type: coverageType,
      startDate,
      endDate,
      monthlyPremium,
      status
    });

    res.json(coverage);
  } catch (error) {
    console.error('Error in updateMedicalCoverage:', error);
    res.status(400).json({ message: error.message });
  }
};

export const deleteMedicalCoverage = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = await User.findOne({
      where: { id: req.user.userId },
      include: [{ model: Role, as: 'role' }]
    });

    const coverage = await MedicalCoverage.findOne({ where: { id } });
    if (!coverage) {
      return res.status(404).json({ message: 'Coverage not found' });
    }

    // Only allow admin to delete coverage
    if (requestingUser.role.name !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete coverage' });
    }

    await coverage.destroy();
    res.json({ message: 'Coverage deleted successfully' });
  } catch (error) {
    console.error('Error in deleteMedicalCoverage:', error);
    res.status(500).json({ message: error.message });
  }
};