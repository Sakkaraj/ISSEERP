# Narrative Use Cases — BoonSunClon ERP System

This document provides three detailed use case narratives using a formal structure: use case ID, title, actors, preconditions, trigger, normal flow, alternative or unsuccessful flows, and postconditions.

---

## Use Case 1

### Use Case ID
UC-004

### Use Case Title
Create New Order

### Primary Actor
Staff User (Sales or Order Management Staff)

### Supporting Actors
System (ERP Client, Backend API, Database)

### Goal
Create a valid customer order record so the production and fulfillment lifecycle can begin.

### Preconditions
1. User is authenticated in the ERP system.
2. User has permission to access the Order Management module.
3. Order service and database are available.

### Trigger
User selects the action to create a new order from the Order Management page.

### Normal Flow
1. User opens the Order Management page.
2. System loads and displays the order list and order creation controls.
3. User clicks Create New Order.
4. System displays an order form with required fields.
5. User enters customer name.
6. User selects or enters order type.
7. User enters unit price.
8. User enters item quantity.
9. User confirms and submits the form.
10. System validates required fields are not empty.
11. System validates numeric fields (unit price and quantity) are valid positive numbers.
12. System calculates total amount = unit price x quantity.
13. System assigns default business values (for example, initial status Pending and creation timestamp).
14. System writes the new order record into the database.
15. System returns success response with created order data.
16. System refreshes order list view.
17. User sees the newly created order and success confirmation.

### Alternative or Exception Flows

#### A1: Required Field Missing
1. At validation step, System detects missing required field(s).
2. System does not save the order.
3. System highlights missing fields and shows validation message.
4. User corrects fields and resubmits.

#### A2: Invalid Numeric Value
1. At validation step, System detects invalid unit price or quantity (non-number, zero, or negative value).
2. System rejects submission.
3. System displays clear error message for invalid input.
4. User enters valid values and resubmits.

#### A3: Backend or Database Failure
1. System receives submit request but fails to insert record due to server or database error.
2. System returns error response.
3. User sees failure notification.
4. No order record is created.
5. User can retry after issue is resolved.

#### A4: Session Expired During Submission
1. Submit request is sent with expired or invalid authentication token.
2. Backend returns unauthorized response.
3. System redirects user to login page or asks user to re-authenticate.
4. Unsaved data may need to be re-entered depending on UI behavior.

### Postconditions
1. If successful, a new order exists in the database with a valid initial status.
2. If unsuccessful, no partial order record is committed.
3. Audit-related fields (such as creation timestamp) are captured for successful creation.

---

## Use Case 2

### Use Case ID
UC-011

### Use Case Title
Reserve Material for Order

### Primary Actor
Staff User (Inventory Staff)

### Supporting Actors
System (Inventory Module, Order Validation Logic, Backend API, Database)

### Goal
Reserve required inventory quantity for a specific order without exceeding available stock.

### Preconditions
1. User is authenticated and has access to inventory features.
2. The target order exists and is eligible for material reservation.
3. The selected material exists in inventory.
4. Inventory data is current and available.

### Trigger
User initiates reservation from inventory page for a selected material and order.

### Normal Flow
1. User opens Inventory Management page.
2. System displays materials list with stock information.
3. User selects a material to reserve.
4. User clicks Reserve action.
5. System opens reservation form.
6. System shows material details including available quantity and already reserved quantity.
7. User selects or enters target order ID.
8. User enters reservation quantity.
9. User submits reservation request.
10. System validates material exists and is active.
11. System validates order ID exists.
12. System validates requested quantity is a positive integer.
13. System checks stock rule: available quantity must be greater than or equal to requested quantity.
14. System updates inventory reservation totals.
15. System creates reservation record linked to order and material.
16. System returns success response.
17. System refreshes reservation and inventory display.
18. User sees updated quantities and success message.

### Alternative or Exception Flows

#### B1: Insufficient Stock
1. At stock check step, requested quantity is greater than available quantity.
2. System rejects reservation request.
3. System shows Insufficient stock message.
4. No inventory update and no reservation record are created.
5. User may submit a lower quantity.

#### B2: Invalid Order ID
1. System cannot find the provided order ID.
2. System rejects request and displays Order not found message.
3. No stock is reserved.
4. User selects a valid order and retries.

#### B3: Invalid Quantity Format
1. Quantity is empty, non-numeric, zero, or negative.
2. System displays validation error.
3. System prevents submission until corrected.

#### B4: Concurrent Reservation Conflict
1. Between form load and submit, available stock changes due to another reservation.
2. System re-checks stock at write time and finds quantity no longer sufficient.
3. System rejects request with up-to-date stock message.
4. User can adjust quantity and retry.

#### B5: Persistence Failure
1. Inventory update or reservation insert fails on server or database.
2. System returns failure response.
3. Transaction is rolled back to avoid partial updates.
4. User sees error and can retry later.

### Postconditions
1. If successful, reservation record exists and inventory reserved amount is updated.
2. If unsuccessful, inventory quantities remain unchanged.
3. Reservation history remains traceable by material and order.

---

## Use Case 3

### Use Case ID
UC-016

### Use Case Title
Submit QC Inspection Record

### Primary Actor
Staff User (Quality Control Staff)

### Supporting Actors
System (QC Module, Order Status Service, Backend API, Database)

### Goal
Record inspection results for an order and update order status according to quality outcome.

### Preconditions
1. User is authenticated and has QC permissions.
2. Target order exists.
3. Target order is in a process state eligible for QC.
4. QC form services and database are available.

### Trigger
QC staff initiates QC record submission from the Quality Control page.

### Normal Flow
1. User opens the Quality Control page.
2. System displays existing QC records and option to create a new inspection record.
3. User starts Create QC Record action.
4. System displays QC entry form.
5. User enters order ID.
6. System optionally performs order lookup and autofills related order details.
7. User verifies that the loaded order details are correct.
8. User enters inspection inputs (for example AQL value, sample size, defect count, inspector name).
9. User selects QC result (Pass or Fail).
10. User submits the QC form.
11. System validates required QC fields and format constraints.
12. System validates order eligibility for QC recording.
13. System creates QC inspection record in database.
14. System applies order status transition rules based on QC result.
15. If result is Pass, System updates order status to Completed.
16. If result is Fail, System keeps or updates order status according to failure policy (for example remains In Progress or marked for rework).
17. System records submission timestamp and inspector-related metadata.
18. System returns success response.
19. System refreshes QC records list and related order status views.
20. User sees confirmation and updated status information.

### Alternative or Exception Flows

#### C1: Order Not Found
1. User enters non-existent order ID.
2. System fails lookup and displays Order not found.
3. System prevents QC submission until a valid order is provided.

#### C2: Ineligible Order State for QC
1. User selects an order not ready for QC stage.
2. System rejects submission with business-rule message.
3. No QC record is stored.

#### C3: Missing or Invalid QC Data
1. Required fields are missing or contain invalid values.
2. System highlights field-level errors.
3. System blocks submission until all validation rules pass.

#### C4: Status Update Failure After QC Save
1. QC record save succeeds but order status update fails due to backend issue.
2. System executes rollback or compensating logic according to transaction design.
3. System returns failure message to user.
4. System avoids inconsistent state where QC result exists without aligned order status.

#### C5: Unauthorized Access
1. Request is made by user without QC role or expired session.
2. Backend denies action.
3. System prompts re-authentication or access denial message.
4. No QC record is created.

### Postconditions
1. If successful, QC record is stored with complete inspection details.
2. Linked order status reflects QC result according to business rules.
3. QC history is available for future review, filtering, and audit.
4. If unsuccessful, no inconsistent partial update remains in the system.
