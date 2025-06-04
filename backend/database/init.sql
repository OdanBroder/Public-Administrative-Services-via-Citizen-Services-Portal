-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS citizen_services;

-- Use the database
USE citizen_services;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_email_verified TINYINT(1) NOT NULL DEFAULT 0,
    is_qr_enabled TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    refreshToken VARCHAR(255),
    resetToken VARCHAR(255),
    resetTokenExpiry DATETIME,
    complete_profile BOOLEAN DEFAULT false,
    PRIMARY KEY (id),
    UNIQUE KEY idx_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_users_created_at ON users (created_at);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    service_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Create medical_coverage table
CREATE TABLE IF NOT EXISTS medical_coverage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id VARCHAR(255) NOT NULL,
    coverage_type ENUM('BASIC', 'STANDARD', 'PREMIUM') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_premium DECIMAL(10, 2) NOT NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_citizen_id (citizen_id),
    INDEX idx_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Create service_health table
CREATE TABLE IF NOT EXISTS service_health (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    status ENUM('UP', 'DOWN', 'DEGRADED') NOT NULL,
    response_time INT NOT NULL,
    last_checked TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    uptime DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_service_name (service_name),
    INDEX idx_status (status),
    INDEX idx_last_checked (last_checked)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Create user_qr table
CREATE TABLE IF NOT EXISTS user_qr (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    secret_key VARCHAR(255) NOT NULL,
    backup_codes TEXT,
    recovery_email VARCHAR(255),
    phone_number VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_user_id (user_id),
    CONSTRAINT fk_user_qr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Create login_sessions table
CREATE TABLE IF NOT EXISTS login_sessions (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_qr_verified TINYINT(1) NOT NULL DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_session_token (session_token),
    KEY idx_login_sessions_expires_at (expires_at),
    CONSTRAINT fk_login_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_token (token),
    KEY idx_user_id (user_id),
    KEY idx_password_reset_expires (expires_at),
    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Create email_verification_tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_token (token),
    KEY idx_user_id (user_id),
    CONSTRAINT fk_email_verification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Create login_attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
    id INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    was_successful TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_email (email),
    KEY idx_ip_address (ip_address),
    KEY idx_attempted_at (attempted_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jwt_blacklist (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- Store the full token string that needs to be invalidated.
    -- Using TEXT allows for variable length tokens without strict limits.
    token TEXT NOT NULL,
    -- Store the expiration timestamp of the token (extracted from the token payload).
    -- This allows for efficient cleanup of old entries.
    expires_at TIMESTAMP NOT NULL,
    -- Timestamp when the token was added to the blacklist.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Index on the token for fast lookups during authentication checks.
    -- Indexing a prefix of TEXT columns is common for performance. 255 is usually a safe prefix length.
    INDEX idx_token (token(255)),

    -- Index on expires_at for efficient cleanup of expired tokens.
    INDEX idx_expires_at (expires_at)
);

-- This event runs daily to remove expired tokens from the blacklist.
CREATE EVENT cleanup_jwt_blacklist
ON SCHEDULE EVERY 1 DAY
DO
  DELETE FROM jwt_blacklist WHERE expires_at < NOW();


  -- 1. Offices/Departments Table
-- Stores information about the different organizational units.
CREATE TABLE IF NOT EXISTS Offices (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Name of the office/department, e.g., City Public Security',
    description TEXT NULL COMMENT 'Optional description of the office',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Roles Table
-- Stores the defined roles in the system.
CREATE TABLE IF NOT EXISTS Roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Role name, e.g., Admin, Citizen, Staff, Head',
    description TEXT NULL COMMENT 'Optional description of the role',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Permissions Table
-- Stores the defined permissions (actions) in the system.
CREATE TABLE IF NOT EXISTS Permissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Permission name (action), e.g., manage_users, process_request',
    description TEXT NULL COMMENT 'Optional description of the permission',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. RolePermissions Table (Many-to-Many Join Table)
-- Maps which permissions are granted to which roles.
CREATE TABLE IF NOT EXISTS RolePermissions (
    role_id INT UNSIGNED NOT NULL,
    permission_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES Permissions(id) ON DELETE CASCADE
);
-- Modify users table to include role and office references
-- Have to do this after creating the Roles and Offices tables
ALTER TABLE users
ADD COLUMN role_id INT UNSIGNED DEFAULT 2 COMMENT 'Foreign key linking to the Roles table',
ADD COLUMN office_id INT UNSIGNED NULL COMMENT 'Foreign key linking to the Offices table (relevant for Staff/Head roles)',
ADD CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE SET NULL, -- Or restrict deletion if a user must have a role
ADD CONSTRAINT fk_user_office FOREIGN KEY (office_id) REFERENCES Offices(id) ON DELETE SET NULL; -- Or restrict deletion

ALTER TABLE users
ADD INDEX idx_user_role (role_id),
ADD INDEX idx_user_office (office_id);

INSERT INTO Offices (name) VALUES (
    'CA'),
    ('UBND');

-- Insert Roles
INSERT INTO Roles (name) VALUES 
    ("Admin"), 
    ("Citizen"), 
    ("Staff"), 
    ("Head");

-- Insert Permissions
INSERT INTO Permissions (name) VALUES 
    ("manage_users"), 
    ("assign_roles"), 
    ("submit_request"), 
    ("view_own_request"), 
    ("process_request"), -- Staff permission
    ("approve_request"); -- Head permission

-- Assign Permissions to Roles (Example)
-- Admin
INSERT INTO RolePermissions (role_id, permission_id) VALUES
    ((SELECT id FROM Roles WHERE name = 'Admin'), (SELECT id FROM Permissions WHERE name = 'manage_users')),
    ((SELECT id FROM Roles WHERE name = 'Admin'), (SELECT id FROM Permissions WHERE name = 'assign_roles'));

-- Citizen
INSERT INTO RolePermissions (role_id, permission_id) VALUES
    ((SELECT id FROM Roles WHERE name = 'Citizen'), (SELECT id FROM Permissions WHERE name = 'submit_request')),
    ((SELECT id FROM Roles WHERE name = 'Citizen'), (SELECT id FROM Permissions WHERE name = 'view_own_request'));

-- Staff
INSERT INTO RolePermissions (role_id, permission_id) VALUES
    ((SELECT id FROM Roles WHERE name = 'Staff'), (SELECT id FROM Permissions WHERE name = 'process_request')),
    ((SELECT id FROM Roles WHERE name = 'Staff'), (SELECT id FROM Permissions WHERE name = 'view_own_request')); -- Staff can also view their own requests
    (SELECT id FROM Roles WHERE name = 'Staff'), (SELECT id FROM Permissions WHERE name = 'submit_request')); -- Staff can submit requests on behalf of citizens

-- Head
INSERT INTO RolePermissions (role_id, permission_id) VALUES
    ((SELECT id FROM Roles WHERE name = 'Head'), (SELECT id FROM Permissions WHERE name = 'approve_request')),
    ((SELECT id FROM Roles WHERE name = 'Head'), (SELECT id FROM Permissions WHERE name = 'process_request')); -- Head might also be able to process
    ((SELECT id FROM Roles WHERE name = 'Head'), (SELECT id FROM Permissions WHERE name = 'view_own_request')); -- Head can view their own requests
    ((SELECT id FROM Roles WHERE name = 'Head'), (SELECT id FROM Permissions WHERE name = 'submit_request')); -- Head can submit requests on behalf of citizens

INSERT INTO users VALUES()
UPDATE Users SET role_id = (SELECT id FROM Roles WHERE name = 'Admin') WHERE username = 'admin_user';
UPDATE Users SET role_id = (SELECT id FROM Roles WHERE name = 'Staff'), office_id = (SELECT id FROM Offices WHERE name = 'City Public Security') WHERE username = 'staff_ps_user';
UPDATE Users SET role_id = (SELECT id FROM Roles WHERE name = 'Head'), office_id = (SELECT id FROM Offices WHERE name = 'City People Committee') WHERE username = 'head_pc_user';

