import User from '../models/User.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';

// List all users with basic information
export const listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'role_id'],
      include: [{
        model: Role,
        attributes: ['name', 'description'],
        as: 'role'
      }]
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
      role: {
        id: user.role_id,
        name: user.role ? user.role.name : 'Không có vai trò',
        description: user.role ? user.role.description : null
      }
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách người dùng' });
  }
};

// Update user's role
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleName } = req.body;

    if (!roleName) {
      return res.status(400).json({ error: 'Tên vai trò là bắt buộc' });
    }

    const { role, permissions } = await User.assignRoleAndPermissions(userId, roleName);

    res.json({
      message: 'Cập nhật vai trò thành công',
      role,
      permissions
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật vai trò người dùng' });
  }
};

// List all roles
export const listRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [{
        model: Permission,
        through: RolePermission,
        attributes: ['name']
      }]
    });

    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.Permissions.map(p => p.name)
    }));

    res.json(formattedRoles);
  } catch (error) {
    console.error('Error listing roles:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách vai trò' });
  }
};

// Create new role
export const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tên vai trò là bắt buộc' });
    }

    const role = await Role.create({
      name,
      description
    });

    if (permissions && permissions.length > 0) {
      // Add permissions to role
      const permissionRecords = await Permission.findAll({
        where: { name: permissions }
      });

      await role.addPermissions(permissionRecords);
    }

    res.status(201).json({
      message: 'Tạo vai trò thành công',
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions
      }
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Lỗi khi tạo vai trò mới' });
  }
};

// Update role permissions
export const updateRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Danh sách quyền không hợp lệ' });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Không tìm thấy vai trò' });
    }

    // Get permission records
    const permissionRecords = await Permission.findAll({
      where: { name: permissions }
    });

    // Update role permissions
    await role.setPermissions(permissionRecords);

    res.json({
      message: 'Cập nhật quyền thành công',
      role: {
        id: role.id,
        name: role.name,
        permissions: permissions
      }
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật quyền của vai trò' });
  }
};

// List all permissions
export const listPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      attributes: ['id', 'name', 'description']
    });

    res.json(permissions);
  } catch (error) {
    console.error('Error listing permissions:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách quyền' });
  }
};

// Create new permission
export const createPermission = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tên quyền là bắt buộc' });
    }

    const permission = await Permission.create({
      name,
      description
    });

    res.status(201).json({
      message: 'Tạo quyền thành công',
      permission
    });
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({ error: 'Lỗi khi tạo quyền mới' });
  }
}; 