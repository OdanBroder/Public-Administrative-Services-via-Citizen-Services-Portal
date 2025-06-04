import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MedicalCoverage = sequelize.define("MedicalCoverage", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  citizenId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'citizen_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('BASIC', 'STANDARD', 'PREMIUM'),
    allowNull: false,
    field: 'coverage_type'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'end_date'
  },
  monthlyPremium: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'monthly_premium'
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'EXPIRED', 'CANCELLED'),
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'medical_coverage',
  timestamps: true,
  underscored: true
});

export default MedicalCoverage; 