import User from './User.js';
import MedicalCoverage from './MedicalCoverage.js';

// Define User - MedicalCoverage association
User.hasMany(MedicalCoverage, {
  foreignKey: 'citizenId',
  as: 'medicalCoverages'
});

MedicalCoverage.belongsTo(User, {
  foreignKey: 'citizenId',
  as: 'user'
});

export { User, MedicalCoverage }; 