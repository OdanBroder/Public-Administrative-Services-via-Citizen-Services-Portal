import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

class FilePath extends Model {}

FilePath.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    private_key: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null
    },
    public_key: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null
    },
    csr: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null
    },
    certificate: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null
    }
}, {
    sequelize,
    modelName: 'FilePath',
    tableName: 'file_path',
    timestamps: true,
    indexes: [
        {
            name: 'idx_file_path',
            fields: ['id']
        }
    ]
});

// Define association
FilePath.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

export default FilePath;
