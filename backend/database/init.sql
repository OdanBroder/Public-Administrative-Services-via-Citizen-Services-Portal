CREATE TABLE
    `users` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `email` VARCHAR(255) NOT NULL,
        `password_hash` VARCHAR(255) NOT NULL,
        `first_name` VARCHAR(100),
        `last_name` VARCHAR(100),
        `is_email_verified` TINYINT (1) NOT NULL DEFAULT 0,
        `is_qr_enabled` TINYINT (1) NOT NULL DEFAULT 0,
        `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        `last_login_at` TIMESTAMP NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `idx_email` (`email`)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE INDEX idx_users_created_at ON users (created_at);

CREATE TABLE
    `user_qr` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `user_id` INT NOT NULL,
        `secret_key` VARCHAR(255) NOT NULL,
        `backup_codes` TEXT,
        `recovery_email` VARCHAR(255),
        `phone_number` VARCHAR(20),
        `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        UNIQUE KEY `idx_user_id` (`user_id`),
        CONSTRAINT `fk_user_qr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    `login_sessions` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `user_id` INT NOT NULL,
        `session_token` VARCHAR(255) NOT NULL,
        `ip_address` VARCHAR(45),
        `user_agent` TEXT,
        `is_qr_verified` TINYINT (1) NOT NULL DEFAULT 0,
        `expires_at` TIMESTAMP NOT NULL,
        `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_user_id` (`user_id`),
        KEY `idx_session_token` (`session_token`),
        CONSTRAINT `fk_login_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE INDEX idx_login_sessions_expires_at ON login_sessions(expires_at);

CREATE TABLE
    `password_reset_tokens` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `user_id` INT NOT NULL,
        `token` VARCHAR(255) NOT NULL,
        `expires_at` TIMESTAMP NOT NULL,
        `used_at` TIMESTAMP NULL,
        `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_token` (`token`),
        KEY `idx_user_id` (`user_id`),
        CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE INDEX idx_password_reset_expires ON password_reset_tokens(expires_at);

CREATE TABLE
    `email_verification_tokens` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `user_id` INT NOT NULL,
        `token` VARCHAR(255) NOT NULL,
        `expires_at` TIMESTAMP NOT NULL,
        `verified_at` TIMESTAMP NULL,
        `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_token` (`token`),
        KEY `idx_user_id` (`user_id`),
        CONSTRAINT `fk_email_verification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    `login_attempts` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `email` VARCHAR(255) NOT NULL,
        `ip_address` VARCHAR(45) NOT NULL,
        `attempted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `was_successful` TINYINT (1) NOT NULL DEFAULT 0,
        PRIMARY KEY (`id`),
        KEY `idx_email` (`email`),
        KEY `idx_ip_address` (`ip_address`),
        KEY `idx_attempted_at` (`attempted_at`)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;