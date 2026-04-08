-- Clean demo schema for a minimal deployment
-- Keeps only the users table and demo login accounts.

CREATE DATABASE IF NOT EXISTS isse224_clean_demo;
USE isse224_clean_demo;

DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('Admin', 'SaleStaff', 'QualityController', 'LogisticsStaff', 'Production') DEFAULT 'LogisticsStaff',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Demo users (bcrypt hash for 'password123')
INSERT INTO users (username, password, role) VALUES
('admin', '$2a$10$JeHeY25ac2eNYZNDfSjW/e8Fmv6dKarNtqq5OYKYFwSQFT1H4ev1u', 'Admin'),
('sale_staff', '$2a$10$JeHeY25ac2eNYZNDfSjW/e8Fmv6dKarNtqq5OYKYFwSQFT1H4ev1u', 'SaleStaff'),
('qc_controller', '$2a$10$JeHeY25ac2eNYZNDfSjW/e8Fmv6dKarNtqq5OYKYFwSQFT1H4ev1u', 'QualityController'),
('logistics_staff', '$2a$10$JeHeY25ac2eNYZNDfSjW/e8Fmv6dKarNtqq5OYKYFwSQFT1H4ev1u', 'LogisticsStaff'),
('production_staff', '$2a$10$JeHeY25ac2eNYZNDfSjW/e8Fmv6dKarNtqq5OYKYFwSQFT1H4ev1u', 'Production');