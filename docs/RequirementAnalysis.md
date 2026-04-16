# Requirement Analysis — BoonSunClon ERP System

**Project:** BoonSunClon ERP Portal  
**System:** Internal Information System for Furniture Manufacturing  
**Date:** April 2026  
**Version:** 2.2 (Logistics and Finishing Traceability Append)

---

## Executive Summary

The BoonSunClon ERP system is a web-based application designed to support order management, inventory control, quality assurance, and financial tracking for a furniture manufacturing business specializing in OEM, ODM, and Bespoke production. This document outlines the functional and non-functional requirements identified through analysis of system architecture, database schema, and user interface implementation.

---

## Role-Based Access Control (RBAC)

The system implements a comprehensive role-based access control model to ensure that users only access features and data relevant to their job functions. Each role represents a specific job function in the organization. The following table details the access permissions for each role:

| Role | Home | Dashboard | Orders | Inventory | QC Register | Production | Design Specs | Finance |
|------|:----:|:---------:|:------:|:---------:|:-----------:|:----------:|:------------:|:-------:|
| **Admin** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Sale Staff** | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Quality Controller** | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| **Logistics Staff** | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Production** | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ |

### Role Descriptions

**Admin**
- Full system access to all pages and features
- Responsible for system administration and user management
- Can view, create, update, and delete all entities
- Intended for system administrators and supervisors

**Sale Staff**
- Focused on order and financial operations
- Can view and manage order statuses and customer information
- Can access dashboard for order analytics and financial summaries
- Can view finance page for income tracking and reporting
- No access to inventory, QC, or design specification operations
- Intended for sales representatives, order coordinators, and customer service staff

**Quality Controller**
- Specialized role for quality assurance operations
- Exclusive access to QC Register for inspection records
- Can submit and filter QC inspection results (Pass/Fail)
- Can look up orders and auto-fill inspection context
- No access to other operational modules
- Intended for QC inspectors, quality assurance managers, and testing specialists

**Logistics Staff**
- Specialized role for inventory and material management
- Exclusive access to Inventory module for material management
- Can add new materials, restock existing materials, and manage reservations
- Can view warehouse locations and material quantities
- Can reserve materials for orders
- No access to orders, quality control, or financial operations
- Intended for warehouse managers, inventory coordinators, and logistics personnel

**Production**
- Specialized role for production execution tracking
- Exclusive access to Production page for assigned orders
- Can view details of assigned orders and current progress
- Can browse inventory materials for finishing lookup when selecting usable production materials
- Can update production progress with notes and timestamped history
- Can submit production progress for order lifecycle updates
- Intended for production managers and workshop supervisors

---

## Functional Requirements

Functional requirements describe what the system must do to support business operations.

| ID | Requirement | Traceability |
|---|---|---|
| FR-001 | The system shall allow a user to submit username and password to log in. | [client/src/pages/login.jsx](../../client/src/pages/login.jsx), [server/handlers/auth.go](../../server/handlers/auth.go) |
| FR-002 | The system shall authenticate credentials against stored user records using bcrypt password verification. | [server/handlers/auth.go](../../server/handlers/auth.go), [server/db/schema.sql](../../server/db/schema.sql) |
| FR-003 | The system shall reject invalid login attempts with an unauthorized response and clear error message. | [server/handlers/auth.go](../../server/handlers/auth.go), [client/src/pages/login.jsx](../../client/src/pages/login.jsx) |
| FR-004 | The system shall return an authentication token and user role on successful login and store them on the client side for session continuity. | [server/handlers/auth.go](../../server/handlers/auth.go), [client/src/pages/login.jsx](../../client/src/pages/login.jsx) |
| FR-005 | The system shall restrict access to protected pages and redirect unauthenticated users to the login page. | [client/src/pages/App.jsx](../../client/src/pages/App.jsx) |
| FR-006 | The system shall enforce role-based access control (RBAC) for all pages, restricting access based on user role assignments. | [client/src/pages/App.jsx](../../client/src/pages/App.jsx), [client/src/components/RoleBasedRoute.jsx](../../client/src/components/RoleBasedRoute.jsx), [server/db/schema.sql](../../server/db/schema.sql) |
| FR-007 | The system shall allow users to log out and clear local authentication state and role information. | [client/src/pages/App.jsx](../../client/src/pages/App.jsx), [client/src/components/SettingsDropdown.jsx](../../client/src/components/SettingsDropdown.jsx) |
| FR-008 | The system shall dynamically filter navigation links based on the authenticated user's role and assigned permissions. | [client/src/pages/App.jsx](../../client/src/pages/App.jsx) |
| FR-009 | The system shall provide clickable navigation to Home, Dashboard, Orders, Inventory, QC Register, Design Specs, and Finance pages (filtered by role). | [client/src/pages/App.jsx](../../client/src/pages/App.jsx) |
| FR-010 | The system shall retrieve and display a list of orders sorted by most recent order date. | [server/handlers/orders.go](../../server/handlers/orders.go), [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx) |
| FR-011 | The system shall allow creation of a new order with customer name, order type (OEM/ODM/Bespoke), item count, and unit price per item. | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx), [server/handlers/orders.go](../../server/handlers/orders.go), [server/db/schema.sql](../../server/db/schema.sql) |
| FR-011A | The system shall calculate order total amount as item_count × unit_price and persist the calculated value from the backend as the source of truth. | [server/handlers/orders.go](../../server/handlers/orders.go), [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx) |
| FR-012 | The system shall set the default status of a newly created order to Pending. | [server/handlers/orders.go](../../server/handlers/orders.go), [server/db/schema.sql](../../server/db/schema.sql) |
| FR-013 | The system shall allow users to search orders by customer name or order ID. | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx) |
| FR-014 | The system shall paginate order results with configurable items per page (default: 5). | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx) |
| FR-015 | The system shall display a detailed order slide-over panel when a user selects an order row, including status, type, timeline, and amounts. | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx) |
| FR-016 | The system shall retrieve and display inventory materials with total quantity, reserved quantity, warehouse location, and usable-for-finishing tag. | [server/handlers/inventory.go](../../server/handlers/inventory.go), [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx) |
| FR-017 | The system shall retrieve and display material reservation records linked to material names and order IDs. | [server/handlers/inventory.go](../../server/handlers/inventory.go), [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx) |
| FR-018 | The system shall allow creation of material reservations with material, order ID, quantity, purpose, and reserved-by fields. | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| FR-019 | The system shall validate that reservation quantity does not exceed available stock (total - reserved) before saving. | [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| FR-020 | The system shall update reserved stock totals when a reservation is successfully created. | [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| FR-021 | The system shall retrieve and display QC inspection records sorted by inspection date (most recent first). | [server/handlers/qc.go](../../server/handlers/qc.go), [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx) |
| FR-022 | The system shall allow users to submit QC inspection records with order ID, batch ID, product description, AQL level, result, defect count, inspector name, and optional notes. | [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx), [server/handlers/qc.go](../../server/handlers/qc.go) |
| FR-023 | The system shall allow filtering QC records by result status (All, Pass, Fail). | [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx) |
| FR-024 | The system shall allow users to create and view furniture design specifications including furniture type, primary finish, secondary finish, and special finishes, with finish options sourced only from inventory materials tagged usable for finishing. | [client/src/pages/construct.jsx](../../client/src/pages/construct.jsx), [server/handlers/constructions.go](../../server/handlers/constructions.go), [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| FR-025 | The system shall allow users to add a new inventory material with material name, unit, initial quantity, storage location, and a usable-for-finishing tag. | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| FR-026 | The system shall allow users to restock an existing inventory material by increasing total quantity using a positive added quantity value. | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| FR-027 | The system shall allow users to change an order status as a draft selection and persist it only when the user explicitly clicks Save/Update. | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx), [server/handlers/orders.go](../../server/handlers/orders.go) |
| FR-028 | The system shall record order lifecycle timestamps when status transitions occur, including started_at for In Progress and completed_at for Completed. | [server/handlers/orders.go](../../server/handlers/orders.go), [server/db/db.go](../../server/db/db.go) |
| FR-029 | The system shall allow QC users to look up an order by order ID and auto-fill essential inspection context fields from the retrieved order. | [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx), [server/handlers/orders.go](../../server/handlers/orders.go) |
| FR-030 | The system shall calculate finance income from completed orders and display updated totals and recent completed-order entries in the Finance view. | [server/handlers/dashboard.go](../../server/handlers/dashboard.go), [client/src/pages/finance.jsx](../../client/src/pages/finance.jsx) |
| FR-031 | The system shall provide an admin-only User Management page for creating new user accounts. | [client/src/pages/usermanagement.jsx](../../client/src/pages/usermanagement.jsx), [server/handlers/auth.go](../../server/handlers/auth.go) |
| FR-032 | The system shall allow admins to create new users by providing username, password, and role assignment. | [client/src/pages/usermanagement.jsx](../../client/src/pages/usermanagement.jsx), [server/handlers/auth.go](../../server/handlers/auth.go) |
| FR-033 | The system shall validate new user data (username uniqueness, password length, valid role) and reject invalid inputs with clear error messages. | [server/handlers/auth.go](../../server/handlers/auth.go), [client/src/pages/usermanagement.jsx](../../client/src/pages/usermanagement.jsx) |
| FR-034 | The system shall hash new user passwords with bcrypt before storage to ensure password security. | [server/handlers/auth.go](../../server/handlers/auth.go) |
| FR-035 | The system shall provide a role-restricted Production page where production staff can view assigned order details. | [client/src/pages/production.jsx](../../client/src/pages/production.jsx), [client/src/pages/App.jsx](../../client/src/pages/App.jsx) |
| FR-036 | The system shall allow production staff to update progress using a checklist workflow and derive progress percentage from completed checklist steps. | [client/src/pages/production.jsx](../../client/src/pages/production.jsx), [server/handlers/production.go](../../server/handlers/production.go), [server/db/schema.sql](../../server/db/schema.sql) |
| FR-037 | The system shall allow production staff to submit production progress only when checklist completion reaches 100%, recording submission timestamps and syncing order status transitions. | [client/src/pages/production.jsx](../../client/src/pages/production.jsx), [server/handlers/production.go](../../server/handlers/production.go), [server/handlers/orders.go](../../server/handlers/orders.go) |
| FR-038 | The system shall expose latest production assignment/progress metadata in order APIs so order detail views stay synchronized. | [server/handlers/orders.go](../../server/handlers/orders.go), [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx) |
| FR-039 | The system shall provide a QC Required Items list that shows production-submitted orders that still have no QC Pass result. | [server/handlers/qc.go](../../server/handlers/qc.go), [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx) |
| FR-040 | The system shall keep orders with latest QC result = Fail in the QC Required Items list until a subsequent QC Pass is recorded. | [server/handlers/qc.go](../../server/handlers/qc.go), [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx) |
| FR-041 | The system shall update order status to Completed only when QC result is Pass, and keep/revert to In Progress when QC result is Fail. | [server/handlers/qc.go](../../server/handlers/qc.go), [server/handlers/orders.go](../../server/handlers/orders.go) |
| FR-042 | The system shall expose a logistics dashboard showing shipment summary counters, ready-for-dispatch completed orders, and current shipment register data. | [client/src/pages/logistics.jsx](../../client/src/pages/logistics.jsx), [server/handlers/logistics.go](../../server/handlers/logistics.go) |
| FR-043 | The system shall allow logistics users to create a shipment plan for a completed order with destination, delivery method, vehicle code, driver name, priority, and optional schedule/notes. | [client/src/pages/logistics.jsx](../../client/src/pages/logistics.jsx), [server/handlers/logistics.go](../../server/handlers/logistics.go), [server/db/schema.sql](../../server/db/schema.sql) |
| FR-044 | The system shall reject shipment creation when the target order is not completed or when an active shipment already exists for that order. | [server/handlers/logistics.go](../../server/handlers/logistics.go), [server/db/schema.sql](../../server/db/schema.sql) |
| FR-045 | The system shall allow shipment updates for status and dispatch metadata (destination, vehicle, driver, delivery method, priority, scheduled dispatch, notes). | [client/src/pages/logistics.jsx](../../client/src/pages/logistics.jsx), [server/handlers/logistics.go](../../server/handlers/logistics.go) |
| FR-046 | The system shall auto-capture dispatched_at when shipment status transitions to Dispatched and delivered_at when status transitions to Delivered. | [server/handlers/logistics.go](../../server/handlers/logistics.go), [server/db/schema.sql](../../server/db/schema.sql) |
| FR-047 | The system shall restrict Inventory route access to Admin and Logistics Staff roles while still allowing production workflow updates through the Production module. | [client/src/pages/App.jsx](../../client/src/pages/App.jsx), [client/src/pages/production.jsx](../../client/src/pages/production.jsx) |
| FR-048 | The system shall record inventory opening stock as an expense entry when a new material is created with an initial quantity and unit cost. | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go), [server/db/schema.sql](../../server/db/schema.sql) |
| FR-049 | The system shall record inventory restock cost as an expense entry using the added quantity and unit cost when restocking material. | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go), [server/db/schema.sql](../../server/db/schema.sql) |
| FR-050 | The system shall exclude completed orders that already have a non-cancelled shipment from the dispatch planning queue, including delivered and returned shipments. | [client/src/pages/logistics.jsx](../../client/src/pages/logistics.jsx), [server/handlers/logistics.go](../../server/handlers/logistics.go) |

**Total Functional Requirements: 51**

---

## Non-Functional Requirements

Non-functional requirements describe quality attributes, constraints, and cross-cutting concerns of the system.

| ID | Requirement | Traceability |
|---|---|---|
| NFR-001 | **Security**: The system shall store user passwords as bcrypt hashes and never as plain text. | [server/handlers/auth.go](../../server/handlers/auth.go), [server/db/schema.sql](../../server/db/schema.sql) |
| NFR-002 | **Security**: The system shall enforce authentication checks for all protected frontend routes via token validation. | [client/src/pages/App.jsx](../../client/src/pages/App.jsx) |
| NFR-003 | **Security**: The system shall enforce role-based access control (RBAC) on the client-side by restricting page access and filtering navigation based on user roles. | [client/src/components/RoleBasedRoute.jsx](../../client/src/components/RoleBasedRoute.jsx), [client/src/pages/App.jsx](../../client/src/pages/App.jsx) |
| NFR-004 | **Reliability**: The system shall return API responses in JSON format with appropriate HTTP status codes (200, 201, 400, 401, 404, 500) for success and failure cases. | [server/handlers/auth.go](../../server/handlers/auth.go), [server/handlers/orders.go](../../server/handlers/orders.go), [server/handlers/inventory.go](../../server/handlers/inventory.go), [server/handlers/qc.go](../../server/handlers/qc.go), [server/handlers/constructions.go](../../server/handlers/constructions.go) |
| NFR-005 | **Data Integrity**: The system shall maintain data integrity using relational constraints, foreign keys, and controlled enumerations for status fields and roles. | [server/db/schema.sql](../../server/db/schema.sql) |
| NFR-006 | **Usability**: The system shall provide responsive UI behavior across desktop, tablet, and mobile layouts using TailwindCSS breakpoints. | [client/src/pages/App.jsx](../../client/src/pages/App.jsx), [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx), [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx), [client/src/pages/construct.jsx](../../client/src/pages/construct.jsx) |
| NFR-007 | **Usability**: The system shall provide clear user feedback for loading, success, and error states during all data operations with visual indicators and messages. | [client/src/pages/login.jsx](../../client/src/pages/login.jsx), [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx), [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx), [client/src/pages/construct.jsx](../../client/src/pages/construct.jsx) |
| NFR-008 | **Usability**: The system shall display the authenticated user's role in the header, providing clear indication of their access level and system capabilities. | [client/src/pages/App.jsx](../../client/src/pages/App.jsx) |
| NFR-009 | **Maintainability**: The system shall support maintainability through modular separation of concerns between handlers, pages, components, and database layer. | [server/handlers/orders.go](../../server/handlers/orders.go), [server/db/schema.sql](../../server/db/schema.sql), [client/src/pages/App.jsx](../../client/src/pages/App.jsx), [client/src/components/ThemeToggle.jsx](../../client/src/components/ThemeToggle.jsx) |
| NFR-010 | **Deployability**: The system shall support environment-based deployment configuration through .env files for service port and optional frontend proxy URL. | [server/main.go](../../server/main.go) |
| NFR-011 | **Deployability**: The system shall support both development mode (dynamic proxy to frontend dev server) and production mode (serving pre-built frontend assets). | [server/main.go](../../server/main.go) |
| NFR-012 | **Auditability**: The system shall timestamp all transactional records (orders, reservations, QC records, specifications) for traceability and audit trail. | [server/db/schema.sql](../../server/db/schema.sql) |
| NFR-013 | **Consistency**: The system shall preserve consistent domain vocabulary across UI labels, API field names, and database column names to reduce ambiguity and integration errors. | [server/db/schema.sql](../../server/db/schema.sql), [server/handlers/orders.go](../../server/handlers/orders.go), [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx) |
| NFR-014 | **Usability**: The system shall support user interface theme switching between light and dark modes without page reload using context state. | [client/src/components/ThemeToggle.jsx](../../client/src/components/ThemeToggle.jsx), [client/src/context/ThemeContext.jsx](../../client/src/context/ThemeContext.jsx), [client/src/pages/index.css](../../client/src/pages/index.css) |
| NFR-015 | **Data Integrity**: The system shall enforce positive quantity validation for material creation/restocking/reservation and reject inventory operations that would violate available stock constraints. | [server/handlers/inventory.go](../../server/handlers/inventory.go), [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx) |
| NFR-016 | **Auditability**: The system shall preserve and expose status transition timestamps (started_at, completed_at) in order APIs for traceable production lifecycle history. | [server/handlers/orders.go](../../server/handlers/orders.go), [server/db/db.go](../../server/db/db.go) |
| NFR-017 | **Consistency**: The system shall keep order ID usage consistent across Orders, QC, and Inventory workflows to support reliable lookup, autofill, and reservation linkage. | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx), [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx), [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/orders.go](../../server/handlers/orders.go) |
| NFR-018 | **Security**: The system shall restrict user creation functionality to Admin role only, preventing unauthorized user account creation. | [client/src/pages/usermanagement.jsx](../../client/src/pages/usermanagement.jsx), [server/handlers/auth.go](../../server/handlers/auth.go), [client/src/pages/App.jsx](../../client/src/pages/App.jsx) |
| NFR-019 | **Usability**: The system shall provide role permission reference information on the User Management page to guide admins when creating accounts. | [client/src/pages/usermanagement.jsx](../../client/src/pages/usermanagement.jsx) |
| NFR-020 | **Consistency**: The system shall use backend-computed derived values (for example, order total amount from quantity and unit price) as the authoritative persisted values to prevent client-server calculation drift. | [server/handlers/orders.go](../../server/handlers/orders.go), [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx) |
| NFR-021 | **Auditability**: The system shall retain shipment lifecycle timestamps (scheduled, dispatched, delivered, created, updated) to support dispatch traceability. | [server/handlers/logistics.go](../../server/handlers/logistics.go), [server/db/schema.sql](../../server/db/schema.sql) |
| NFR-022 | **Consistency**: The system shall use inventory-tagged finishing materials as the single source for finish option lists in design specification forms. | [client/src/pages/construct.jsx](../../client/src/pages/construct.jsx), [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| NFR-023 | **Consistency**: The system shall treat inventory material additions and restocks as finance-tracked expense events so cost and profit reporting includes material acquisition costs. | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go), [server/handlers/dashboard.go](../../server/handlers/dashboard.go), [client/src/pages/finance.jsx](../../client/src/pages/finance.jsx) |
| NFR-024 | **Reliability**: The system shall keep completed or returned logistics shipments out of the ready-for-dispatch planning list until a new eligible shipment workflow is created. | [client/src/pages/logistics.jsx](../../client/src/pages/logistics.jsx), [server/handlers/logistics.go](../../server/handlers/logistics.go) |

**Total Non-Functional Requirements: 24**

---

## System Assumptions

1. Users are authenticated staff members with access to the BoonSunClon internal network.
2. The database is MySQL 8.0+ running on a shared internal server.
3. The frontend is served via Vite during development and pre-built during production.
4. Order types are limited to OEM, ODM, and Bespoke as defined in business domain.
5. Order pricing uses unit price and item count; total amount is computed and persisted by the backend.
6. QC inspection levels follow AQL (Acceptable Quality Level) standards: 0.65, 1.0, 1.5, 2.5, 4.0, 6.5.
7. All timestamps are recorded in UTC and converted to local time in UI as needed.
8. Material reservations are immutable once created; status changes are restricted to Active or Released.
9. The system implements role-based access control (RBAC) with five specialized roles, each focused on specific job functions:
   - **Admin**: Full system access for administrators and supervisors.
   - **Sale Staff**: Order management and financial tracking (sales/customer-facing operations).
   - **Quality Controller**: QC inspections and quality assurance only (specialized QA role).
   - **Logistics Staff**: Inventory management and material handling (warehouse/logistics operations).
   - **Production**: Assigned-order execution with timestamped progress updates and submissions.
10. Production progress is checklist-driven; submission requires 100% checklist completion.
11. Each user is assigned exactly one role at account creation; role changes require admin intervention.
12. User roles are returned during login and stored in the browser's localStorage for client-side authorization checks.
13. The generic "Staff User" role has been removed; all staff use specific role-based accounts (Sale Staff, Logistics Staff, Quality Controller, or Production).

---

## Constraints & Limitations

- **No real-time synchronization**: Changes made by one user are not instantly reflected for others; users must refresh to see updates.
- **No file upload**: Design specifications do not currently support image uploads; image_url is a placeholder field.
- **Single authentication token**: Session tokens are stored in browser localStorage without expiration; logout is client-side only.
- **Limited reporting**: Finance page provides summary-level income/expense/profit and recent activity; advanced forecasting and drill-down analytics are not implemented.
- **No multi-language support**: All UI text is in English only.
- **Client-side role enforcement**: Role-based access control is enforced on the frontend; sensitive operations should implement server-side authorization checks as well.
- **No role modification UI**: Role assignment and modification currently require direct database updates; an admin interface for user management is not yet implemented.
- **No real-time push updates**: QC Required and Production views rely on API refresh cycles rather than websocket-based live synchronization.

---

## Traceability Matrix Summary

| Artifact | Count | Notes |
|---|---|---|
| Functional Requirements | 51 | Cover authentication, order pricing, order lifecycle, inventory, finishing-tag rules, QC, production workflow, logistics dispatch, inventory expense tracking, design specification, and finance aggregation domains. |
| Non-Functional Requirements | 24 | Address security, reliability, usability, maintainability, deployability, auditability, consistency, and data integrity. |
| Handler Files | 8 | auth, orders, inventory, qc, constructions, dashboard, production, logistics |
| Frontend Pages | 10 | login, home, dashboard, orderdetail, inventory, qc, production, construct, logistics, finance |
| Database Tables | 10 | users, orders, supplies, constructions, inventory_materials, material_reservations, logistics_shipments, qc_records, production_assignments, production_progress |

---

## Sign-Off

| Role | Name | Date | Signature |
|---|---|---|---|
| Requirements Analyst | — | — | — |
| Project Manager | — | — | — |
| Technical Lead | — | — | — |

---

*Generated: April 2026*