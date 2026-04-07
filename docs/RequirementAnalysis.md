# Requirement Analysis — BoonSunClon ERP System

**Project:** BoonSunClon ERP Portal  
**System:** Internal Information System for Furniture Manufacturing  
**Date:** April 2026  
**Version:** 1.0

---

## Executive Summary

The BoonSunClon ERP system is a web-based application designed to support order management, inventory control, quality assurance, and financial tracking for a furniture manufacturing business specializing in OEM, ODM, and Bespoke production. This document outlines the functional and non-functional requirements identified through analysis of system architecture, database schema, and user interface implementation.

---

## Functional Requirements

Functional requirements describe what the system must do to support business operations.

| ID | Requirement | Traceability |
|---|---|---|
| FR-001 | The system shall allow a user to submit username and password to log in. | [client/src/pages/login.jsx](../../client/src/pages/login.jsx), [server/handlers/auth.go](../../server/handlers/auth.go) |
| FR-002 | The system shall authenticate credentials against stored user records using bcrypt password verification. | [server/handlers/auth.go](../../server/handlers/auth.go), [server/db/schema.sql](../../server/db/schema.sql) |
| FR-003 | The system shall reject invalid login attempts with an unauthorized response and clear error message. | [server/handlers/auth.go](../../server/handlers/auth.go), [client/src/pages/login.jsx](../../client/src/pages/login.jsx) |
| FR-004 | The system shall return an authentication token on successful login and store it on the client side for session continuity. | [server/handlers/auth.go](../../server/handlers/auth.go), [client/src/pages/login.jsx](../../client/src/pages/login.jsx) |
| FR-005 | The system shall restrict access to protected pages and redirect unauthenticated users to the login page. | [client/src/pages/App.jsx](../../client/src/pages/App.jsx) |
| FR-006 | The system shall allow users to log out and clear local authentication state. | [client/src/pages/App.jsx](../../client/src/pages/App.jsx), [client/src/components/SettingsDropdown.jsx](../../client/src/components/SettingsDropdown.jsx) |
| FR-007 | The system shall provide clickable navigation to Home, Dashboard, Orders, Inventory, QC Register, Design Specs, and Finance pages. | [client/src/pages/App.jsx](../../client/src/pages/App.jsx) |
| FR-008 | The system shall retrieve and display a list of orders sorted by most recent order date. | [server/handlers/orders.go](../../server/handlers/orders.go), [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx) |
| FR-009 | The system shall allow creation of a new order with customer name, order type (OEM/ODM/Bespoke), amount, and item count. | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx), [server/handlers/orders.go](../../server/handlers/orders.go) |
| FR-010 | The system shall set the default status of a newly created order to Pending. | [server/handlers/orders.go](../../server/handlers/orders.go), [server/db/schema.sql](../../server/db/schema.sql) |
| FR-011 | The system shall allow users to search orders by customer name or order ID. | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx) |
| FR-012 | The system shall paginate order results with configurable items per page (default: 5). | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx) |
| FR-013 | The system shall display a detailed order slide-over panel when a user selects an order row, including status, type, timeline, and amounts. | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx) |
| FR-014 | The system shall retrieve and display inventory materials with total quantity, reserved quantity, and warehouse location. | [server/handlers/inventory.go](../../server/handlers/inventory.go), [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx) |
| FR-015 | The system shall retrieve and display material reservation records linked to material names and order IDs. | [server/handlers/inventory.go](../../server/handlers/inventory.go), [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx) |
| FR-016 | The system shall allow creation of material reservations with material, order ID, quantity, purpose, and reserved-by fields. | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| FR-017 | The system shall validate that reservation quantity does not exceed available stock (total - reserved) before saving. | [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| FR-018 | The system shall update reserved stock totals when a reservation is successfully created. | [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| FR-019 | The system shall retrieve and display QC inspection records sorted by inspection date (most recent first). | [server/handlers/qc.go](../../server/handlers/qc.go), [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx) |
| FR-020 | The system shall allow users to submit QC inspection records with order ID, batch ID, product description, AQL level, result, defect count, inspector name, and optional notes. | [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx), [server/handlers/qc.go](../../server/handlers/qc.go) |
| FR-021 | The system shall allow filtering QC records by result status (All, Pass, Fail). | [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx) |
| FR-022 | The system shall allow users to create and view furniture design specifications including furniture type, primary finish, secondary finish, and special finishes. | [client/src/pages/construct.jsx](../../client/src/pages/construct.jsx), [server/handlers/constructions.go](../../server/handlers/constructions.go) |
| FR-023 | The system shall allow users to add a new inventory material with material name, unit, initial quantity, and storage location. | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| FR-024 | The system shall allow users to restock an existing inventory material by increasing total quantity using a positive added quantity value. | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| FR-025 | The system shall allow users to change an order status as a draft selection and persist it only when the user explicitly clicks Save/Update. | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx), [server/handlers/orders.go](../../server/handlers/orders.go) |
| FR-026 | The system shall record order lifecycle timestamps when status transitions occur, including started_at for In Progress and completed_at for Completed. | [server/handlers/orders.go](../../server/handlers/orders.go), [server/db/db.go](../../server/db/db.go) |
| FR-027 | The system shall allow QC users to look up an order by order ID and auto-fill essential inspection context fields from the retrieved order. | [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx), [server/handlers/orders.go](../../server/handlers/orders.go) |
| FR-028 | The system shall calculate finance income from completed orders and display updated totals and recent completed-order entries in the Finance view. | [server/handlers/dashboard.go](../../server/handlers/dashboard.go), [client/src/pages/finance.jsx](../../client/src/pages/finance.jsx) |

**Total Functional Requirements: 28**

---

## Non-Functional Requirements

Non-functional requirements describe quality attributes, constraints, and cross-cutting concerns of the system.

| ID | Requirement | Traceability |
|---|---|---|
| NFR-001 | **Security**: The system shall store user passwords as bcrypt hashes and never as plain text. | [server/handlers/auth.go](../../server/handlers/auth.go), [server/db/schema.sql](../../server/db/schema.sql) |
| NFR-002 | **Security**: The system shall enforce authentication checks for all protected frontend routes via token validation. | [client/src/pages/App.jsx](../../client/src/pages/App.jsx) |
| NFR-003 | **Reliability**: The system shall return API responses in JSON format with appropriate HTTP status codes (200, 201, 400, 401, 404, 500) for success and failure cases. | [server/handlers/auth.go](../../server/handlers/auth.go), [server/handlers/orders.go](../../server/handlers/orders.go), [server/handlers/inventory.go](../../server/handlers/inventory.go), [server/handlers/qc.go](../../server/handlers/qc.go), [server/handlers/constructions.go](../../server/handlers/constructions.go) |
| NFR-004 | **Data Integrity**: The system shall maintain data integrity using relational constraints, foreign keys, and controlled enumerations for status fields. | [server/db/schema.sql](../../server/db/schema.sql) |
| NFR-005 | **Usability**: The system shall provide responsive UI behavior across desktop, tablet, and mobile layouts using TailwindCSS breakpoints. | [client/src/pages/App.jsx](../../client/src/pages/App.jsx), [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx), [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx), [client/src/pages/construct.jsx](../../client/src/pages/construct.jsx) |
| NFR-006 | **Usability**: The system shall provide clear user feedback for loading, success, and error states during all data operations with visual indicators and messages. | [client/src/pages/login.jsx](../../client/src/pages/login.jsx), [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx), [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx), [client/src/pages/construct.jsx](../../client/src/pages/construct.jsx) |
| NFR-007 | **Maintainability**: The system shall support maintainability through modular separation of concerns between handlers, pages, components, and database layer. | [server/handlers/orders.go](../../server/handlers/orders.go), [server/db/schema.sql](../../server/db/schema.sql), [client/src/pages/App.jsx](../../client/src/pages/App.jsx), [client/src/components/ThemeToggle.jsx](../../client/src/components/ThemeToggle.jsx) |
| NFR-008 | **Deployability**: The system shall support environment-based deployment configuration through .env files for service port and optional frontend proxy URL. | [server/main.go](../../server/main.go) |
| NFR-009 | **Deployability**: The system shall support both development mode (dynamic proxy to frontend dev server) and production mode (serving pre-built frontend assets). | [server/main.go](../../server/main.go) |
| NFR-010 | **Auditability**: The system shall timestamp all transactional records (orders, reservations, QC records, specifications) for traceability and audit trail. | [server/db/schema.sql](../../server/db/schema.sql) |
| NFR-011 | **Consistency**: The system shall preserve consistent domain vocabulary across UI labels, API field names, and database column names to reduce ambiguity and integration errors. | [server/db/schema.sql](../../server/db/schema.sql), [server/handlers/orders.go](../../server/handlers/orders.go), [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx) |
| NFR-012 | **Usability**: The system shall support user interface theme switching between light and dark modes without page reload using context state. | [client/src/components/ThemeToggle.jsx](../../client/src/components/ThemeToggle.jsx), [client/src/context/ThemeContext.jsx](../../client/src/context/ThemeContext.jsx), [client/src/pages/index.css](../../client/src/pages/index.css) |
| NFR-013 | **Data Integrity**: The system shall enforce positive quantity validation for material creation/restocking/reservation and reject inventory operations that would violate available stock constraints. | [server/handlers/inventory.go](../../server/handlers/inventory.go), [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx) |
| NFR-014 | **Auditability**: The system shall preserve and expose status transition timestamps (started_at, completed_at) in order APIs for traceable production lifecycle history. | [server/handlers/orders.go](../../server/handlers/orders.go), [server/db/db.go](../../server/db/db.go) |
| NFR-015 | **Consistency**: The system shall keep order ID usage consistent across Orders, QC, and Inventory workflows to support reliable lookup, autofill, and reservation linkage. | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx), [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx), [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/orders.go](../../server/handlers/orders.go) |

**Total Non-Functional Requirements: 15**

---

## System Assumptions

1. Users are authenticated staff members with access to the BoonSunClon internal network.
2. The database is MySQL 8.0+ running on a shared internal server.
3. The frontend is served via Vite during development and pre-built during production.
4. Order types are limited to OEM, ODM, and Bespoke as defined in business domain.
5. QC inspection levels follow AQL (Acceptable Quality Level) standards: 0.65, 1.0, 1.5, 2.5, 4.0, 6.5.
6. All timestamps are recorded in UTC and converted to local time in UI as needed.
7. Material reservations are immutable once created; status changes are restricted to Active or Released.
8. The system does not currently implement role-based access control (RBAC); all authenticated users have equal permissions.

---

## Constraints & Limitations

- **No real-time synchronization**: Changes made by one user are not instantly reflected for others; users must refresh to see updates.
- **No file upload**: Design specifications do not currently support image uploads; image_url is a placeholder field.
- **Single authentication token**: Session tokens are stored in browser localStorage without expiration; logout is client-side only.
- **Limited reporting**: Finance page provides summary-level income/expense/profit and recent activity; advanced forecasting and drill-down analytics are not implemented.
- **No multi-language support**: All UI text is in English only.

---

## Traceability Matrix Summary

| Artifact | Count | Notes |
|---|---|---|
| Functional Requirements | 28 | Cover authentication, order management, inventory, QC, design specification, and finance aggregation domains. |
| Non-Functional Requirements | 15 | Address security, reliability, usability, maintainability, deployability, auditability, consistency, and data integrity. |
| Handler Files | 6 | auth, orders, inventory, qc, constructions, dashboard |
| Frontend Pages | 8 | login, home, dashboard, orderdetail, inventory, qc, construct, finance |
| Database Tables | 9 | users, orders, supplies, constructions, inventory_materials, material_reservations, qc_records |

---

## Sign-Off

| Role | Name | Date | Signature |
|---|---|---|---|
| Requirements Analyst | — | — | — |
| Project Manager | — | — | — |
| Technical Lead | — | — | — |

---

*Generated: April 2026*