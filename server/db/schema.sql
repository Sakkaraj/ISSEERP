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
    construction_id INT NULL,
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
        design_mode         ENUM('OEM', 'ODM', 'Bespoke') DEFAULT 'OEM',
    furniture_type      VARCHAR(100) NOT NULL,
    primary_finish      VARCHAR(100) NOT NULL,
    secondary_finish    VARCHAR(100),
        reference_code      VARCHAR(100),
        customer_requirements TEXT,
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

-- =============================================
-- DUMMY MATERIALS DATA (for Inventory page)
-- All materials fully in stock, no reservations (no ongoing orders)
-- =============================================
INSERT INTO inventory_materials (material_name, unit, total_qty, reserved_qty, usable_for_finishing, location, created_at) VALUES
-- Wood Materials
('Teak Wood Grade A (Premium)',       'boards',   250,   0,  TRUE,  'Warehouse A', DATE_SUB(NOW(), INTERVAL 45 DAY)),
('Oak Wood Grade A (Standard)',       'boards',   180,   0,  TRUE,  'Warehouse A', DATE_SUB(NOW(), INTERVAL 38 DAY)),
('Pine Wood Grade B (Economy)',       'boards',   400,   0,  TRUE,  'Warehouse B', DATE_SUB(NOW(), INTERVAL 52 DAY)),
('Walnut Wood (Dark Finish)',         'boards',   120,   0,  TRUE,  'Warehouse C', DATE_SUB(NOW(), INTERVAL 30 DAY)),
('Plywood Sheet 3mm',                 'sheets',   500,   0, FALSE, 'Warehouse B', DATE_SUB(NOW(), INTERVAL 25 DAY)),

-- Upholstery & Textiles
('Premium Leather (Genuine)',         'rolls',    95,    0,  TRUE,  'Warehouse C', DATE_SUB(NOW(), INTERVAL 42 DAY)),
('Fabric - Cotton Blend',             'rolls',    150,   0,  TRUE,  'Warehouse C', DATE_SUB(NOW(), INTERVAL 35 DAY)),
('Foam Padding - High Density',       'sheets',   200,   0,  FALSE, 'Warehouse C', DATE_SUB(NOW(), INTERVAL 28 DAY)),
('Fabric - Linen',                    'rolls',    80,    0,  TRUE,  'Warehouse C', DATE_SUB(NOW(), INTERVAL 40 DAY)),

-- Hardware & Metal
('Stainless Steel Frame 40x40',       'units',    75,    0,  FALSE, 'Workshop A', DATE_SUB(NOW(), INTERVAL 50 DAY)),
('Brass Hinges (Cabinet)',            'units',    300,   0,  FALSE, 'Workshop B', DATE_SUB(NOW(), INTERVAL 33 DAY)),
('Metal Screws Assortment',           'boxes',    50,    0,   FALSE, 'Workshop A', DATE_SUB(NOW(), INTERVAL 22 DAY)),
('Aluminum Tubes 25mm',               'meters',   200,   0,  FALSE, 'Workshop C', DATE_SUB(NOW(), INTERVAL 37 DAY)),
('Steel Rods 10mm',                   'meters',   300,   0,  FALSE, 'Workshop B', DATE_SUB(NOW(), INTERVAL 29 DAY)),

-- Finishing & Coatings
('Wood Stain - Dark Walnut',          'liters',   25,    0,   TRUE,  'Storage A',  DATE_SUB(NOW(), INTERVAL 20 DAY)),
('Polyurethane Varnish (Matte)',      'liters',   30,    0,   TRUE,  'Storage A',  DATE_SUB(NOW(), INTERVAL 18 DAY)),
('Paint - Matte Black',               'liters',   20,    0,   TRUE,  'Storage B',  DATE_SUB(NOW(), INTERVAL 24 DAY)),
('Sandpaper Assortment',              'sheets',   150,   0,  FALSE, 'Storage A',  DATE_SUB(NOW(), INTERVAL 15 DAY));

-- =============================================
-- SUPPLY COSTS (Material purchases - for Finance/Expenses)
-- =============================================
INSERT INTO supplies (item_name, cost, category, purchase_date) VALUES
-- Raw Materials Costs
('Teak Wood Purchase - 250 boards',         4500.00, 'Raw Materials', DATE_SUB(NOW(), INTERVAL 45 DAY)),
('Oak Wood Purchase - 180 boards',          2700.00, 'Raw Materials', DATE_SUB(NOW(), INTERVAL 38 DAY)),
('Pine Wood Purchase - 400 boards',         1600.00, 'Raw Materials', DATE_SUB(NOW(), INTERVAL 52 DAY)),
('Walnut Wood Purchase - 120 boards',       3600.00, 'Raw Materials', DATE_SUB(NOW(), INTERVAL 30 DAY)),
('Plywood Sheet Stock - 500 units',         1250.00, 'Raw Materials', DATE_SUB(NOW(), INTERVAL 25 DAY)),

-- Upholstery & Textiles Costs
('Premium Leather Rolls - 95 rolls',        6650.00, 'Upholstery',   DATE_SUB(NOW(), INTERVAL 42 DAY)),
('Cotton Blend Fabric - 150 rolls',         2250.00, 'Upholstery',   DATE_SUB(NOW(), INTERVAL 35 DAY)),
('High Density Foam Sheets - 200 sheets',   1600.00, 'Upholstery',   DATE_SUB(NOW(), INTERVAL 28 DAY)),
('Linen Fabric Stock - 80 rolls',           1600.00, 'Upholstery',   DATE_SUB(NOW(), INTERVAL 40 DAY)),

-- Hardware & Metal Costs
('Stainless Steel Frames - 75 units',       3750.00, 'Hardware',     DATE_SUB(NOW(), INTERVAL 50 DAY)),
('Brass Hinges - 300 units',                1500.00, 'Hardware',     DATE_SUB(NOW(), INTERVAL 33 DAY)),
('Metal Screws Assortment - 50 boxes',      500.00,  'Hardware',     DATE_SUB(NOW(), INTERVAL 22 DAY)),
('Aluminum Tubes - 200 meters',             2000.00, 'Hardware',     DATE_SUB(NOW(), INTERVAL 37 DAY)),
('Steel Rods - 300 meters',                 1500.00, 'Hardware',     DATE_SUB(NOW(), INTERVAL 29 DAY)),

-- Finishing & Coatings Costs
('Wood Stain Supply - 25 liters',           375.00,  'Finishing',    DATE_SUB(NOW(), INTERVAL 20 DAY)),
('Polyurethane Varnish - 30 liters',        750.00,  'Finishing',    DATE_SUB(NOW(), INTERVAL 18 DAY)),
('Matte Black Paint - 20 liters',           400.00,  'Finishing',    DATE_SUB(NOW(), INTERVAL 24 DAY)),
('Sandpaper Assortment - 150 sheets',       300.00,  'Finishing',    DATE_SUB(NOW(), INTERVAL 15 DAY)),

-- Utilities & Operations
('Warehouse Electricity Bill',              450.00,  'Utilities',    DATE_SUB(NOW(), INTERVAL 7 DAY)),
('Workshop Equipment Maintenance',          800.00,  'Maintenance',  DATE_SUB(NOW(), INTERVAL 10 DAY)),
('Logistics Vehicle Fuel',                  650.00,  'Operations',   DATE_SUB(NOW(), INTERVAL 5 DAY)),
('Quality Control Equipment Calibration',   200.00,  'Quality',      DATE_SUB(NOW(), INTERVAL 12 DAY));