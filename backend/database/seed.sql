USE citizen_services;
SET NAMES 'utf8mb4';

-- Insert initial offices
INSERT INTO Offices (name, description) VALUES 
('UBND', 'Ủy ban nhân dân thành phố'),
('SYT', 'Sở Y tế'),
('BCA', 'Bộ Công An'),
('Birth Certificate Authority', 'Cơ quan đăng ký khai sinh');

-- Insert initial roles
INSERT INTO Roles (name, description) VALUES 
('Admin', 'Quản trị viên hệ thống với quyền truy cập đầy đủ'),
('Citizen', 'Người dùng công dân thông thường'),
('Staff', 'Nhân viên có thể xử lý yêu cầu'),
('Head', 'Trưởng phòng có thể phê duyệt yêu cầu'),
('Police', 'Công an'),
('BCA', 'Nhân viên cơ quan đăng ký khai sinh'),
('SYT', 'Nhân viên sở y tế');

-- Insert initial permissions
INSERT INTO Permissions (name, description) VALUES 
('manage_users', 'Có thể quản lý tài khoản người dùng'),
('assign_roles', 'Có thể phân quyền cho người dùng'),
('submit_request', 'Có thể gửi yêu cầu dịch vụ'),
('view_own_request', 'Có thể xem yêu cầu của bản thân'),
('process_request', 'Có thể xử lý yêu cầu dịch vụ'),
('approve_request', 'Có thể phê duyệt yêu cầu dịch vụ'),
('manage_service_health', 'Có thể quản lý trạng thái dịch vụ'),
('view_unverified_users', 'Có thể xem danh sách người dùng chưa xác thực'),
('sign_certificate', 'Có thể ký chứng chỉ cho người dùng'),
('verify_user', 'Có thể xác thực người dùng'),
('manage_applications', 'Có thể quản lý tất cả các đơn đăng ký'),
('view_bca_applications', 'Có thể xem đơn đăng ký khai sinh'),
('process_bca_applications', 'Có thể xử lý đơn đăng ký khai sinh');

-- Assign permissions to roles
-- Admin permissions
INSERT INTO RolePermissions (role_id, permission_id) VALUES
((SELECT id FROM Roles WHERE name = 'Admin'), (SELECT id FROM Permissions WHERE name = 'manage_users')),
((SELECT id FROM Roles WHERE name = 'Admin'), (SELECT id FROM Permissions WHERE name = 'manage_applications')),
((SELECT id FROM Roles WHERE name = 'Admin'), (SELECT id FROM Permissions WHERE name = 'assign_roles')),
((SELECT id FROM Roles WHERE name = 'Admin'), (SELECT id FROM Permissions WHERE name = 'manage_service_health')),
((SELECT id FROM Roles WHERE name = 'Admin'), (SELECT id FROM Permissions WHERE name = 'process_request')),
((SELECT id FROM Roles WHERE name = 'Admin'), (SELECT id FROM Permissions WHERE name = 'approve_request'));

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

-- Police permissions
INSERT INTO RolePermissions (role_id, permission_id) VALUES
((SELECT id FROM Roles WHERE name = 'Police'), (SELECT id FROM Permissions WHERE name = 'view_unverified_users')),
((SELECT id FROM Roles WHERE name = 'Police'), (SELECT id FROM Permissions WHERE name = 'sign_certificate')),
((SELECT id FROM Roles WHERE name = 'Police'), (SELECT id FROM Permissions WHERE name = 'verify_user')),
((SELECT id FROM Roles WHERE name = 'Police'), (SELECT id FROM Permissions WHERE name = 'view_own_request')),
((SELECT id FROM Roles WHERE name = 'Police'), (SELECT id FROM Permissions WHERE name = 'process_request')),
((SELECT id FROM Roles WHERE name = 'Police'), (SELECT id FROM Permissions WHERE name = 'manage_applications'));

-- BCA permissions
INSERT INTO RolePermissions (role_id, permission_id) VALUES
((SELECT id FROM Roles WHERE name = 'BCA'), (SELECT id FROM Permissions WHERE name = 'view_bca_applications')),
((SELECT id FROM Roles WHERE name = 'BCA'), (SELECT id FROM Permissions WHERE name = 'process_bca_applications')),
((SELECT id FROM Roles WHERE name = 'BCA'), (SELECT id FROM Permissions WHERE name = 'manage_applications')),
((SELECT id FROM Roles WHERE name = 'BCA'), (SELECT id FROM Permissions WHERE name = 'process_request'));

-- SYT permissions
INSERT INTO RolePermissions (role_id, permission_id) VALUES
((SELECT id FROM Roles WHERE name = 'SYT'), (SELECT id FROM Permissions WHERE name = 'manage_applications')),
((SELECT id FROM Roles WHERE name = 'SYT'), (SELECT id FROM Permissions WHERE name = 'process_request')),
((SELECT id FROM Roles WHERE name = 'SYT'), (SELECT id FROM Permissions WHERE name = 'manage_service_health'));

-- Insert initial services
INSERT INTO services (name, description, status, office_id, application_url) VALUES
('Khám sức khỏe', 'Dịch vụ khám sức khỏe định kỳ', 'active', (SELECT id FROM Offices WHERE name = 'SYT'), NULL),
('Chăm sóc răng miệng', 'Dịch vụ chăm sóc sức khỏe răng miệng', 'active', (SELECT id FROM Offices WHERE name = 'SYT'), NULL),
('Cấp cứu', 'Dịch vụ cấp cứu y tế 24/7', 'active', (SELECT id FROM Offices WHERE name = 'SYT'), NULL),
('Tư vấn chuyên gia', 'Tư vấn với các chuyên gia y tế', 'active', (SELECT id FROM Offices WHERE name = 'SYT'), NULL),
('Dịch vụ xét nghiệm', 'Dịch vụ xét nghiệm và phòng thí nghiệm y tế', 'active', (SELECT id FROM Offices WHERE name = 'SYT'), NULL),
('Đăng ký khai sinh', 'Dịch vụ đăng ký khai sinh trực tuyến', 'active', (SELECT id FROM Offices WHERE name = 'Birth Certificate Authority'), '/ubnd/dang-ky-khai-sinh');

-- Insert initial service health records
INSERT INTO service_health (service_id, status, response_time, uptime, last_checked) VALUES
(1, 'UP', 150, 99.9, NOW()),
(2, 'UP', 120, 99.8, NOW()),
(3, 'UP', 100, 99.95, NOW()),
(3, 'UP', 180, 99.7, NOW()),
(3, 'UP', 200, 99.6, NOW());

