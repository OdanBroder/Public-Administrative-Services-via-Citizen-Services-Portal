import MedicalCoverage from '../models/MedicalCoverage.js';
import Citizen from '../models/Citizen.js';

export const getMedicalCoverage = async (req, res) => {
  try {
    const { citizenId } = req.params;
    const coverage = await MedicalCoverage.findAll({
      where: { citizenId },
      include: [{
        model: Citizen,
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });
    res.json(coverage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMedicalCoverage = async (req, res) => {
  try {
    const { citizenId, coverageType, startDate, endDate, monthlyPremium } = req.body;
    const coverage = await MedicalCoverage.create({
      citizenId,
      coverageType,
      startDate,
      endDate,
      monthlyPremium
    });
    res.status(201).json(coverage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMedicalCoverage = async (req, res) => {
  try {
    const { id } = req.params;
    const { coverageType, startDate, endDate, monthlyPremium } = req.body;
    const coverage = await MedicalCoverage.findByPk(id);
    if (!coverage) {
      return res.status(404).json({ message: 'Coverage not found' });
    }
    await coverage.update({
      coverageType,
      startDate,
      endDate,
      monthlyPremium
    });
    res.json(coverage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMedicalCoverage = async (req, res) => {
  try {
    const { id } = req.params;
    const coverage = await MedicalCoverage.findByPk(id);
    if (!coverage) {
      return res.status(404).json({ message: 'Coverage not found' });
    }
    await coverage.destroy();
    res.json({ message: 'Coverage deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 