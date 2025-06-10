import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Service from './Service.js';

class MedicalCoverage {
  constructor() {
    this.model = sequelize.define('MedicalCoverage', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      service_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'services',
          key: 'id'
        }
      },
      card_number: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      coverage_type: {
        type: DataTypes.ENUM('BASIC', 'STANDARD', 'PREMIUM'),
        allowNull: false
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      monthly_premium: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'EXPIRED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'ACTIVE'
      }
    }, {
      tableName: 'medical_coverage',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });

  }
}

export default new MedicalCoverage().model; 