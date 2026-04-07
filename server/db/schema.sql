-- DROP DATABASE IF EXISTS isse224;
CREATE DATABASE IF NOT EXISTS isse224;
USE isse224;

-- =============================================
-- Users Table (Authentication)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('Admin', 'SaleStaff', 'QualityController', 'LogisticsStaff', 'Production') DEFAULT 'LogisticsStaff',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Orders Table (Order Details)
-- order_type and item_count defined here directly
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
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
CREATE TABLE IF NOT EXISTS supplies (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    item_name       VARCHAR(200) NOT NULL,
    cost            DECIMAL(15, 2) NOT NULL,
    category        VARCHAR(100) DEFAULT 'General',
    purchase_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Constructions Table (Requests from Construct Furniture page)
-- =============================================
CREATE TABLE IF NOT EXISTS constructions (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    furniture_type      VARCHAR(100) NOT NULL,
    primary_finish      VARCHAR(100) NOT NULL,
    secondary_finish    VARCHAR(100),
    extra_finish        BOOLEAN DEFAULT FALSE,
    special_finishes    JSON,           -- e.g. Cushions, Stitching, etc.
    image_url           VARCHAR(500),
    request_date        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Inventory Materials Table (UC2 — Material Reservation & Inventory)
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_materials (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    material_name   VARCHAR(200) NOT NULL,
    unit            VARCHAR(50)  NOT NULL DEFAULT 'units',
    total_qty       INT NOT NULL DEFAULT 0,
    reserved_qty    INT NOT NULL DEFAULT 0,
    location        VARCHAR(100) DEFAULT 'Warehouse A',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Material Reservations Table (UC2 — links a reservation to an order)
-- =============================================
CREATE TABLE IF NOT EXISTS material_reservations (
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
-- QC Records Table (UC3 — AQL Inspection Register)
-- =============================================
CREATE TABLE IF NOT EXISTS qc_records (
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
-- Production Assignments (order-to-production staff mapping)
-- =============================================
CREATE TABLE IF NOT EXISTS production_assignments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL UNIQUE,
    assigned_to     VARCHAR(100) NOT NULL,
    assigned_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- =============================================
-- Production Progress History
-- =============================================
CREATE TABLE IF NOT EXISTS production_progress (
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

-- ===========================================
-- MOCK DATA
-- ===========================================

-- Users (password is bcrypt hash for 'password123' — replace in production)
INSERT INTO users (username, password, role) VALUES 
('admin', '$2a$10$JeHeY25ac2eNYZNDfSjW/e8Fmv6dKarNtqq5OYKYFwSQFT1H4ev1u', 'Admin'),
('sale_staff', '$2a$10$JeHeY25ac2eNYZNDfSjW/e8Fmv6dKarNtqq5OYKYFwSQFT1H4ev1u', 'SaleStaff'),
('qc_controller', '$2a$10$JeHeY25ac2eNYZNDfSjW/e8Fmv6dKarNtqq5OYKYFwSQFT1H4ev1u', 'QualityController'),
('logistics_staff', '$2a$10$JeHeY25ac2eNYZNDfSjW/e8Fmv6dKarNtqq5OYKYFwSQFT1H4ev1u', 'LogisticsStaff'),
('production_staff', '$2a$10$JeHeY25ac2eNYZNDfSjW/e8Fmv6dKarNtqq5OYKYFwSQFT1H4ev1u', 'Production');

-- Orders (order_type and item_count included directly)
INSERT INTO orders (customer_name, unit_price, total_amount, status, order_type, item_count) VALUES 
('Acme Corp',           375.00,   4500.00,  'Completed',   'ODM',      12),
('Jane Doe',            850.50,    850.50,  'In Progress', 'Bespoke',   1),
('Global Tech',         364.71,  12400.00,  'Pending',     'OEM',      34),
('Stark Industries',    465.00,    930.00,  'Cancelled',   'OEM',       2);

-- Supplies
INSERT INTO supplies (item_name, cost, category) VALUES 
('Oak Wood Planks',         1200.00, 'Raw Materials'),
('Metal Screws & Hinges',    150.00, 'Hardware'),
('Premium Leather',         3400.00, 'Upholstery'),
('Warehouse Electricity',    280.00, 'Utility');

-- Inventory Materials
INSERT INTO inventory_materials (material_name, unit, total_qty, reserved_qty, location) VALUES
('Teak Wood (Grade A)',          'boards', 200, 45, 'Warehouse A'),
('Oak Wood (Grade A)',           'boards', 150, 30, 'Warehouse A'),
('Pine Wood (Grade B)',          'boards', 300, 10, 'Warehouse B'),
('Premium Leather',              'rolls',   80, 20, 'Warehouse C'),
('Stainless Steel Frame',        'units',   60, 15, 'Workshop'),
('Foam Padding (High-Density)',  'sheets', 120,  0, 'Warehouse C');

-- Material Reservations
INSERT INTO material_reservations (material_id, order_id, reserved_qty, purpose, reserved_by, status) VALUES
(1, 'ORD-2024', 20, 'Bespoke Dining Set',  'Somchai W.', 'Active'),
(4, 'ORD-2021', 12, 'Bespoke Sofa Set',    'Napat K.',   'Active'),
(2, 'ORD-1998', 15, 'Bespoke Bookshelf',   'Anong P.',   'Released');

-- QC Records
INSERT INTO qc_records (order_id, batch_id, product_description, aql_level, result, defect_count, inspector_name, notes) VALUES
('1', 'BCH-0001A', 'ODM order for Acme Corp (12 items)',     'AQL 2.5', 'Pass', 0, 'Napat K.',   'All units within tolerance.'),
('2', 'BCH-0002A', 'Bespoke order for Jane Doe (1 items)',    'AQL 1.5', 'Fail', 3, 'Somchai W.', 'Stitching defects on left armrest. Sent for rework.'),
('3', 'BCH-0003A', 'OEM order for Global Tech (34 items)',    'AQL 2.5', 'Pass', 1, 'Anong P.',   'Minor surface blemish on 1 unit - accepted.');

-- Production Assignments
INSERT INTO production_assignments (order_id, assigned_to) VALUES
(1, 'production_staff'),
(2, 'production_staff'),
(3, 'production_staff');

-- Production Progress History
INSERT INTO production_progress (order_id, updated_by, progress_percent, progress_note, is_submitted, submitted_at) VALUES
(1, 'production_staff', 100, 'Assembly and finishing completed. Ready for final handover.', TRUE, CURRENT_TIMESTAMP),
(2, 'production_staff', 65, 'Frame and upholstery are in progress.', FALSE, NULL),
(3, 'production_staff', 25, 'Raw material prep and cutting started.', FALSE, NULL);