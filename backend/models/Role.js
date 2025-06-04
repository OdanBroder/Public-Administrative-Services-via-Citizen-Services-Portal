import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js'; 
class Role extends Model {}

Role.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Role name, e.g., Admin, Citizen, Staff, Head',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional description of the role',
  },
}, {
  sequelize,
  modelName: 'Role',
  tableName: 'Roles',
  timestamps: true, // Automatically adds createdAt and updatedAt
});
console.log("Role association: ", Role.associations);
export default Role;

