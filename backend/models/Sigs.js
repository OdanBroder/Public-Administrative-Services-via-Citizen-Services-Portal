// for storing UUID -> signature, ensuring randomness of url
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import BirthRegistration from './BirthRegistration.js';
class Sigs extends Model {};

Sigs.init({
  UUID: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    index: true,
  },
  birth_registration_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: BirthRegistration, // Assuming you have a BirthRegistration model
      key: 'id'
    },
    index: true
  },
  type: {
    type: DataTypes.ENUM("requester", "issuer"),
    allowNull: false,
    defaultValue: "requester",
  },
  path: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Path to the signature file',
  },
},{
  sequelize,
  modelName: 'Sigs',
  tableName: 'sigs',
  timestamps: true,
})

Sigs.belongsTo(BirthRegistration, {
  foreignKey: 'birth_registration_id',
  as: 'birthRegistration'
});

export default Sigs;