import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

class Citizen extends Model {}

Citizen.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'id',
    primaryKey: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  hoVaTen: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "ho_va_ten"
  },
  soCCCD: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: "so_cccd"
  },
  hinhAnhCCCDTruoc: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "hinh_anh_cccd_truoc"
  },
  hinhAnhCCCDSau: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "hinh_anh_cccd_sau"
  },
  noiCapCCCD: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "noi_cap_cccd"
  },
  ngayCapCCCD: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: "ngay_cap_cccd"
  },
  ngaySinh: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: "ngay_sinh"
  },
  gioiTinh: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "gioi_tinh"
  },
  queQuan: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "que_quan"
  },
  noiThuongTru: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "noi_thuong_tru"
  }
}, {
  sequelize,
  modelName: 'Citizen',
  tableName: 'citizens',
  timestamps: true
});

export default Citizen;
