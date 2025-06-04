import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js'; 

class Permission extends Model {}

Permission.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Permission name (action), e.g., manage_users, process_request',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional description of the permission',
  },
}, {
  sequelize,
  modelName: 'Permission',
  tableName: 'Permissions',
  timestamps: true, // Automatically adds createdAt and updatedAt
});
console.log("Permission association: ", Permission.associations);
export default Permission;

