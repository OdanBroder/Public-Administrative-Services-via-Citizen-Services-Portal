USE citizen_services;

-- Insert initial offices
INSERT INTO Offices (name, description) VALUES 
('UBND', 'Ủy ban nhân dân thành phố'),
('SYT', "Sở Y tế");

-- Insert initial roles
INSERT INTO Roles (name, description) VALUES 
('Admin', 'System administrator with full access'),
('Citizen', 'Regular citizen user'),
('Staff', 'Staff member who can process requests'),
('Head', 'Department head who can approve requests');

-- Insert initial permissions
INSERT INTO Permissions (name, description) VALUES 
('manage_users', 'Can manage user accounts'),
('assign_roles', 'Can assign roles to users'),
('submit_request', 'Can submit service requests'),
('view_own_request', 'Can view their own requests'),
('process_request', 'Can process service requests'),
('approve_request', 'Can approve service requests'),
('manage_service_health', 'Can manage service health records');
-- Assign permissions to roles
-- Admin permissions
INSERT INTO RolePermissions (role_id, permission_id) VALUES
((SELECT id FROM Roles WHERE name = 'Admin'), (SELECT id FROM Permissions WHERE name = 'manage_users')),
((SELECT id FROM Roles WHERE name = 'Admin'), (SELECT id FROM Permissions WHERE name = 'assign_roles')),
((SELECT id FROM Roles WHERE name = 'Admin'), (SELECT id FROM Permissions WHERE name = 'manage_service_health'));

-- Citizen permissions
INSERT INTO RolePermissions (role_id, permission_id) VALUES
((SELECT id FROM Roles WHERE name = 'Citizen'), (SELECT id FROM Permissions WHERE name = 'submit_request')),
((SELECT id FROM Roles WHERE name = 'Citizen'), (SELECT id FROM Permissions WHERE name = 'view_own_request'));

-- Staff permissions
INSERT INTO RolePermissions (role_id, permission_id) VALUES
((SELECT id FROM Roles WHERE name = 'Staff'), (SELECT id FROM Permissions WHERE name = 'process_request')),
((SELECT id FROM Roles WHERE name = 'Staff'), (SELECT id FROM Permissions WHERE name = 'view_own_request')),
((SELECT id FROM Roles WHERE name = 'Staff'), (SELECT id FROM Permissions WHERE name = 'submit_request'));

-- Head permissions
INSERT INTO RolePermissions (role_id, permission_id) VALUES
((SELECT id FROM Roles WHERE name = 'Head'), (SELECT id FROM Permissions WHERE name = 'approve_request')),
((SELECT id FROM Roles WHERE name = 'Head'), (SELECT id FROM Permissions WHERE name = 'process_request')),
((SELECT id FROM Roles WHERE name = 'Head'), (SELECT id FROM Permissions WHERE name = 'view_own_request')),
((SELECT id FROM Roles WHERE name = 'Head'), (SELECT id FROM Permissions WHERE name = 'submit_request'));

-- Insert initial services
INSERT INTO services (name, description, status, office_id, application_url) VALUES
('Medical Checkup', 'Regular health checkup service', 'active', 2, NULL),
('Dental Care', 'Dental health services', 'active', 2, NULL),
('Emergency Care', '24/7 emergency medical services', 'active', 2, NULL),
('Specialist Consultation', 'Consultation with medical specialists', 'active', 2, NULL),
('Laboratory Services', 'Medical testing and laboratory services', 'active', 2, NULL),
('Birth certificate registration', '[People committee] Apply for birth certificate registration online service', 'active', 1, '/ubnd/dang-ky-khai-sinh');

-- Insert initial service health records
INSERT INTO service_health (service_name, status, response_time, uptime, last_checked) VALUES
('Medical Checkup', 'UP', 150, 99.9, NOW()),
('Dental Care', 'UP', 120, 99.8, NOW()),
('Emergency Care', 'UP', 100, 99.95, NOW()),
('Specialist Consultation', 'UP', 180, 99.7, NOW()),
('Laboratory Services', 'UP', 200, 99.6, NOW());

