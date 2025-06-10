-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS citizen_services;

-- Use the database
USE citizen_services;

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

-- 5. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    role_id INT UNSIGNED DEFAULT 2 COMMENT 'Foreign key linking to the Roles table',
    office_id INT UNSIGNED NULL COMMENT 'Foreign key linking to the Offices table (relevant for Staff/Head roles)',
    email VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_verified BOOLEAN DEFAULT false,
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
    UNIQUE KEY idx_email (email),
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE SET NULL,
    CONSTRAINT fk_user_office FOREIGN KEY (office_id) REFERENCES Offices(id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_users_created_at ON users (created_at);
CREATE INDEX idx_user_role ON users (role_id);
CREATE INDEX idx_user_office ON users (office_id);

-- 6. Services Table
CREATE TABLE IF NOT EXISTS services (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    office_id INT UNSIGNED NULL COMMENT 'Foreign key linking to the Offices table',
    application_url VARCHAR(255) NULL DEFAULT NULL COMMENT 'URL for the service application form',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_office FOREIGN KEY (office_id) REFERENCES Offices(id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 7. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    service_id INT UNSIGNED NOT NULL,
    application_data JSON,
    status ENUM('pending', 'awaiting_signature', 'approved', 'rejected') DEFAULT 'pending',
    processed_by INT UNSIGNED NULL,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_service_id (service_id),
    INDEX idx_status (status),
    INDEX idx_processed_by (processed_by)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 8. Bảo hiểm Y tế Table
CREATE TABLE IF NOT EXISTS medical_coverage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    service_id INT UNSIGNED NOT NULL,
    card_number VARCHAR(255) NOT NULL,
    coverage_type ENUM('BASIC', 'STANDARD', 'PREMIUM') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_premium DECIMAL(10, 2) NOT NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_service_id (service_id),
    INDEX idx_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 9. Service Health Table
CREATE TABLE IF NOT EXISTS service_health (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    status ENUM('UP', 'DOWN', 'DEGRADED') NOT NULL,
    response_time INT NOT NULL,
    last_checked TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    uptime DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_service_id (service_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_last_checked (last_checked)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 10. User QR Table
CREATE TABLE IF NOT EXISTS user_qr (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
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

-- 11. Login Sessions Table
CREATE TABLE IF NOT EXISTS login_sessions (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
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

-- 12. Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
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

-- 13. Email Verification Tokens Table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_token (token),
    KEY idx_user_id (user_id),
    CONSTRAINT fk_email_verification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 14. Login Attempts Table
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

-- 15. JWT Blacklist Table
CREATE TABLE IF NOT EXISTS jwt_blacklist (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token(255)),
    INDEX idx_expires_at (expires_at)
);

-- Create cleanup event for JWT blacklist
CREATE EVENT cleanup_jwt_blacklist
ON SCHEDULE EVERY 1 DAY
DO
  DELETE FROM jwt_blacklist WHERE expires_at < NOW();

-- 16. For save path of file
CREATE TABLE IF NOT EXISTS file_path (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,    
    private_key VARCHAR(100) DEFAULT NULL, -- /working/user/user_id/cert/private.key (encrypted)
    public_key VARCHAR(100) DEFAULT NULL,  -- /working/user/user_id/cert/public.key
    csr VARCHAR(100) DEFAULT NULL,         -- /working/user/user_id/cert/req.csr
    certificate VARCHAR(100) DEFAULT NULL, -- /working/user/user_id/cert/signed_cert.pem
    application VARCHAR(100) DEFAULT NULL,  -- /working/user/user_id/application
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_file_path (id)
);

-- 17. Birth Registrations Table
CREATE TABLE IF NOT EXISTS BirthRegistrations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    applicant_id INT UNSIGNED,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_dob DATE NOT NULL,
    applicant_phone VARCHAR(255) NOT NULL,
    applicant_cccd VARCHAR(255) NOT NULL,
    applicant_cccd_issue_date DATE NOT NULL,
    applicant_cccd_issue_place VARCHAR(255) NOT NULL,
    applicant_address VARCHAR(255) NOT NULL,
    
    registrant_name VARCHAR(255) NOT NULL,
    registrant_gender VARCHAR(255) NOT NULL,
    registrant_ethnicity VARCHAR(255) NOT NULL,
    registrant_nationality VARCHAR(255) NOT NULL,
    registrant_dob DATE NOT NULL,
    registrant_dob_in_words VARCHAR(255) NOT NULL,
    registrant_birth_place VARCHAR(255) NOT NULL,
    registrant_province VARCHAR(100) NOT NULL,
    registrant_hometown VARCHAR(100) NOT NULL,
    
    father_name VARCHAR(255) NOT NULL,
    father_dob DATE NOT NULL,
    father_ethnicity VARCHAR(50) NOT NULL,
    father_nationality VARCHAR(50) NOT NULL,
    father_residence_type VARCHAR(50) NOT NULL DEFAULT 'thường trú',
    father_address VARCHAR(255) NOT NULL,
    
    mother_name VARCHAR(255) NOT NULL,
    mother_dob DATE NOT NULL,
    mother_ethnicity VARCHAR(50) NOT NULL,
    mother_nationality VARCHAR(50) NOT NULL,
    mother_residence_type VARCHAR(50) NOT NULL DEFAULT 'thường trú',
    mother_address VARCHAR(255) NOT NULL,
    
    status ENUM('pending', 'awaiting_signature', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    file_path VARCHAR(100) DEFAULT NULL,
    service_id INT UNSIGNED NOT NULL DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    
    INDEX idx_applicant_id (applicant_id),
    INDEX idx_status (status),
    INDEX idx_service_id (service_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 18. Citizens Table
CREATE TABLE IF NOT EXISTS citizens (
    id INT UNSIGNED NOT NULL,
    ho_va_ten VARCHAR(255) NOT NULL,
    so_cccd VARCHAR(255) NOT NULL UNIQUE,
    hinh_anh_cccd_truoc VARCHAR(255) NOT NULL,
    hinh_anh_cccd_sau VARCHAR(255) NOT NULL,
    noi_cap_cccd VARCHAR(255) NOT NULL,
    ngay_cap_cccd DATE NOT NULL,
    ngay_sinh DATE NOT NULL,
    gioi_tinh VARCHAR(10) NOT NULL,
    que_quan VARCHAR(255) NOT NULL,
    noi_thuong_tru VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_so_cccd (so_cccd)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;