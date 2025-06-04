import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js'; 
class Office extends Model {}

Office.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'Name of the office/department, e.g., City Public Security',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional description of the office',
  },
}, {
  sequelize,
  modelName: 'Office',
  tableName: 'Offices',
  timestamps: true, // Automatically adds createdAt and updatedAt
});

export default Office;

