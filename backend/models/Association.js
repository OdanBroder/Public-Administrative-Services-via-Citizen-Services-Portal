import User from "./User.js";
import Office from "./Office.js";
import Role from "./Role.js";
import Permission from "./Permission.js";
import RolePermission from "./RolePermission.js";
import Service from "./Service.js";
import Application from "./Application.js";
import FilePath from "./FilePath.js";
// console.log("Associations.js loaded");
// console.log("User associations:", User.associations);
// console.log("Office associations:", Office.associations);
// console.log("Role associations:", Role.associations);
// console.log("Permission associations:", Permission.associations);
// // Define Associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' }); // User belongs to one Role
User.belongsTo(Office, { foreignKey: 'office_id', as: 'office' });

Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
Office.hasMany(User, { foreignKey: 'office_id', as: 'users' });

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', as: "permissions" });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', as: "roles" });

Office.hasMany(Service, { foreignKey: 'office_id', as: 'services' });
Service.belongsTo(Office, { foreignKey: 'office_id', as: 'office' });
// console.log("User associations:", User.associations);
// console.log("Office associations:", Office.associations);
// console.log("Role associations:", Role.associations);
// console.log("Permission associations:", Permission.associations);

// Add association between Application and FilePath
Application.hasOne(FilePath, { 
  foreignKey: 'user_id',
  sourceKey: 'user_id',
  as: 'filePath'
});

FilePath.belongsTo(Application, {
  foreignKey: 'user_id',
  targetKey: 'user_id',
  as: 'application'
});

export {
  User,
  Office,
  Role,
  Permission,
  RolePermission,
  Service,
  Application,
  FilePath
};
