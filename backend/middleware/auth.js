import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import BlacklistedToken from '../models/BlacklistedToken.js';
import { User, Role, Office, Permission } from '../models/Association.js'; // Adjust the import path as necessary

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const blacklisted = await BlacklistedToken.findOne({ where: { token: token } });
    if (blacklisted) {
      return res.status(401).json({ error: 'Token is not valid (blacklisted)' });
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
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
        throw new Error('User not found');
      }

      // Attach user info to request
      req.user = {
        userId: user.id,
        role: user.role.name,
        permissions: user.role.permissions.map(p => p.name)
      };
      req.token = token;
      next();
    } catch (error) {
      if(error instanceof jwt.TokenExpiredError)
        return res.status(401).json({ error: 'Token is not valid (expired)' });
      if(error instanceof jwt.JsonWebTokenError)
        return res.status(401).json({ error: 'Token is not valid' });
      return res.status(401).json({ error: 'Authentication failed' });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: `Server Error: ${error.message}` });
  }
};


const authorize = (requiredPermission, options = {}) => {
  const { checkOfficeScope = false, targetOfficeName } = options;

  if (checkOfficeScope && typeof targetOfficeName !== "string") {
    throw new Error("getTargetOfficeId function is required when checkOfficeScope is true.");
  }

  return async (req, res, next) => {
    try {
      // 1. Get User ID from previous authentication middleware (e.g., JWT)
      const userId = req.user?.userId; // Adjust based on how your auth middleware attaches user info
      if (!userId) {
        return res.status(401).json({ error: "Authentication required." });
      }
      console.log("Role accsociations:", Role.associations);
      // 2. Fetch User with Role, Permissions, and Office
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Role,
            as: "role",
            include: [
              {
                model: Permission,
                as: "permissions", // This alias depends on how you defined it in RolePermission.js
                through: { attributes: [] }, // Don't include join table attributes
              },
            ],
          },
          {
            model: Office,
            as: "office", // Include the user's assigned office
          },
        ],
      });

      if (!user || !user.role) {
        return res.status(403).json({ error: "Forbidden: User role not found." });
      }

      // 3. Check Permissions
      const userPermissions = user.role.permissions.map((p) => p.name);
      const hasPermission = Array.isArray(requiredPermission)
        ? requiredPermission.every((p) => userPermissions.includes(p))
        : userPermissions.includes(requiredPermission);

      if (!hasPermission) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions." });
      }

      // 4. Check Office Scope (if required)
      if (checkOfficeScope && (user.role.name === "Staff" || user.role.name === "Head")) {
        const targetOfficeId = await Office.getOfficeId(targetOfficeName);
        if (targetOfficeId == null) {
            console.warn("Could not determine target office ID for scope check.");
            return res.status(400).json({ error: "Bad Request: Target office information missing." });
        }

        if (!user.office_id || user.office_id !== targetOfficeId) {
          return res.status(403).json({
            error: `Forbidden: You can only ${requiredPermission} requests for your assigned office.`,
          });
        }
      }
      res.role = user.role.name; // Attach role to response for further use if needed
      // 5. Access Granted
      next();
    } catch (error) {
      console.error("RBAC Authorization Error:", error);
      res.status(500).json({ error: "Internal Server Error during authorization." });
    }
  };
};

export {authorize,authenticate};
 