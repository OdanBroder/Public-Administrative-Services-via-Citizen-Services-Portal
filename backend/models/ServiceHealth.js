import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ServiceHealth = sequelize.define('ServiceHealth', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  serviceName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('UP', 'DOWN', 'DEGRADED'),
    allowNull: false
  },
  responseTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  lastChecked: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  uptime: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

export default ServiceHealth; 