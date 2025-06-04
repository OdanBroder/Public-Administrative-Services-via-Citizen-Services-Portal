import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import Role from './Role.js';
import Permission from './Permission.js';

class RolePermission extends Model {}

RolePermission.init({
  role_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true, 
    references: {
      model: Role,
      key: 'id',
    },
  },
  permission_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true, 
    references: {
      model: Permission,
      key: 'id',
    },
  },
}, {
  sequelize,
  modelName: 'RolePermission',
  tableName: 'RolePermissions',
  timestamps: true, // Automatically adds createdAt
  updatedAt: false, // No need for updatedAt in a join table
});


export default RolePermission;

