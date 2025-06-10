import { User, MedicalCoverage } from '../models/associations.js';
import { Role } from '../models/Association.js';

export const getMedicalCoverage = async (req, res) => {
  try {
    const role = req.user.role;

    // If admin/staff, get all coverage
    if (role === 'Admin' || role === 'Staff') {
      const allCoverage = await MedicalCoverage.findAll({
        attributes: [
          'id',
          'user_id',
          'coverage_type',
          'start_date',
          'end_date',
          'monthly_premium',
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

    const coverage = await MedicalCoverage.findAll({
      where: { user_id: req.user.userId }, // Ensure 'user_id' is used
      attributes: [
        'id',
        'user_id',
        'coverage_type',
        'start_date',
        'end_date',
        'monthly_premium',
        'status'
      ],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    if (!coverage || coverage.length === 0) {
      return res.status(200).json({ message: 'Không có bảo hiểm y tế cho người dùng này' });
    }

    res.json(coverage);
  } catch (error) {
    console.error('Lỗi trong getMedicalCoverage:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi máy chủ' });
  }
};

export const createMedicalCoverage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { coverageType, startDate, endDate, monthlyPremium } = req.body;

    const coverage = await MedicalCoverage.create({
      userId,
      type: coverageType,
      startDate,
      endDate,
      monthlyPremium,

      status: 'ACTIVE'
    });

    res.status(201).json(coverage);
  } catch (error) {
    console.error('Lỗi trong createMedicalCoverage:', error);
    res.status(400).json({ message: 'Dữ liệu không hợp lệ hoặc yêu cầu không thể xử lý' });
  }
};

export const updateMedicalCoverage = async (req, res) => {
  try {
    const { id } = req.params;
    const { coverageType, startDate, endDate, monthlyPremium, status } = req.body;

    const coverage = await MedicalCoverage.findOne({ where: { id } });
    if (!coverage) {
      return res.status(404).json({ message: 'Không tìm thấy bảo hiểm' });
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
    console.error('Lỗi trong updateMedicalCoverage:', error);
    res.status(400).json({ message: 'Dữ liệu không hợp lệ hoặc yêu cầu không thể xử lý' });
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
      return res.status(404).json({ message: 'Không tìm thấy bảo hiểm' });
    }

    await coverage.destroy();
    res.json({ message: 'Xóa bảo hiểm thành công' });
  } catch (error) {
    console.error('Lỗi trong deleteMedicalCoverage:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi máy chủ' });
  }
};