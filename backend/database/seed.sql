USE citizen_services;

-- Insert initial offices
INSERT INTO Offices (name, description) VALUES 
('CA', 'City Administration'),
('UBND', 'People''s Committee');

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
('approve_request', 'Can approve service requests');

-- Assign permissions to roles
-- Admin permissions
INSERT INTO RolePermissions (role_id, permission_id) VALUES
((SELECT id FROM Roles WHERE name = 'Admin'), (SELECT id FROM Permissions WHERE name = 'manage_users')),
((SELECT id FROM Roles WHERE name = 'Admin'), (SELECT id FROM Permissions WHERE name = 'assign_roles'));

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

-- Insert initial users
-- Admin user (Password: Admin@123)
INSERT INTO users 
(email, username, password, first_name, last_name, is_email_verified, complete_profile, role_id)
VALUES 
('admin@example.com', 'admin', '$2a$10$mFtGfmK9X9qMw.C/x.XXBu0ZDOnG7MCsI1Y5cHb5VEsnJh1JjjQ2i', 'Admin', 'User', 1, true, 
(SELECT id FROM Roles WHERE name = 'Admin'));

-- Regular user (Password: User@123)
INSERT INTO users 
(email, username, password, first_name, last_name, is_email_verified, complete_profile, role_id)
VALUES 
('user@example.com', 'user', '$2a$10$GmQzh0MECSgEKLEKleiNveMCQgw3nJH4573tA0GarYxJV.w6lQk3q', 'Regular', 'User', 1, true,
(SELECT id FROM Roles WHERE name = 'Citizen'));

-- Insert initial services
INSERT INTO services (name, description, status) VALUES
('Medical Checkup', 'Regular health checkup service', 'active'),
('Dental Care', 'Dental health services', 'active'),
('Emergency Care', '24/7 emergency medical services', 'active'),
('Specialist Consultation', 'Consultation with medical specialists', 'active'),
('Laboratory Services', 'Medical testing and laboratory services', 'active');

-- Insert initial service health records
INSERT INTO service_health (service_name, status, response_time, uptime, last_checked) VALUES
('Medical Checkup', 'UP', 150, 99.9, NOW()),
('Dental Care', 'UP', 120, 99.8, NOW()),
('Emergency Care', 'UP', 100, 99.95, NOW()),
('Specialist Consultation', 'UP', 180, 99.7, NOW()),
('Laboratory Services', 'UP', 200, 99.6, NOW());

