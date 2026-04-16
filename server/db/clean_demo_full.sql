-- Clean demo schema for the full UI
-- Creates all application tables but does not seed mock operational data.

CREATE DATABASE IF NOT EXISTS isse224;
USE isse224;

-- =============================================
-- Users Table (Authentication)
-- =============================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('Admin', 'SaleStaff', 'QualityController', 'LogisticsStaff', 'Production') DEFAULT 'LogisticsStaff',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Orders Table (Order Details)
-- =============================================
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    customer_name   VARCHAR(200) NOT NULL,
    unit_price      DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_amount    DECIMAL(15, 2) NOT NULL,
    status          ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    started_at      TIMESTAMP NULL,
    completed_at    TIMESTAMP NULL,
    order_type      ENUM('OEM', 'ODM', 'Bespoke') DEFAULT 'OEM',
    item_count      INT NOT NULL DEFAULT 1,
    order_date      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Supplies Table (Finance / Expenses)
-- =============================================
DROP TABLE IF EXISTS supplies;
CREATE TABLE supplies (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    item_name       VARCHAR(200) NOT NULL,
    cost            DECIMAL(15, 2) NOT NULL,
    category        VARCHAR(100) DEFAULT 'General',
    purchase_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Constructions Table (Requests from Construct Furniture page)
-- =============================================
DROP TABLE IF EXISTS constructions;
CREATE TABLE constructions (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    furniture_type      VARCHAR(100) NOT NULL,
    primary_finish      VARCHAR(100) NOT NULL,
    secondary_finish    VARCHAR(100),
    extra_finish        BOOLEAN DEFAULT FALSE,
    special_finishes    JSON,
    image_url           VARCHAR(500),
    request_date        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Inventory Materials Table
-- =============================================
DROP TABLE IF EXISTS inventory_materials;
CREATE TABLE inventory_materials (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    material_name   VARCHAR(200) NOT NULL,
    unit            VARCHAR(50)  NOT NULL DEFAULT 'units',
    total_qty       INT NOT NULL DEFAULT 0,
    reserved_qty    INT NOT NULL DEFAULT 0,
    usable_for_finishing BOOLEAN NOT NULL DEFAULT FALSE,
    location        VARCHAR(100) DEFAULT 'Warehouse A',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Material Reservations Table
-- =============================================
DROP TABLE IF EXISTS material_reservations;
CREATE TABLE material_reservations (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    material_id     INT NOT NULL,
    order_id        VARCHAR(50) NOT NULL,
    reserved_qty    INT NOT NULL,
    purpose         VARCHAR(255),
    reserved_by     VARCHAR(100) NOT NULL,
    status          ENUM('Active', 'Released') DEFAULT 'Active',
    reserved_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES inventory_materials(id)
);

-- =============================================
-- Logistics Shipments Table
-- =============================================
DROP TABLE IF EXISTS logistics_shipments;
CREATE TABLE logistics_shipments (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    order_id              INT NOT NULL UNIQUE,
    shipment_code         VARCHAR(50) NOT NULL UNIQUE,
    destination           VARCHAR(255) NOT NULL,
    delivery_method       ENUM('Internal Vehicle', 'Warehouse Pickup', 'Internal Transfer') NOT NULL DEFAULT 'Internal Vehicle',
    vehicle_code          VARCHAR(50) NOT NULL,
    driver_name           VARCHAR(100) NOT NULL,
    priority              ENUM('Low', 'Normal', 'High', 'Urgent') NOT NULL DEFAULT 'Normal',
    status                ENUM('Planned', 'Packed', 'Dispatched', 'Delivered', 'Returned', 'Cancelled') NOT NULL DEFAULT 'Planned',
    scheduled_dispatch_at TIMESTAMP NULL,
    dispatched_at         TIMESTAMP NULL,
    delivered_at          TIMESTAMP NULL,
    notes                 TEXT,
    created_by            VARCHAR(100) NOT NULL,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- =============================================
-- QC Records Table
-- =============================================
DROP TABLE IF EXISTS qc_records;
CREATE TABLE qc_records (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    order_id            VARCHAR(50)  NOT NULL,
    batch_id            VARCHAR(50)  NOT NULL,
    product_description VARCHAR(255) NOT NULL,
    aql_level           ENUM('AQL 0.65', 'AQL 1.0', 'AQL 1.5', 'AQL 2.5', 'AQL 4.0', 'AQL 6.5') NOT NULL,
    result              ENUM('Pass', 'Fail') NOT NULL,
    defect_count        INT NOT NULL DEFAULT 0,
    inspector_name      VARCHAR(100) NOT NULL,
    department          VARCHAR(100) DEFAULT 'QC/QA',
    notes               TEXT,
    inspected_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Production Assignments
-- =============================================
DROP TABLE IF EXISTS production_assignments;
CREATE TABLE production_assignments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL UNIQUE,
    assigned_to     VARCHAR(100) NOT NULL,
    assigned_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- =============================================
-- Production Progress History
-- =============================================
DROP TABLE IF EXISTS production_progress;
CREATE TABLE production_progress (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    order_id            INT NOT NULL,
    updated_by          VARCHAR(100) NOT NULL,
    progress_percent    INT NOT NULL,
    progress_note       TEXT,
    is_submitted        BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at        TIMESTAMP NULL,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Demo login accounts only. The rest of the application starts empty.
INSERT INTO users (username, password, role) VALUES
('admin', '$2a$10$JeHeY25ac2eNYZNDfSjW/e8Fmv6dKarNtqq5OYKYFwSQFT1H4ev1u', 'Admin'),
('sale_staff', '$2a$10$JeHeY25ac2eNYZNDfSjW/e8Fmv6dKarNtqq5OYKYFwSQFT1H4ev1u', 'SaleStaff'),
('qc_controller', '$2a$10$JeHeY25ac2eNYZNDfSjW/e8Fmv6dKarNtqq5OYKYFwSQFT1H4ev1u', 'QualityController'),
('logistics_staff', '$2a$10$JeHeY25ac2eNYZNDfSjW/e8Fmv6dKarNtqq5OYKYFwSQFT1H4ev1u', 'LogisticsStaff'),
('production_staff', '$2a$10$JeHeY25ac2eNYZNDfSjW/e8Fmv6dKarNtqq5OYKYFwSQFT1H4ev1u', 'Production');