import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MedicalCoverage = sequelize.define('MedicalCoverage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  citizenId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  coverageType: {
    type: DataTypes.ENUM('BASIC', 'STANDARD', 'PREMIUM'),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  monthlyPremium: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'EXPIRED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'medical_coverage',
  timestamps: true,
  underscored: true
});

export default MedicalCoverage; 