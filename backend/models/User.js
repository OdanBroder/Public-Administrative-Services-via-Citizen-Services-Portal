import { DataTypes, Model } from 'sequelize'; // Import Model
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import Role from './Role.js'; // Import Role model
import Office from './Office.js'; // Import Office model

// Extend Model for User class
class User extends Model {
  // Instance method to compare password
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Static method to find user by email
  static async findByEmail(email) {
    return this.findOne({ where: { email: email.toLowerCase() } });
  }

  // Static method to find user by username
  static async findByUsername(username) {
    return this.findOne({ where: { username: username } });
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
  // REMOVED: Old role ENUM field
  // role: {
  //   type: DataTypes.ENUM('user', 'admin'),
  //   defaultValue: 'user'
  // },
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
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users', 
  timestamps: true, 
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  indexes: [ // ADDED: Indexes for foreign keys
    { fields: ['role_id'] },
    { fields: ['office_id'] }
  ]
});

async function createAdminUser(){
  try {
    const adminUser = await User.create({
      username: 'admin',
      email: "admin@example.com",
      firstName: 'Admin',
      lastName: 'User',
      password: 'admin_user', // admin_user
      role_id: 1, // Assuming role_id 1 is for Admin
      completeProfile: true // Set to true if admin profile is considered complete
    });

  }
  catch (error) {
    console.error('Error creating admin user:', error);
  }
}

export default User;
export {createAdminUser};

