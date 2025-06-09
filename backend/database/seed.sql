USE citizen_services;

-- Insert initial offices
INSERT INTO Offices (name, description) VALUES 
('UBND', 'Ủy ban nhân dân thành phố'),
('SYT', "Sở Y tế"),
('BCA', "Bộ Công An");

-- Insert initial roles
INSERT INTO Roles (name, description) VALUES 
('admin', 'Quản trị viên hệ thống với quyền truy cập đầy đủ'),
('citizen', 'Người dùng công dân thông thường'),
('staff', 'Nhân viên có thể xử lý yêu cầu'),
('head', 'Trưởng phòng có thể phê duyệt yêu cầu'),
('police', 'Công an');

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
('verify_user', 'Có thể xác thực người dùng');

-- Assign permissions to roles
-- Admin permissions
INSERT INTO RolePermissions (role_id, permission_id) VALUES
((SELECT id FROM Roles WHERE name = 'admin'), (SELECT id FROM Permissions WHERE name = 'manage_users')),
((SELECT id FROM Roles WHERE name = 'admin'), (SELECT id FROM Permissions WHERE name = 'assign_roles')),
((SELECT id FROM Roles WHERE name = 'admin'), (SELECT id FROM Permissions WHERE name = 'manage_service_health'));

-- Citizen permissions
INSERT INTO RolePermissions (role_id, permission_id) VALUES
((SELECT id FROM Roles WHERE name = 'citizen'), (SELECT id FROM Permissions WHERE name = 'submit_request')),
((SELECT id FROM Roles WHERE name = 'citizen'), (SELECT id FROM Permissions WHERE name = 'view_own_request'));

-- Staff permissions
INSERT INTO RolePermissions (role_id, permission_id) VALUES
((SELECT id FROM Roles WHERE name = 'staff'), (SELECT id FROM Permissions WHERE name = 'process_request')),
((SELECT id FROM Roles WHERE name = 'staff'), (SELECT id FROM Permissions WHERE name = 'view_own_request')),
((SELECT id FROM Roles WHERE name = 'staff'), (SELECT id FROM Permissions WHERE name = 'submit_request'));

-- Head permissions
INSERT INTO RolePermissions (role_id, permission_id) VALUES
((SELECT id FROM Roles WHERE name = 'head'), (SELECT id FROM Permissions WHERE name = 'approve_request')),
((SELECT id FROM Roles WHERE name = 'head'), (SELECT id FROM Permissions WHERE name = 'process_request')),
((SELECT id FROM Roles WHERE name = 'head'), (SELECT id FROM Permissions WHERE name = 'view_own_request')),
((SELECT id FROM Roles WHERE name = 'head'), (SELECT id FROM Permissions WHERE name = 'submit_request'));

-- Police permissions
INSERT INTO RolePermissions (role_id, permission_id) VALUES
((SELECT id FROM Roles WHERE name = 'police'), (SELECT id FROM Permissions WHERE name = 'view_unverified_users')),
((SELECT id FROM Roles WHERE name = 'police'), (SELECT id FROM Permissions WHERE name = 'sign_certificate')),
((SELECT id FROM Roles WHERE name = 'police'), (SELECT id FROM Permissions WHERE name = 'verify_user')),
((SELECT id FROM Roles WHERE name = 'police'), (SELECT id FROM Permissions WHERE name = 'view_own_request'));

-- Insert initial services
INSERT INTO services (name, description, status, office_id, application_url) VALUES
('Khám sức khỏe', 'Dịch vụ khám sức khỏe định kỳ', 'active', 2, NULL),
('Chăm sóc răng miệng', 'Dịch vụ chăm sóc sức khỏe răng miệng', 'active', 2, NULL),
('Cấp cứu', 'Dịch vụ cấp cứu y tế 24/7', 'active', 2, NULL),
('Tư vấn chuyên gia', 'Tư vấn với các chuyên gia y tế', 'active', 2, NULL),
('Dịch vụ xét nghiệm', 'Dịch vụ xét nghiệm và phòng thí nghiệm y tế', 'active', 2, NULL),
('Đăng ký khai sinh', 'Dịch vụ đăng ký khai sinh trực tuyến', 'active', 1, '/ubnd/dang-ky-khai-sinh');

-- Insert initial service health records
INSERT INTO service_health (service_name, status, response_time, uptime, last_checked) VALUES
('Khám sức khỏe', 'UP', 150, 99.9, NOW()),
('Chăm sóc răng miệng', 'UP', 120, 99.8, NOW()),
('Cấp cứu', 'UP', 100, 99.95, NOW()),
('Tư vấn chuyên gia', 'UP', 180, 99.7, NOW()),
('Dịch vụ xét nghiệm', 'UP', 200, 99.6, NOW());

