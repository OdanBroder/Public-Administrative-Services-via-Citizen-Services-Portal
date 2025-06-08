import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import Service from './Service.js'; // Assuming you have a Service model
import Citizen from './Citizen.js'; // Assuming you have a Citizen model
class BirthRegistration extends Model {}
BirthRegistration.init({
  // Primary key
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Reference to applicant in Citizen table
  applicantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    references: {
      model: Citizen,
      key: "id"
    }
  },
  
  // Applicant Information
  applicantName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "applicant_name"
  },
  applicantDob: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: "applicant_dob"
  },
  applicantPhone: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "applicant_phone"
  },
  applicantCccd: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "applicant_cccd"
  },
  applicantCccdIssueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: "applicant_cccd_issue_date"
  },
  applicantCccdIssuePlace: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "applicant_cccd_issue_place"
  },
  applicantAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "applicant_address"
  },
  
  // Birth Registrant Information
  registrantName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "registrant_name"
  },
  registrantGender: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "registrant_gender"
  },
  registrantEthnicity: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "registrant_ethnicity"
  },
  registrantNationality: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "registrant_nationality"
  },
  registrantDob: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: "registrant_dob"
  },
  registrantDobInWords: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "registrant_dob_in_words"
  },
  registrantBirthPlace: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "registrant_birth_place"
  },
  registrantProvince: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "registrant_province"
  },
  registrantHometown: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "registrant_hometown"
  },
  
  // Father Information
  fatherName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "father_name"
  },
  fatherDob: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: "father_dob"
  },
  fatherEthnicity: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "father_ethnicity"
  },
  fatherNationality: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "father_nationality"
  },
  fatherResidenceType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "thường trú",
    field: "father_residence_type"
  },
  fatherAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "father_address"
  },
  
  // Mother Information
  motherName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "mother_name"
  },
  motherDob: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: "mother_dob"
  },
  motherEthnicity: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "mother_ethnicity"
  },
  motherNationality: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "mother_nationality"
  },
  motherResidenceType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "thường trú",
    field: "mother_residence_type"
  },
  motherAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "mother_address"
  },
  
  // Status
  status: {
    type: DataTypes.ENUM('chờ duyệt', "chờ ký", "thành công", "từ chối"),
    allowNull: false,
    defaultValue: "chờ duyệt", // Possible values: viewing (chờ duyệt), processing (chờ ký), completed (thành công), rejected(từ chối)
    field: "status"
  },
  service_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    field: "service_id",
    references: {
      model: Service, // Assuming you have a Services table
      key: "id"
    }
  }
},
{
  sequelize,
  modelName: 'BirthRegistration',
  tableName: 'BirthRegistrations',
  timestamps: true, // Automatically adds createdAt and updatedAt
});

export default BirthRegistration;
