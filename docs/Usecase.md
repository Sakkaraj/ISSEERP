# Use Case Diagram & Narratives — BoonSunClon ERP System

**Project:** BoonSunClon ERP Portal  
**System:** Internal Information System for Furniture Manufacturing  
**Date:** April 2026  
**Version:** 1.0

---

## System Use Case Overview

### Actors
- **Staff User**: Authenticated users who operate the ERP system by role
- **System**: Backend services, database, and client-side route protection

### System Boundary
The diagram below is the source of truth for the current use-case model. It contains 28 use cases across 7 modules.

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

## Coverage Notes

- The current codebase implements the core order, inventory, QC, production, dashboard, finance, and login flows shown in the diagram.
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

### UC-016 Submit QC Inspection Record

- QC staff submit order-linked inspection data with AQL, result, defect count, and inspector name.
- Backend stores the record and updates the linked order status according to the QC result.

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