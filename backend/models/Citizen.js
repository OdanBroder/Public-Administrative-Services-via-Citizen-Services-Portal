import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Citizen = sequelize.define("Citizen", {
  id: {
    type: DataTypes.UUID,
    allowNull: false,
    field:'id',
    primaryKey: true
  },
  hoVaTen: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "ho_va_ten", // Column name in Vietnamese style if preferred, or camelCase
  },
  soCCCD: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: "so_cccd",
  },
  hinhAnhCCCDTruoc: {
    type: DataTypes.STRING, // Store the path to the front image
    allowNull: false,
    field: "hinh_anh_cccd_truoc",
  },
  hinhAnhCCCDSau: {
    type: DataTypes.STRING, // Store the path to the back image
    allowNull: false,
    field: "hinh_anh_cccd_sau",
  },
  noiCapCCCD: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "noi_cap_cccd",
  },
  ngayCapCCCD: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: "ngay_cap_cccd",
  },
  ngaySinh: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: "ngay_sinh",
  },
  gioiTinh: {
    type: DataTypes.STRING, // Consider ENUM('Nam', 'Nữ', 'Khác') if applicable
    allowNull: false,
    field: "gioi_tinh",
  },
  queQuan: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "que_quan",
  },
  noiThuongTru: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "noi_thuong_tru",
  },
}, {
  tableName: 'citizens',
  timestamps: true
});

export default Citizen;
