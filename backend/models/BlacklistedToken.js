import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js"; // Assuming your sequelize instance is exported from here

class BlacklistedToken extends Model {}

BlacklistedToken.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: "BlacklistedToken",
  tableName: "jwt_blacklist",
  timestamps: true, // Adds createdAt and updatedAt automatically
  updatedAt: false, // We only care about createdAt
  indexes: [
    // Index for faster token lookup (using prefix for TEXT)
    {
      fields: [{ name: "token", length: 255 }],
    },
    // Index for cleaning up expired tokens
    {
      fields: ["expires_at"],
    },
  ],
});

export default BlacklistedToken;
