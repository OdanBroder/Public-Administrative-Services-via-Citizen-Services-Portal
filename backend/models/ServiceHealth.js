import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Service from './Service.js';
import User from './User.js';

class ServiceHealth {
  constructor() {
    this.model = sequelize.define('ServiceHealth', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      service_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'services',
          key: 'id'
        }
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      status: {
        type: DataTypes.ENUM('UP', 'DOWN', 'DEGRADED'),
        allowNull: false
      },
      response_time: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      last_checked: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      uptime: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
      }
    }, {
      tableName: 'service_health',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });

    // Define associations
    this.model.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
    this.model.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  }
}

export default new ServiceHealth().model; 