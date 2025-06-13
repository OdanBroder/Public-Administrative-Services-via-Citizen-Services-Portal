import { DataTypes, Model } from 'sequelize'; // Import Model
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import Role from './Role.js'; // Import Role model
import Office from './Office.js'; // Import Office model
import Mldsa_wrapper from '../utils/crypto/MLDSAWrapper.js';
import tpmService from '../utils/crypto/tpmController.js';
import fs from 'fs/promises';
import path from 'path';
import Permission from './Permission.js';
import RolePermission from './RolePermission.js';

// Extend Model for User class
class User extends Model {
  // Instance method to compare password
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Static method to find user by email
  static async findByEmail(email) {
    return await User.findOne({ where: { email } });
  }

  // Static method to find user by username
  static async findByUsername(username) {
    return await User.findOne({ where: { username } });
  }

  // Static method to check if profile is complete by username
  static async hasFinishedProfile(username) {
    const user = await this.findOne({
      where: { username },
      attributes: ['completeProfile'],
    });
    return user?.completeProfile === true;
  }

  // Static method to check if profile is complete by primary key
  static async hasFinishedProfilePk(pKey) {
    const user = await this.findOne({
      where: { id: pKey },
      attributes: ['completeProfile'],
    });
    return user?.completeProfile === true;
  }

  static async assignRoleAndPermissions(userId, roleName) {
    try {
      // Get the role
      const role = await Role.findOne({
        where: { name: roleName }
      });

      if (!role) {
        throw new Error(`Role ${roleName} not found`);
      }

      // Update user's role
      await User.update(
        { role_id: role.id },
        { where: { id: userId } }
      );

      // Get all permissions for this role
      const rolePermissions = await Role.findByPk(role.id, {
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] } // exclude junction table fields
        }]
      });
      return {
        role: role.name,
        permissions: rolePermissions.permissions.map(rp => rp.name)
      };
    } catch (error) {
      console.error('Error assigning role and permissions:', error);
      throw error;
    }
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED, // Changed to UNSIGNED for consistency
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100]
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role_id: { // ADDED: Foreign key for Role
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false, // Allow null initially or for users without roles?
    defaultValue: 2,
    references: {
      model: Role,
      key: 'id'
    },
    comment: 'Foreign key linking to the Roles table'
  },
  office_id: { // ADDED: Foreign key for Office
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true, // Nullable as not all roles belong to an office (e.g., Admin, Citizen)
    references: {
      model: Office,
      key: 'id'
    },
    comment: 'Foreign key linking to the Offices table (relevant for Staff/Head roles)'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: { // ADDED: Standard updatedAt field
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW
  },
  completeProfile: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: "complete_profile"
  },
  is_email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: "is_email_verified"
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: "is_verified"
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users', 
  timestamps: true, 
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  },
  indexes: [ // ADDED: Indexes for foreign keys
    { fields: ['role_id'] },
    { fields: ['office_id'] }
  ]
});

// Define associations


async function createAdminUser(){
  try {
    // Create default users for each role type
    const defaultUsers = [
      {
        username: 'admin',
        email: "admin@example.com",
        firstName: 'Admin',
        lastName: 'User',
        password: 'Admin@@123456',
        role_id: 1, // Admin role
        office_id: null, // Admin doesn't need office
        completeProfile: true,
        is_email_verified: true
      },
      {
        username: 'user',
        email: "user@example.com",
        firstName: 'Regular',
        lastName: 'User',
        password: 'User@@123456',
        role_id: 2, // Citizen role
        office_id: null, // Citizens don't belong to an office
        completeProfile: true,
        is_email_verified: true
      },
      {
        username: 'staff',
        email: "staff@example.com",
        firstName: 'Staff',
        lastName: 'Member',
        password: 'Staff@@123456',
        role_id: 3, // Staff role
        office_id: 1, // UBND office
        completeProfile: true,
        is_email_verified: true
      },
      {
        username: 'head',
        email: "head@example.com",
        firstName: 'Department',
        lastName: 'Head',
        password: 'Head@@123456',
        role_id: 4, // Head role
        office_id: 1, // UBND office
        completeProfile: true,
        is_email_verified: true
      },
      {
        username: 'police',
        email: "police@example.com",
        firstName: 'Police',
        lastName: 'Officer',
        password: 'Police@@123456',
        role_id: 5, // Police role
        office_id: 3, // BCA office
        completeProfile: true,
        is_email_verified: true
      },
      {
        username: 'bca',
        email: "bca@example.com",
        firstName: 'Birth',
        lastName: 'Certificate',
        password: 'Bca@@123456',
        role_id: 6, // BCA role
        office_id: 4, // Birth Certificate Authority office
        completeProfile: true,
        is_email_verified: true
      },
      {
        username: 'syt',
        email: "syt@example.com",
        firstName: 'Health',
        lastName: 'Department',
        password: 'Syt@@123456',
        role_id: 7, // SYT role
        office_id: 2, // SYT office
        completeProfile: true,
        is_email_verified: true
      }
    ];

    for (const userData of defaultUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: { username: userData.username }
      });

      if (!existingUser) {
        const user = await User.create(userData);
        console.log(`${userData.username} user created successfully`);
      }
    }
  }
  catch (error) {
    console.error('Error creating default users:', error);
  }
}

export default User;
export {createAdminUser};

