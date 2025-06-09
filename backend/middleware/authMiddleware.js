import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import BlacklistedToken from '../models/BlacklistedToken.js';
import { User, Role, Office, Permission } from '../models/Association.js';
import { Model } from 'sequelize';

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
    
    // Check if token is blacklisted
    const blacklisted = await BlacklistedToken.findOne({ 
      where: { token: token } 
    });
    
    if (blacklisted) {
      return res.status(401).json({ 
        success: false,
        message: 'Token không hợp lệ (đã bị chặn)' 
      });
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
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
      if(error instanceof jwt.TokenExpiredError)
        return res.status(401).json({ 
          success: false,
          message: 'Token đã hết hạn' 
        });
      if(error instanceof jwt.JsonWebTokenError)
        return res.status(401).json({ 
          success: false,
          message: 'Token không hợp lệ' 
        });
      return res.status(401).json({ 
        success: false,
        message: 'Xác thực thất bại' 
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

// Specific role middleware
const verifyAdmin = verifyRole('Admin');
const verifyBCA = verifyRole('BCA');
const verifySYT = verifyRole('SYT');
const verifyPolice = verifyRole('Police');
const verifyCitizen = verifyRole('Citizen');

// Permission checking middleware
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'Yêu cầu xác thực' 
        });
      }

      const permissions = Array.isArray(requiredPermission) 
        ? requiredPermission 
        : [requiredPermission];

      const hasPermission = permissions.some(permission => 
        req.user.permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false,
          message: 'Không có quyền thực hiện hành động này',
          required: permissions,
          current: req.user.permissions
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi khi kiểm tra quyền',
        error: error.message 
      });
    }
  };
};

// Advanced authorization middleware with office scope
const authorize = (requiredPermission, options = {}) => {
  const { checkOfficeScope = false, targetOfficeName } = options;

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'Yêu cầu xác thực' 
        });
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

      // Check permissions
      const permissions = Array.isArray(requiredPermission) 
        ? requiredPermission 
        : [requiredPermission];

      const userPermissions = user.role.permissions.map(p => p.name);
      const hasPermission = permissions.some(p => userPermissions.includes(p));

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false,
          message: 'Không có quyền thực hiện hành động này' 
        });
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

export {
  authenticate,
  verifyRole,
  verifyAdmin,
  verifyBCA,
  verifySYT,
  verifyPolice,
  verifyCitizen,
  checkPermission,
  authorize
};