import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Office from './Office.js'; // Assuming you have an Office model
const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  office_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: Office, // Assuming you have an Office model
      key: 'id'
    }
  },
  application_url:{
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
    comment: 'URL for the service application or more information'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'services',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Add any hooks or methods here if needed
Service.beforeCreate(async (service) => {
  // Ensure name is unique
  const existingService = await Service.findOne({
    where: { name: service.name }
  });
  if (existingService) {
    throw new Error('Service with this name already exists');
  }
});

export default Service; 