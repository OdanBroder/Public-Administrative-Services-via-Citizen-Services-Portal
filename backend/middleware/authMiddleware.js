import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import BlacklistedToken from '../models/BlacklistedToken.js';
import { User, Role, Office, Permission } from '../models/Association.js';

// Core token verification function
const verifyToken = async (token) => {
  try {
    // Check if token is blacklisted
    const blacklisted = await BlacklistedToken.findOne({ 
      where: { token: token } 
    });
    
    if (blacklisted) {
      throw new Error('Token không hợp lệ (đã bị chặn)');
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token đã hết hạn');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token không hợp lệ');
    }
    throw error;
  }
};

// Main authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Không tìm thấy token xác thực' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = await verifyToken(token);
      
      // Find user with role and permissions
      const user = await User.findOne({
        where: { id: decoded.userId },
        include: [{
          model: Role,
          as: 'role',
          include: [{
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          }]
        }]
      });
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: 'Người dùng không tồn tại' 
        });
      }

      // Attach user info to request
      req.user = {
        id: user.id,
        userId: user.id,
        role: user.role.name,
        permissions: user.role.permissions.map(p => p.name)
      };
      req.token = token;
      next();
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        message: error.message 
      });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi máy chủ',
      error: error.message 
    });
  }
};

// Role verification middleware
const verifyRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Yêu cầu xác thực'
        });
      }

      const userRole = req.user.role;
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Không có quyền truy cập. Chỉ ${roles.join(', ')} mới có thể truy cập tính năng này.`
        });
      }

      next();
    } catch (error) {
      console.error('Role verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ',
        error: error.message
      });
    }
  };
};

// Comprehensive authorization middleware with permission and office scope checking
const authorize = (requiredPermission, options = {}) => {
  const { checkOfficeScope = false, targetOfficeName, requiredRoles = null } = options;

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'Yêu cầu xác thực' 
        });
      }

      // Check role if specified
      if (requiredRoles) {
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        if (!roles.includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            message: `Không có quyền truy cập. Chỉ ${roles.join(', ')} mới có thể truy cập tính năng này.`
          });
        }
      }

      // Find user with role, permissions and office
      const user = await User.findOne({
        where: { id: req.user.id },
        include: [
          {
            model: Role,
            as: 'role',
            include: [{
              model: Permission,
              as: 'permissions',
              through: { attributes: [] }
            }]
          },
          {
            model: Office,
            as: 'office'
          }
        ]
      });

      if (!user || !user.role) {
        return res.status(403).json({ 
          success: false,
          message: 'Không tìm thấy vai trò người dùng' 
        });
      }

      // Check permissions if specified
      if (requiredPermission) {
        const permissions = Array.isArray(requiredPermission) 
          ? requiredPermission 
          : [requiredPermission];

        const userPermissions = user.role.permissions.map(p => p.name);
        const hasPermission = permissions.some(p => userPermissions.includes(p));

        if (!hasPermission) {
          return res.status(403).json({ 
            success: false,
            message: 'Không có quyền thực hiện hành động này',
            required: permissions,
            current: userPermissions
          });
        }
      }

      // Check office scope if required
      if (checkOfficeScope && (user.role.name === 'Staff' || user.role.name === 'Head')) {
        const targetOffice = await Office.findOne({ 
          where: { name: targetOfficeName } 
        });

        if (!targetOffice) {
          return res.status(400).json({ 
            success: false,
            message: 'Không tìm thấy thông tin phòng ban' 
          });
        }

        if (!user.office_id || user.office_id !== targetOffice.id) {
          return res.status(403).json({
            success: false,
            message: `Bạn chỉ có thể ${requiredPermission} các yêu cầu thuộc phòng ban của mình`
          });
        }
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi máy chủ trong quá trình xác thực',
        error: error.message 
      });
    }
  };
};

// Role constants for convenience
const ROLES = {
  ADMIN: 'Admin',
  BCA: 'BCA',
  SYT: 'SYT',
  POLICE: 'Police',
  CITIZEN: 'Citizen'
};

export {
  authenticate,
  verifyToken,
  verifyRole,
  authorize,
  ROLES
};