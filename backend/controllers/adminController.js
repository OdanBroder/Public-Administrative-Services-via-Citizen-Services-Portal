import User from '../models/User.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import BirthRegistration from '../models/BirthRegistration.js';
import MedicalCoverage from '../models/MedicalCoverage.js';
import ServiceHealth from '../models/ServiceHealth.js';
import AuditLog from '../models/AuditLog.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

// User Management
export const listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{
        model: Role,
        attributes: ['name']
      }],
      attributes: { exclude: ['password'] }
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách người dùng thành công",
      data: users
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, {
      include: [{
        model: Role,
        attributes: ['name']
      }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin người dùng thành công",
      data: user
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vai trò"
      });
    }

    await user.update({ role_id: roleId });

    // Log the action
    await AuditLog.create({
      user_id: req.user.id,
      action: 'update_user_role',
      details: `Updated role for user ${userId} to ${roleId}`,
      ip_address: req.ip
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật vai trò người dùng thành công"
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật vai trò người dùng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    await user.update({ is_active: false });

    // Log the action
    await AuditLog.create({
      user_id: req.user.id,
      action: 'deactivate_user',
      details: `Deactivated user ${userId}`,
      ip_address: req.ip
    });

    return res.status(200).json({
      success: true,
      message: "Vô hiệu hóa người dùng thành công"
    });
  } catch (error) {
    console.error("Lỗi khi vô hiệu hóa người dùng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const activateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    await user.update({ is_active: true });

    // Log the action
    await AuditLog.create({
      user_id: req.user.id,
      action: 'activate_user',
      details: `Activated user ${userId}`,
      ip_address: req.ip
    });

    return res.status(200).json({
      success: true,
      message: "Kích hoạt người dùng thành công"
    });
  } catch (error) {
    console.error("Lỗi khi kích hoạt người dùng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    // Log the action
    await AuditLog.create({
      user_id: req.user.id,
      action: 'reset_user_password',
      details: `Reset password for user ${userId}`,
      ip_address: req.ip
    });

    return res.status(200).json({
      success: true,
      message: "Đặt lại mật khẩu thành công"
    });
  } catch (error) {
    console.error("Lỗi khi đặt lại mật khẩu:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Role Management
export const listRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [{
        model: Permission,
        through: RolePermission
      }]
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách vai trò thành công",
      data: roles
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách vai trò:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;
    const role = await Role.findByPk(roleId, {
      include: [{
        model: Permission,
        through: RolePermission
      }]
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vai trò"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin vai trò thành công",
      data: role
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin vai trò:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const role = await Role.create({
      name,
      description
    });

    if (permissions && permissions.length > 0) {
      await role.setPermissions(permissions);
    }

    // Log the action
    await AuditLog.create({
      user_id: req.user.id,
      action: 'create_role',
      details: `Created role ${name}`,
      ip_address: req.ip
    });

    return res.status(201).json({
      success: true,
      message: "Tạo vai trò thành công",
      data: role
    });
  } catch (error) {
    console.error("Lỗi khi tạo vai trò:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description } = req.body;

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vai trò"
      });
    }

    await role.update({
      name,
      description
    });

    // Log the action
    await AuditLog.create({
      user_id: req.user.id,
      action: 'update_role',
      details: `Updated role ${roleId}`,
      ip_address: req.ip
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật vai trò thành công"
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật vai trò:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const role = await Role.findByPk(roleId);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vai trò"
      });
    }

    await role.destroy();

    // Log the action
    await AuditLog.create({
      user_id: req.user.id,
      action: 'delete_role',
      details: `Deleted role ${roleId}`,
      ip_address: req.ip
    });

    return res.status(200).json({
      success: true,
      message: "Xóa vai trò thành công"
    });
  } catch (error) {
    console.error("Lỗi khi xóa vai trò:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const updateRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vai trò"
      });
    }

    await role.setPermissions(permissions);

    // Log the action
    await AuditLog.create({
      user_id: req.user.id,
      action: 'update_role_permissions',
      details: `Updated permissions for role ${roleId}`,
      ip_address: req.ip
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật quyền vai trò thành công"
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật quyền vai trò:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Permission Management
export const listPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll();

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách quyền thành công",
      data: permissions
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách quyền:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const getPermissionById = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const permission = await Permission.findByPk(permissionId);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy quyền"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin quyền thành công",
      data: permission
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin quyền:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const createPermission = async (req, res) => {
  try {
    const { name, description } = req.body;

    const permission = await Permission.create({
      name,
      description
    });

    // Log the action
    await AuditLog.create({
      user_id: req.user.id,
      action: 'create_permission',
      details: `Created permission ${name}`,
      ip_address: req.ip
    });

    return res.status(201).json({
      success: true,
      message: "Tạo quyền thành công",
      data: permission
    });
  } catch (error) {
    console.error("Lỗi khi tạo quyền:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const updatePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { name, description } = req.body;

    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy quyền"
      });
    }

    await permission.update({
      name,
      description
    });

    // Log the action
    await AuditLog.create({
      user_id: req.user.id,
      action: 'update_permission',
      details: `Updated permission ${permissionId}`,
      ip_address: req.ip
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật quyền thành công"
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật quyền:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const deletePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const permission = await Permission.findByPk(permissionId);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy quyền"
      });
    }

    await permission.destroy();

    // Log the action
    await AuditLog.create({
      user_id: req.user.id,
      action: 'delete_permission',
      details: `Deleted permission ${permissionId}`,
      ip_address: req.ip
    });

    return res.status(200).json({
      success: true,
      message: "Xóa quyền thành công"
    });
  } catch (error) {
    console.error("Lỗi khi xóa quyền:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Application Management
export const listAllApplications = async (req, res) => {
  try {
    const birthRegistrations = await BirthRegistration.findAll({
      include: [{
        model: User,
        as: 'applicant',
        attributes: ['id', 'username', 'email', 'first_name', 'last_name']
      }]
    });

    const medicalCoverages = await MedicalCoverage.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'first_name', 'last_name']
      }]
    });

    const serviceHealths = await ServiceHealth.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'first_name', 'last_name']
      }]
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách đơn thành công",
      data: {
        birthRegistrations,
        medicalCoverages,
        serviceHealths
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { type } = req.query;

    let application;
    switch (type) {
      case 'birth':
        application = await BirthRegistration.findByPk(applicationId, {
          include: [{
            model: User,
            as: 'applicant',
            attributes: ['id', 'username', 'email', 'first_name', 'last_name']
          }]
        });
        break;
      case 'medical':
        application = await MedicalCoverage.findByPk(applicationId, {
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'first_name', 'last_name']
          }]
        });
        break;
      case 'health':
        application = await ServiceHealth.findByPk(applicationId, {
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'first_name', 'last_name']
          }]
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Loại đơn không hợp lệ"
        });
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin đơn thành công",
      data: application
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { type, status, reason } = req.body;

    let application;
    switch (type) {
      case 'birth':
        application = await BirthRegistration.findByPk(applicationId);
        break;
      case 'medical':
        application = await MedicalCoverage.findByPk(applicationId);
        break;
      case 'health':
        application = await ServiceHealth.findByPk(applicationId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Loại đơn không hợp lệ"
        });
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn"
      });
    }

    await application.update({
      status,
      processed_by: req.user.id,
      processed_at: new Date(),
      rejection_reason: status === 'rejected' ? reason : null
    });

    // Log the action
    await AuditLog.create({
      user_id: req.user.id,
      action: 'update_application_status',
      details: `Updated ${type} application ${applicationId} status to ${status}`,
      ip_address: req.ip
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái đơn thành công"
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Statistics & Reports
export const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });
    const totalRoles = await Role.count();
    const totalPermissions = await Permission.count();

    return res.status(200).json({
      success: true,
      message: "Lấy thống kê hệ thống thành công",
      data: {
        totalUsers,
        activeUsers,
        totalRoles,
        totalPermissions
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê hệ thống:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const getApplicationStats = async (req, res) => {
  try {
    const birthStats = await BirthRegistration.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const medicalStats = await MedicalCoverage.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const healthStats = await ServiceHealth.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    return res.status(200).json({
      success: true,
      message: "Lấy thống kê đơn thành công",
      data: {
        birthRegistrations: birthStats,
        medicalCoverages: medicalStats,
        serviceHealths: healthStats
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê đơn:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const userStats = await User.findAll({
      attributes: [
        'role_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      include: [{
        model: Role,
        attributes: ['name']
      }],
      group: ['role_id', 'Role.id', 'Role.name']
    });

    return res.status(200).json({
      success: true,
      message: "Lấy thống kê người dùng thành công",
      data: userStats
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê người dùng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

// Audit Logs
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, action, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (action) where.action = action;
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [startDate, endDate]
      };
    }

    const logs = await AuditLog.findAndCountAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'username', 'email']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      message: "Lấy nhật ký kiểm toán thành công",
      data: {
        logs: logs.rows,
        total: logs.count,
        page: parseInt(page),
        totalPages: Math.ceil(logs.count / limit)
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy nhật ký kiểm toán:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
};

export const getAuditLogById = async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await AuditLog.findByPk(logId, {
      include: [{
        model: User,
        attributes: ['id', 'username', 'email']
      }]
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhật ký kiểm toán"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin nhật ký kiểm toán thành công",
      data: log
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin nhật ký kiểm toán:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message
    });
  }
}; 