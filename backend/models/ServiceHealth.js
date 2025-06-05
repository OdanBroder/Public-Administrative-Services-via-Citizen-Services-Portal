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
    unique: true,
    field: 'service_name'
  },
  status: {
    type: DataTypes.ENUM('UP', 'DOWN', 'DEGRADED'),
    allowNull: false
  },
  responseTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'response_time',
    validate: {
      min: 0
    }
  },
  lastChecked: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'last_checked'
  },
  uptime: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 100,
      isDecimal: true
    }
  }
}, {
  tableName: 'service_health',
  timestamps: true,
  underscored: true
});

export default ServiceHealth; 