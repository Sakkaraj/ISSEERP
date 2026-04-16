# Use Case Diagram & Narratives — BoonSunClon ERP System

**Project:** BoonSunClon ERP Portal  
**System:** Internal Information System for Furniture Manufacturing  
**Date:** April 2026  
**Version:** 1.1

---

## System Use Case Overview

### Actors
- **Staff User**: Authenticated users who operate the ERP system by role
- **System**: Backend services, database, and client-side route protection

### System Boundary
The diagram below is the source of truth for the current use-case model. It contains 37 use cases across 8 modules.

```
Login & Authentication
  UC-001 Login to System
  UC-002 Logout from System

Order Management
  UC-003 View Order List
  UC-004 Create New Order
  UC-005 Search Orders
  UC-006 View Order Details
  UC-007 Update Order Status
  UC-008 View Assigned Orders

Inventory Management
  UC-009 Request Material Reservation
  UC-010 View Inventory Materials
  UC-011 Reserve Material for Order
  UC-012 View Material Reservations
  UC-013 Add New Inventory Material
  UC-014 Restock Inventory Material
  UC-029 Tag Material as Usable for Finishing

Production staff can also browse inventory materials for finishing lookup; the tagged material list is the source for design-spec finish selection.

Quality Control
  UC-015 View QC Records
  UC-016 Submit QC Inspection Record
  UC-017 Filter QC Results
  UC-018 Lookup Order for QC Autofill

Design & Specifications
  UC-022 View Design Specifications
  UC-023 Create Design Specifications
  UC-024 Upload Partner Design
  UC-025 Approve Design Specifications
  UC-030 Filter Finish Options by Tagged Materials

Logistics Dispatch
  UC-031 View Logistics Dispatch Dashboard
  UC-032 Create Shipment for Completed Order
  UC-033 Update Shipment Status and Dispatch Details
  UC-034 View Ready Orders for Dispatch
  UC-035 Record Inventory Opening Stock Expense
  UC-036 Record Inventory Restock Expense
  UC-037 Exclude Closed Shipments from Planning Queue

Production Management
  UC-026 Update Production Progress
  UC-027 Submit Production Progress

Other Features
  UC-019 Navigate System Page
  UC-020 Toggle Theme Mode
  UC-021 View Dashboard and Finance
  UC-028 Assign/Add New User
```

## Use Case Catalog

| ID | Module | Use Case | Current Status | Code Coverage |
|---|---|---|---|---|
| UC-001 | Login & Authentication | Login to System | Implemented | [client/src/pages/login.jsx](../../client/src/pages/login.jsx), [server/handlers/auth.go](../../server/handlers/auth.go) |
| UC-002 | Login & Authentication | Logout from System | Implemented | [client/src/pages/App.jsx](../../client/src/pages/App.jsx), [client/src/components/SettingsDropdown.jsx](../../client/src/components/SettingsDropdown.jsx) |
| UC-003 | Order Management | View Order List | Implemented | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx), [server/handlers/orders.go](../../server/handlers/orders.go) |
| UC-004 | Order Management | Create New Order | Implemented | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx), [server/handlers/orders.go](../../server/handlers/orders.go) |
| UC-005 | Order Management | Search Orders | Implemented | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx) |
| UC-006 | Order Management | View Order Details | Implemented | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx) |
| UC-007 | Order Management | Update Order Status | Implemented | [client/src/pages/orderdetail.jsx](../../client/src/pages/orderdetail.jsx), [server/handlers/orders.go](../../server/handlers/orders.go) |
| UC-008 | Order Management | View Assigned Orders | Implemented | [client/src/pages/production.jsx](../../client/src/pages/production.jsx), [server/handlers/production.go](../../server/handlers/production.go) |
| UC-009 | Inventory Management | Request Material Reservation | Partial | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx) |
| UC-010 | Inventory Management | View Inventory Materials | Implemented | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| UC-011 | Inventory Management | Reserve Material for Order | Implemented | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| UC-012 | Inventory Management | View Material Reservations | Implemented | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| UC-013 | Inventory Management | Add New Inventory Material | Implemented | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| UC-014 | Inventory Management | Restock Inventory Material | Implemented | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| UC-015 | Quality Control | View QC Records | Implemented | [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx), [server/handlers/qc.go](../../server/handlers/qc.go) |
| UC-016 | Quality Control | Submit QC Inspection Record | Implemented | [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx), [server/handlers/qc.go](../../server/handlers/qc.go) |
| UC-017 | Quality Control | Filter QC Results | Implemented | [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx) |
| UC-018 | Quality Control | Lookup Order for QC Autofill | Implemented | [client/src/pages/qc.jsx](../../client/src/pages/qc.jsx), [server/handlers/orders.go](../../server/handlers/orders.go) |
| UC-019 | Other Features | Navigate System Page | Implemented | [client/src/pages/App.jsx](../../client/src/pages/App.jsx) |
| UC-020 | Other Features | Toggle Theme Mode | Implemented | [client/src/components/ThemeToggle.jsx](../../client/src/components/ThemeToggle.jsx), [client/src/context/ThemeContext.jsx](../../client/src/context/ThemeContext.jsx) |
| UC-021 | Other Features | View Dashboard and Finance | Implemented | [client/src/pages/dashboard.jsx](../../client/src/pages/dashboard.jsx), [client/src/pages/finance.jsx](../../client/src/pages/finance.jsx) |
| UC-022 | Design & Specifications | View Design Specifications | Implemented | [client/src/pages/construct.jsx](../../client/src/pages/construct.jsx), [server/handlers/constructions.go](../../server/handlers/constructions.go) |
| UC-023 | Design & Specifications | Create Design Specifications | Implemented | [client/src/pages/construct.jsx](../../client/src/pages/construct.jsx), [server/handlers/constructions.go](../../server/handlers/constructions.go) |
| UC-024 | Design & Specifications | Upload Partner Design | Not implemented | No current client or server handler exists |
| UC-025 | Design & Specifications | Approve Design Specifications | Not implemented | No current client or server handler exists |
| UC-026 | Production Management | Update Production Progress | Implemented | [client/src/pages/production.jsx](../../client/src/pages/production.jsx), [server/handlers/production.go](../../server/handlers/production.go) |
| UC-027 | Production Management | Submit Production Progress | Implemented | [client/src/pages/production.jsx](../../client/src/pages/production.jsx), [server/handlers/production.go](../../server/handlers/production.go), [server/handlers/orders.go](../../server/handlers/orders.go) |
| UC-028 | Other Features | Assign/Add New User | Partial | [client/src/pages/usermanagement.jsx](../../client/src/pages/usermanagement.jsx), [server/handlers/auth.go](../../server/handlers/auth.go) |
| UC-029 | Inventory Management | Tag Material as Usable for Finishing | Implemented | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go), [server/db/schema.sql](../../server/db/schema.sql) |
| UC-030 | Design & Specifications | Filter Finish Options by Tagged Materials | Implemented | [client/src/pages/construct.jsx](../../client/src/pages/construct.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go) |
| UC-031 | Logistics Dispatch | View Logistics Dispatch Dashboard | Implemented | [client/src/pages/logistics.jsx](../../client/src/pages/logistics.jsx), [server/handlers/logistics.go](../../server/handlers/logistics.go) |
| UC-032 | Logistics Dispatch | Create Shipment for Completed Order | Implemented | [client/src/pages/logistics.jsx](../../client/src/pages/logistics.jsx), [server/handlers/logistics.go](../../server/handlers/logistics.go), [server/db/schema.sql](../../server/db/schema.sql) |
| UC-033 | Logistics Dispatch | Update Shipment Status and Dispatch Details | Implemented | [client/src/pages/logistics.jsx](../../client/src/pages/logistics.jsx), [server/handlers/logistics.go](../../server/handlers/logistics.go) |
| UC-034 | Logistics Dispatch | View Ready Orders for Dispatch | Implemented | [client/src/pages/logistics.jsx](../../client/src/pages/logistics.jsx), [server/handlers/logistics.go](../../server/handlers/logistics.go), [server/handlers/orders.go](../../server/handlers/orders.go) |
| UC-035 | Inventory Management | Record Inventory Opening Stock Expense | Implemented | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go), [server/handlers/dashboard.go](../../server/handlers/dashboard.go) |
| UC-036 | Inventory Management | Record Inventory Restock Expense | Implemented | [client/src/pages/inventory.jsx](../../client/src/pages/inventory.jsx), [server/handlers/inventory.go](../../server/handlers/inventory.go), [server/handlers/dashboard.go](../../server/handlers/dashboard.go) |
| UC-037 | Logistics Dispatch | Exclude Closed Shipments from Planning Queue | Implemented | [client/src/pages/logistics.jsx](../../client/src/pages/logistics.jsx), [server/handlers/logistics.go](../../server/handlers/logistics.go) |

## Coverage Notes

- The current codebase implements the core order, inventory, QC, production, dashboard, finance, and login flows shown in the diagram.
- Inventory materials now include a usable-for-finishing tag, and the design-spec finish selector only lists tagged materials.
- Production staff can view inventory materials for finishing lookup, even though inventory write operations remain handled through the inventory workflow.
- Logistics dispatch flows are implemented through the logistics dashboard, including shipment creation for completed orders and shipment status progression tracking.
- Inventory opening stock and restock actions now generate expense entries so finance totals include material acquisition costs.
- The dispatch planning queue excludes orders that already have delivered or returned shipments.
- Inventory route-level access is currently limited to Admin and Logistics Staff in frontend permissions; production workflow remains available via the Production module.
- UC-024 and UC-025 from the diagram are not implemented in the current repository.
- UC-009 exists only as a reservation entry point; the implemented flow is exposed through the inventory reservation forms and endpoints.
- UC-028 is partially implemented because user creation exists, but there is no server-side authorization check enforcing Admin-only access.
- The frontend enforces page access with local role checks, but authentication is still based on a stored token value rather than a verifiable session.

## Main Narrative Flows

### UC-001 Login to System

- User enters username and password on the login page.
- Frontend submits the credentials to the backend login handler.
- Backend verifies the password with bcrypt and returns the user role.
- Frontend stores the returned token, role, and username in localStorage.
- User is redirected to the dashboard and gains access to role-allowed pages.

### UC-004 Create New Order

- User opens the order form and enters customer name, order type, unit price, and item count.
- Backend validates the request and calculates total amount from unit price times item count.
- New orders are saved with status Pending and appear at the top of the list.

### UC-011 Reserve Material for Order

- User opens the inventory page, selects a material, and creates a reservation for an order.
- Backend checks available stock, rejects over-allocation, and updates reserved quantity on success.
- The reservation is stored and visible in the reservation list.

### UC-029 and UC-030 Finishing Material Eligibility and Selection

- Logistics or admin users create materials with a usable-for-finishing checkbox flag.
- Inventory list exposes each material with a finishing eligibility tag.
- Design specification form loads finish dropdown options from only tagged materials.
- Primary and secondary finish validation rejects values not present in the tagged material set.

### UC-016 Submit QC Inspection Record

- QC staff submit order-linked inspection data with AQL, result, defect count, and inspector name.
- Backend stores the record and updates the linked order status according to the QC result.

### UC-032 Create Shipment for Completed Order

- Logistics staff opens the dispatch dashboard and selects a completed order from Ready Orders.
- User provides destination, vehicle, driver, dispatch method, priority, and optional schedule/notes.
- Backend validates order completion and ensures no active shipment already exists.
- Shipment record is created with generated shipment code and appears in the shipment register.

### UC-035 and UC-036 Record Inventory Expense

- User enters a unit cost when adding a new inventory material with opening stock.
- User enters a unit cost when restocking an existing material.
- Backend writes a corresponding expense entry to the supplies table for finance reporting.
- Finance totals reflect these material acquisition costs in total expenses and net profit.

### UC-037 Exclude Closed Shipments from Planning Queue

- Logistics dashboard only lists completed orders that do not already have a non-cancelled shipment.
- Delivered and returned shipments remain in the shipment register but do not reappear as ready-for-dispatch items.
- The planning queue remains focused on eligible, unshipped completed orders.

### UC-026 and UC-027 Production Progress

- Production staff update checklist progress for assigned orders.
- Completion can be submitted only when the checklist reaches 100 percent.
- Submission timestamps and order status transitions are recorded by the backend.

## Relationship Notes

- Login is a prerequisite for all protected use cases.
- Reservation depends on an existing order.
- Production submissions feed QC required-items logic.
- QC pass transitions an order to Completed, while QC fail keeps it In Progress.

*Generated: April 2026*