# Use Case Diagram & Narratives — BoonSunClon ERP System

**Project:** BoonSunClon ERP Portal  
**System:** Internal Information System for Furniture Manufacturing  
**Date:** April 2026  
**Version:** 1.0

---

## System Use Case Overview

### Actors
- **Staff User**: Authenticated users responsible for order management, inventory control, QC inspection, and design specification entry
- **System**: Automated backend processes for authentication, data validation, and persistence

### System Boundary
The BoonSunClon ERP system encompasses the following use case scope:
                      ┌─────────────────────────────┐
                      │   BoonSunClon ERP System    │
                      └─────────────────────────────┘
                    /                               \
                   /                                 \
     ┌─────────────────────────────────────────────────────┐
     │                                                     │
┌────────┐  Login & Authentication                        │
│  Staff │  ├─ UC-001: Login to System                    │
│  User  │  ├─ UC-002: Logout from System                 │
│        │  │                                              │
│        │  Order Management                               │
│        │  ├─ UC-003: View Order List                     │
│        │  ├─ UC-004: Create New Order                    │
│        │  ├─ UC-005: Search Orders                       │
│        │  ├─ UC-006: View Order Details                  │
│        │  ├─ UC-018: Update Order Status                 │
│        │  │                                              │
│        │  Inventory Management                           │
│        │  ├─ UC-007: View Inventory Materials            │
│        │  ├─ UC-008: Reserve Material for Order <<Extend UC-004>>
│        │  ├─ UC-009: View Material Reservations          │
│        │  ├─ UC-019: Add New Inventory Material          │
│        │  ├─ UC-020: Restock Inventory Material          │
│        │  │                                              │
│        │  Quality Control                                │
│        │  ├─ UC-010: View QC Records                     │
│        │  ├─ UC-011: Submit QC Inspection Record         │
│        │  ├─ UC-012: Filter QC Results                   │
│        │  ├─ UC-021: Lookup Order for QC Autofill        │
│        │  │                                              │
│        │  Design & Specifications                        │
│        │  ├─ UC-013: View Design Specifications          │
│        │  ├─ UC-014: Create Design Specification         │
│        │  │                                              │
│        │  Other Features                                 │
│        │  ├─ UC-015: Navigate System Pages               │
│        │  ├─ UC-016: Toggle Theme Mode                   │
│        │  └─ UC-017: View Dashboard & Finance            │
     │                                                     │
     └─────────────────────────────────────────────────────┘

### Use Case to Functional Requirement Mapping

| Use Case | ID | Functional Requirements |
|----------|----|----|
| Login to System | UC-001 | FR-001, FR-002, FR-003, FR-004 |
| Logout from System | UC-002 | FR-006 |
| View Order List | UC-003 | FR-008, FR-012 |
| Create New Order | UC-004 | FR-009, FR-010 |
| Search Orders | UC-005 | FR-011 |
| View Order Details | UC-006 | FR-013 |
| View Inventory Materials | UC-007 | FR-014 |
| Reserve Material for Order | UC-008 | FR-016, FR-017, FR-018 |
| View Material Reservations | UC-009 | FR-015 |
| View QC Records | UC-010 | FR-019 |
| Submit QC Inspection Record | UC-011 | FR-020 |
| Filter QC Results | UC-012 | FR-021 |
| View Design Specifications | UC-013 | FR-022 |
| Create Design Specification | UC-014 | FR-022 |
| Navigate System Pages | UC-015 | FR-007 |
| Toggle Theme Mode | UC-016 | NFR-012 |
| View Dashboard & Finance | UC-017 | FR-028 |
| Update Order Status | UC-018 | FR-025, FR-026 |
| Add New Inventory Material | UC-019 | FR-023 |
| Restock Inventory Material | UC-020 | FR-024 |
| Lookup Order for QC Autofill | UC-021 | FR-027 |

---

## Primary Use Case Narratives

### Use Case 1: Login to System

**Use Case ID:** UC-001  
**Title:** Login to System  
**Primary Actor:** Staff User  
**Supporting System:** BoonSunClon ERP Backend  
**Preconditions:**
- User has valid credentials (username and password)
- System is running and database is accessible
- User is not currently authenticated

**Main Flow:**
1. User navigates to the login page
2. User enters username in the username field
3. User enters password in the password field
4. User clicks the "Login" button
5. System submits credentials to backend authentication handler
6. Backend authenticates credentials against stored user records using bcrypt verification
7. Backend validates credentials match a valid user record
8. Backend generates and returns authentication token
9. Client stores authentication token in browser localStorage
10. System redirects user to the Dashboard page
11. User is now authenticated and can access protected pages

**Alternative Flows:**

**Alternative 1: Invalid Username**
- At step 6: Backend cannot find user record matching the entered username
- Backend returns 401 Unauthorized response with error message "Invalid username or password"
- System displays error message on login page
- User remains on login page and can retry with different credentials

**Alternative 2: Invalid Password**
- At step 6: Backend finds user record but bcrypt verification fails
- Backend returns 401 Unauthorized response with error message "Invalid username or password"
- System displays error message on login page
- User remains on login page and can retry with different credentials

**Alternative 3: Server Error**
- At step 5: Backend service is unavailable or database connection fails
- Backend returns 500 Internal Server Error
- System displays error message "Unable to connect to server. Please try again."
- User remains on login page and can retry

**Postconditions:**
- On success: User is authenticated, token stored in localStorage, user redirected to dashboard, protected pages are now accessible
- On failure: User remains on login page, authentication token not created, protected pages remain inaccessible
- Security: Password is transmitted over HTTPS; stored passwords in database are bcrypt-hashed

---

### Use Case 2: Create New Order

**Use Case ID:** UC-004  
**Title:** Create New Order  
**Primary Actor:** Staff User  
**Supporting System:** BoonSunClon ERP Backend  
**Preconditions:**
- User is authenticated and has valid session token
- User has navigated to the Orders page
- Database is accessible and accepting inserts
- User has permission to create orders (no role restrictions currently enforced)

**Main Flow:**
1. User clicks the "Create Order" or "New Order" button
2. System displays order creation form with fields:
   - Customer Name (required text field)
   - Order Type (required dropdown: OEM, ODM, or Bespoke)
   - Amount (required numeric field for total order value)
   - Item Count (required numeric field for quantity of items)
3. User enters customer name (e.g., "Acme Furniture Co")
4. User selects order type from dropdown (e.g., "OEM")
5. User enters amount (e.g., "15000")
6. User enters item count (e.g., "50")
7. User clicks "Submit" button
8. System validates all required fields are populated
9. System sends order creation request to backend with all fields
10. Backend validates input data (non-empty strings, positive numeric values)
11. Backend creates new order record with:
    - Customer name
    - Order type
    - Amount
    - Item count
    - Status set to "Pending" (default)
    - Order date set to current timestamp
12. Backend returns 201 Created with new order details including order ID
13. System displays success message "Order created successfully"
14. System adds new order to the top of the orders list (most recent first)
15. System clears the form or navigates user back to orders list
16. User can now reserve materials for this order or proceed with other tasks

**Alternative Flows:**

**Alternative 1: Validation Error - Missing Required Fields**
- At step 8: Form has empty customer name, order type, amount, or item count
- System displays validation error message highlighting missing fields
- User remains on form and can fill in missing information
- User clicks Submit again

**Alternative 2: Validation Error - Invalid Numeric Values**
- At step 10: Amount or item count are negative, zero, or non-numeric
- Backend returns 400 Bad Request with error message "Amount and item count must be positive numbers"
- System displays error message on form
- User can correct input and retry

**Alternative 3: Invalid Order Type**
- At step 6: User attempts to submit with invalid order type (not OEM, ODM, or Bespoke)
- System displays validation error "Order type must be OEM, ODM, or Bespoke"
- User can select valid type from dropdown

**Alternative 4: Database Error**
- At step 11: Database connection fails or insert operation fails
- Backend returns 500 Internal Server Error
- System displays error message "Unable to create order. Please try again."
- User can retry submission

**Alternative 5: Server Timeout**
- At step 9: Request times out before backend responds
- System displays error message "Request timed out. Please check your connection and try again."
- User can retry

**Postconditions:**
- On success: Order record created in database with initial status "Pending", order ID assigned, order appears in list sorted by date descending, user can now proceed with material reservations or QC activities for this order
- On failure: No order record created, user remains on form or returns to list with error message displayed
- Side effects: Order date timestamp recorded, order ID auto-generated and returned to user

---

### Use Case 3: Reserve Material for Order

**Use Case ID:** UC-008  
**Title:** Reserve Material for Order  
**Primary Actor:** Staff User  
**Supporting System:** BoonSunClon ERP Backend, Inventory Management System  
**Preconditions:**
- User is authenticated and has valid session token
- User has navigated to the Inventory page
- A valid order exists in the system (created via UC-004)
- Materials exist in inventory with quantity available
- Database is accessible
- <<Includes>> UC-004 (Create New Order) - Order must exist before reservation

**Main Flow:**
1. User navigates to the Inventory page
2. System retrieves and displays list of available inventory materials with:
   - Material name
   - Total quantity
   - Reserved quantity
   - Available quantity (total - reserved)
   - Warehouse location
3. User identifies a material needed for an order (e.g., "Oak Wood - 2x4")
4. User clicks the "Reserve" button for that material
5. System displays material reservation form with pre-populated material name and fields for:
   - Material Name (read-only, pre-populated)
   - Order ID (required dropdown or text field showing recent orders)
   - Quantity to Reserve (required numeric field)
   - Purpose (required text field, e.g., "Frame construction", "Finishing")
   - Reserved By (required text field, defaults to logged-in user)
6. User selects the order ID for which material is needed
7. User enters quantity to reserve (e.g., "25 units")
8. User enters purpose (e.g., "Oak frame for chairs - Order 1001")
9. User enters or confirms reserved-by name (auto-filled with current user)
10. User clicks "Submit" or "Create Reservation" button
11. System validates all required fields are populated and numeric
12. System sends reservation request to backend with:
    - Material ID
    - Order ID
    - Quantity
    - Purpose
    - Reserved-by user name
13. Backend retrieves current inventory record for material
14. Backend calculates available stock: total_quantity - reserved_quantity
15. Backend validates: reservation_quantity ≤ available_stock
16. Validation passes: Backend updates inventory record:
    - Increments reserved_quantity by reservation_quantity
    - Creates new material_reservation record with all details
    - Records timestamp of reservation
17. Backend returns 201 Created with reservation confirmation including reservation ID
18. System displays success message "Material reservation created: 25 units of Oak Wood reserved for Order 1001"
19. System updates inventory display showing new reserved quantities
20. System displays the new reservation in the Material Reservations list
21. User sees confirmation and can proceed to reserve additional materials or move to next task

**Alternative Flows:**

**Alternative 1: Insufficient Stock Available**
- At step 15: Requested quantity exceeds available stock
  - Available stock = 100 units
  - User requests 120 units
- Backend returns 400 Bad Request with error message "Insufficient stock. Available: 100 units, Requested: 120 units"
- System displays error message with specific available quantity
- User can either:
  - Reduce reservation quantity to available amount and resubmit
  - Cancel reservation and notify management that stock is insufficient
  - Reserve partial quantity now and reserve remainder later

**Alternative 2: Invalid Order ID**
- At step 6: User enters non-existent order ID
- Backend validation fails: Order ID not found in orders table
- Backend returns 404 Not Found with error "Order ID 9999 does not exist"
- System displays error message
- User must select valid order ID from dropdown

**Alternative 3: Invalid Quantity**
- At step 11: Quantity is zero, negative, or non-numeric
- System displays validation error "Quantity must be a positive number"
- User corrects quantity and resubmits

**Alternative 4: Database Concurrency Issue**
- At step 14-15: Between backend retrieval and update, another user has already reserved stock
- Backend recalculates available stock and finds insufficient inventory
- Backend returns 409 Conflict "Another reservation was just created. Available stock is now: 80 units. Please adjust your reservation."
- User can retry with adjusted quantity

**Alternative 5: Database Error**
- At step 16: Database insert fails (connection lost, disk full, etc.)
- Backend returns 500 Internal Server Error with "Unable to create reservation. Please try again."
- System displays error message
- User can retry

**Postconditions:**
- On success: Material reservation created with unique reservation ID, inventory reserved_quantity updated, user sees confirmation, material appears less available for future reservations, reservation can be viewed in Material Reservations list with filtering/search capability
- On failure: No reservation created, inventory quantities unchanged, user can retry with adjusted parameters
- Integration: Reservation links material and order, enabling QC to verify correct materials were used, enabling financial tracking to allocate costs
- Side effects: Reduced available inventory for that material, audit trail timestamp recorded, user name recorded as "reserved by"

---

### Use Case 4: Update Order Status

**Use Case ID:** UC-018  
**Title:** Update Order Status  
**Primary Actor:** Staff User  
**Preconditions:**
- User is authenticated
- User has opened an order in the order details panel

**Main Flow:**
1. User selects a new status value from the status dropdown
2. System stores the selected status as an unsaved draft
3. User clicks the explicit Save/Update action
4. System sends a PATCH request with order ID and selected status
5. Backend validates status against allowed values
6. Backend updates order status and applies lifecycle timestamps when applicable
7. System shows success feedback and refreshes order timeline fields

**Postconditions:**
- Order status is updated only after explicit user confirmation
- started_at and completed_at are updated according to transition rules

---

### Use Case 5: Add or Restock Inventory Material

**Use Case IDs:** UC-019, UC-020  
**Title:** Add or Restock Inventory Material  
**Primary Actor:** Staff User  
**Preconditions:**
- User is authenticated
- User has navigated to Inventory page

**Main Flow (Add Material - UC-019):**
1. User opens the Add Material form
2. User enters material name, unit, initial quantity, and location
3. System validates required fields and non-negative quantity
4. Backend creates the material record and returns created ID

**Main Flow (Restock Material - UC-020):**
1. User selects an existing material to restock
2. User enters added quantity
3. System validates that added quantity is greater than zero
4. Backend increments total quantity for the target material

**Postconditions:**
- Material catalog can be expanded and replenished without direct database access

---

### Use Case 6: Lookup Order for QC Autofill

**Use Case ID:** UC-021  
**Title:** Lookup Order for QC Autofill  
**Primary Actor:** Staff User  
**Preconditions:**
- User is authenticated
- User is in the QC inspection form

**Main Flow:**
1. User enters order ID in QC form
2. User triggers lookup action
3. System requests order details from Orders API
4. System auto-fills batch/product context fields when order is found
5. User reviews, adjusts if needed, and submits QC record

**Postconditions:**
- QC entries are faster and more consistent with source order data

---

## Relationships & Dependencies

### Use Case Include/Extend Relationships

- **UC-004 (Create New Order)** ← **UC-008 (Reserve Material for Order)**  
  - Relationship: UC-008 is dependent on UC-004 (<<__Includes__>>)
  - Rationale: Cannot reserve material without an existing order
  - Sequence: Create Order (UC-004) → Reserve Materials (UC-008) → QC Inspection (UC-011)

- **UC-001 (Login)** ← **All other use cases**  
  - Relationship: All system use cases include authentication (<<__Includes__>>)
  - Rationale: All operations require valid session token
  - Precondition: UC-001 must complete successfully before any other use case executes

### Actor Relationships

| Actor | Primary Use Cases | Secondary Use Cases |
|-------|------------------|-------------------|
| Staff User | UC-001, UC-004, UC-008, UC-011, UC-014, UC-018, UC-019, UC-020, UC-021 | UC-003, UC-005, UC-006, UC-007, UC-009, UC-010, UC-012, UC-013, UC-015, UC-016, UC-017 |
| System (Backend) | Authentication, Validation, Persistence | Data aggregation, Business logic enforcement |

---

## Cross-Reference: Use Cases to Requirements

**Covered by Three Primary Use Cases:**
- UC-001: Covers FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-002, NFR-003
- UC-004: Covers FR-009, FR-010, NFR-005, NFR-006
- UC-008: Covers FR-016, FR-017, FR-018, NFR-004, NFR-005, NFR-006

**Total Requirements Covered by Primary Use Cases:** 13 of 28 Functional Requirements + 5 of 15 Non-Functional Requirements

---

*Generated: April 2026*