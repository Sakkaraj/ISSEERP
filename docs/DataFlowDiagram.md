# Data Flow Diagram (DFD) Specification — BoonSunClon ERP System

This document provides text-based DFDs so the diagrams can be redrawn graphically.

Coverage included:
1. DFD Level 0 (Context Diagram)
2. DFD Level 1 (Main Processes)
3. DFD Level 2 for the three selected use cases (non-authentication):
	- UC-004 Create New Order
	- UC-011 Reserve Material for Order
	- UC-016 Submit QC Inspection Record
4. Appendix A: Additional Level 2 expansion for logistics dispatch flow:
	- UC-032 Create Shipment for Completed Order
5. Appendix B: Additional Level 2 expansion for inventory expense tracking and dispatch eligibility filtering:
	- UC-035 Record Inventory Opening Stock Expense
	- UC-036 Record Inventory Restock Expense
	- UC-037 Exclude Closed Shipments from Planning Queue

---

## 1) DFD Level 0 (Context Diagram)

### System Boundary
`[P0: BoonSunClon ERP System]`

### External Entities
1. `[E1: Staff User]` (Sales, Inventory, QC, Production, Admin roles)
2. `[E2: Management]` (consumes dashboard and finance outputs)

### Major Data Flows (Entity <-> System)

#### E1 Staff User -> P0 ERP System
1. Login credentials and session actions
2. Order input data (create/search/update requests)
3. Inventory operations (add/restock/reserve requests)
4. Production progress updates
5. QC inspection data submissions
6. Navigation and UI preference actions

#### P0 ERP System -> E1 Staff User
1. Authentication result and role profile
2. Order list/details/status responses
3. Inventory list/stock/reservation responses
4. Production task/progress responses
5. QC record/history/status responses
6. Validation errors and confirmation messages

#### E2 Management -> P0 ERP System
1. Dashboard and finance data requests

#### P0 ERP System -> E2 Management
1. KPI summaries
2. Financial summaries
3. Operational performance data

### Context Diagram Map (for drawing)
`E1 Staff User <-> P0 ERP System <-> E2 Management`

---

## 2) DFD Level 1 (Main Process Decomposition)

### External Entities (same as Level 0)
`E1 Staff User`, `E2 Management`

### Processes
1. `P1 Authentication & Access`
2. `P2 Order Management`
3. `P3 Inventory Management`
4. `P4 Quality Control Management`
5. `P5 Production Management`
6. `P6 Design/Construction Management`
7. `P7 Dashboard/Finance/Administration/Logistics Dispatch`

### Data Stores
1. `D1 User Store`
2. `D2 Order Store`
3. `D3 Inventory Material Store`
4. `D4 Material Reservation Store`
5. `D5 QC Record Store`
6. `D6 Production Progress Store`
7. `D7 Construction Specification Store`
8. `D8 Logistics Shipment Store`
9. `D9 Supplies Expense Store`

### Level 1 Core Flows

#### Authentication
1. `E1 -> P1`: credentials/session request
2. `P1 <-> D1`: user lookup and role retrieval
3. `P1 -> E1`: auth result/token/role

#### Order Management
1. `E1 -> P2`: create/search/view/update order request
2. `P2 <-> D2`: read/write order data
3. `P2 -> E1`: order response and status

#### Inventory Management
1. `E1 -> P3`: material and reservation requests
2. `P3 <-> D3`: read/update material stock
3. `P3 <-> D4`: create/read reservation records
4. `P3 <-> D2`: order existence check for reservation
5. `P3 <-> D9`: create/read inventory expense records
6. `P3 -> E1`: inventory, expense, and reservation results

#### QC Management
1. `E1 -> P4`: QC lookup and submission
2. `P4 <-> D5`: write/read QC records
3. `P4 <-> D2`: read/update linked order status
4. `P4 -> E1`: QC submission result and updated status

#### Production Management
1. `E1 -> P5`: progress update/submission
2. `P5 <-> D6`: write/read production progress
3. `P5 <-> D2`: update order production status
4. `P5 -> E1`: progress result

#### Design/Construction Management
1. `E1 -> P6`: specification create/view requests
2. `P6 <-> D7`: specification write/read
3. `P6 <-> D3`: fetch materials tagged usable for finishing for finish selection
4. `P6 -> E1`: specification responses

#### Dashboard/Finance/Administration
1. `E2 -> P7`: dashboard/finance request
2. `P7 <- D2/D3/D5/D6/D9`: aggregated operational data
3. `P7 -> E2`: KPI and financial summaries

#### Logistics Dispatch (within P7)
1. `E1 -> P7`: shipment planning and shipment update requests
2. `P7 <-> D2`: read completed orders and readiness conditions
3. `P7 <-> D8`: create/read/update shipment records
4. `P7 -> E1`: shipment register updates and dispatch validation feedback

#### Inventory Expense Tracking (within P3)
1. `E1 -> P3`: material creation/restock request with unit cost
2. `P3 <-> D3`: update material stock values
3. `P3 <-> D9`: create expense entry for inventory acquisition cost
4. `P3 -> E1`: material and finance result response

### Level 1 Inter-Process Dependency Flows
1. `P3 -> P2/D2`: validate order before material reservation.
2. `P4 -> P2/D2`: update order status after QC result.
3. `P5 -> P2/D2`: update order stage based on production completion.
4. `P7 -> P2/D2`: include only completed orders in ready-for-dispatch list.

---

## 3) DFD Level 2 — Selected Use Case Processes (Core Three Narratives)

This level expands only the three selected use case-related processes.

---

### 3.1 Level 2 for UC-004 Create New Order (Expansion of P2)

#### Subprocesses
1. `P2.1 Receive Order Form Input`
2. `P2.2 Validate Required Fields`
3. `P2.3 Validate Numeric Fields`
4. `P2.4 Calculate Total Amount`
5. `P2.5 Build New Order Record`
6. `P2.6 Save Order`
7. `P2.7 Return Result`

#### Data Store
`D2 Order Store`

#### Data Flows
1. `E1 -> P2.1`: customer name, order type, unit price, item count
2. `P2.1 -> P2.2`: captured order input
3. `P2.2 -> P2.3`: validated required fields
4. `P2.3 -> P2.4`: validated numeric values
5. `P2.4 -> P2.5`: computed total amount
6. `P2.5 -> P2.6`: complete order object (with initial status)
7. `P2.6 -> D2`: insert new order
8. `D2 -> P2.7`: insertion outcome
9. `P2.7 -> E1`: success message + new order data OR error details

#### Exception Flows
1. `P2.2 validation fail -> P2.7 -> E1`: missing fields error
2. `P2.3 validation fail -> P2.7 -> E1`: invalid numeric value error
3. `P2.6 DB fail -> P2.7 -> E1`: persistence failure message

---

### 3.2 Level 2 for UC-011 Reserve Material for Order (Expansion of P3)

#### Subprocesses
1. `P3.1 Receive Reservation Request`
2. `P3.2 Validate Order Reference`
3. `P3.3 Validate Reservation Quantity`
4. `P3.4 Check Current Stock`
5. `P3.5 Compare Stock vs Requested Quantity`
6. `P3.6 Create Reservation Record`
7. `P3.7 Update Material Reserved Quantity`
8. `P3.8 Return Result`

#### Data Stores
1. `D2 Order Store`
2. `D3 Inventory Material Store`
3. `D4 Material Reservation Store`

#### Data Flows
1. `E1 -> P3.1`: material ID, order ID, requested quantity
2. `P3.1 -> P3.2`: reservation payload
3. `P3.2 <-> D2`: order existence check
4. `P3.2 -> P3.3`: valid order reference
5. `P3.3 -> P3.4`: valid quantity
6. `P3.4 <-> D3`: read available/reserved stock data
7. `P3.4 -> P3.5`: current stock snapshot
8. `P3.5 -> P3.6`: approval to reserve (if sufficient stock)
9. `P3.6 -> D4`: insert reservation record
10. `P3.6 -> P3.7`: reservation confirmation data
11. `P3.7 -> D3`: update reserved quantity totals
12. `P3.7 -> P3.8`: completed transaction status
13. `P3.8 -> E1`: success response and updated stock/reservation values

#### Exception Flows
1. `P3.2 order not found -> P3.8 -> E1`: invalid order error
2. `P3.3 invalid qty -> P3.8 -> E1`: quantity validation error
3. `P3.5 insufficient stock -> P3.8 -> E1`: insufficient stock error
4. `P3.6 or P3.7 DB fail -> P3.8 -> E1`: transaction failure message

---

### 3.3 Level 2 for UC-016 Submit QC Inspection Record (Expansion of P4)

#### Subprocesses
1. `P4.1 Receive QC Submission`
2. `P4.2 Lookup and Validate Order`
3. `P4.3 Validate QC Input Fields`
4. `P4.4 Save QC Record`
5. `P4.5 Determine Status Transition Rule`
6. `P4.6 Update Linked Order Status`
7. `P4.7 Return Result`

#### Data Stores
1. `D2 Order Store`
2. `D5 QC Record Store`

#### Data Flows
1. `E1 -> P4.1`: order ID + QC input data (AQL, sample size, defects, result, inspector)
2. `P4.1 -> P4.2`: QC payload with order reference
3. `P4.2 <-> D2`: read order and eligibility state
4. `P4.2 -> P4.3`: valid order context
5. `P4.3 -> P4.4`: validated QC data
6. `P4.4 -> D5`: insert QC record
7. `D5 -> P4.5`: saved QC result metadata
8. `P4.5 -> P4.6`: target order status decision
9. `P4.6 -> D2`: update order status (Completed or rework-related state)
10. `P4.6 -> P4.7`: update outcome
11. `P4.7 -> E1`: submission result + updated order status

#### Exception Flows
1. `P4.2 order not found -> P4.7 -> E1`: invalid order error
2. `P4.2 order not QC-eligible -> P4.7 -> E1`: business rule error
3. `P4.3 invalid QC inputs -> P4.7 -> E1`: field validation error
4. `P4.4 save fail -> P4.7 -> E1`: QC record save failure
5. `P4.6 update fail -> P4.7 -> E1`: status update failure (rollback/consistency handling)

---

## 4) Appendix A — Additional Level 2 Expansion for Logistics Dispatch

### A.1 Level 2 for UC-032 Create Shipment for Completed Order (Expansion of P7)

#### Subprocesses
1. `P7.1 Receive Shipment Planning Request`
2. `P7.2 Validate Required Dispatch Fields`
3. `P7.3 Validate Order Exists and Is Completed`
4. `P7.4 Check Existing Active Shipment`
5. `P7.5 Generate Shipment Code`
6. `P7.6 Save Shipment Record`
7. `P7.7 Return Result and Refresh Logistics Register`

#### Data Stores
1. `D2 Order Store`
2. `D8 Logistics Shipment Store`

#### Data Flows
1. `E1 -> P7.1`: order_id + destination + vehicle/driver + dispatch metadata
2. `P7.1 -> P7.2`: shipment payload
3. `P7.2 -> P7.3`: validated required fields
4. `P7.3 <-> D2`: read order status and completion eligibility
5. `P7.3 -> P7.4`: completed order context
6. `P7.4 <-> D8`: check active shipment conflict for same order
7. `P7.4 -> P7.5`: approval to create shipment
8. `P7.5 -> P7.6`: generated shipment identifier and normalized payload
9. `P7.6 -> D8`: insert shipment record (initial status Planned)
10. `D8 -> P7.7`: insert outcome
11. `P7.7 -> E1`: success response + shipment code OR validation error

#### Exception Flows
1. `P7.2 validation fail -> P7.7 -> E1`: missing/invalid dispatch input
2. `P7.3 order not found or not completed -> P7.7 -> E1`: order eligibility error
3. `P7.4 active shipment exists -> P7.7 -> E1`: duplicate dispatch conflict
4. `P7.6 DB fail -> P7.7 -> E1`: shipment persistence failure

---

## 5) Appendix B — Additional Level 2 Expansion for Inventory Expense and Dispatch Eligibility

### B.1 Level 2 for UC-035 / UC-036 Inventory Expense Recording (Expansion of P3)

#### Subprocesses
1. `P3.9 Receive Inventory Cost Input`
2. `P3.10 Validate Quantity and Unit Cost`
3. `P3.11 Save or Update Inventory Material`
4. `P3.12 Create Expense Entry`
5. `P3.13 Return Result`

#### Data Stores
1. `D3 Inventory Material Store`
2. `D9 Supplies Expense Store`

#### Data Flows
1. `E1 -> P3.9`: material name/unit/qty/unit_cost/location or restock qty/unit_cost
2. `P3.9 -> P3.10`: inventory request payload
3. `P3.10 -> P3.11`: validated inventory input
4. `P3.11 -> D3`: insert/update material stock
5. `P3.11 -> P3.12`: acquisition cost data
6. `P3.12 -> D9`: insert expense entry
7. `D9 -> P3.13`: write outcome
8. `P3.13 -> E1`: success/error and updated inventory/finance result

#### Exception Flows
1. `P3.10 validation fail -> P3.13 -> E1`: missing or invalid unit cost/quantity
2. `P3.11 DB fail -> P3.13 -> E1`: inventory persistence failure
3. `P3.12 DB fail -> P3.13 -> E1`: finance expense write failure

---

### B.2 Level 2 for UC-037 Exclude Closed Shipments from Planning Queue (Expansion of P7)

#### Subprocesses
1. `P7.11 Load Completed Orders`
2. `P7.12 Check Shipment Status`
3. `P7.13 Filter Eligible Planning Queue`
4. `P7.14 Return Ready Orders`

#### Data Stores
1. `D2 Order Store`
2. `D8 Logistics Shipment Store`

#### Data Flows
1. `E1 -> P7.11`: dispatch planning request
2. `P7.11 <-> D2`: completed order list
3. `P7.12 <-> D8`: shipment status lookup per order
4. `P7.13`: remove delivered/returned/active shipment orders from candidate list
5. `P7.14 -> E1`: only eligible ready orders

#### Exception Flows
1. `P7.11 no completed orders -> P7.14 -> E1`: empty planning queue
2. `P7.12 DB fail -> P7.14 -> E1`: shipment lookup error

---

## 6) Compact Draw-Ready Map

Use these line maps to quickly sketch diagrams.

### Level 0
`E1 Staff User <-> P0 ERP System <-> E2 Management`

### Level 1
`E1 -> P1 -> D1 -> P1 -> E1`
`E1 -> P2 <-> D2 -> E1`
`E1 -> P3 <-> D3/D4 and D2(check) -> E1`
`E1 -> P4 <-> D5 and D2(update) -> E1`
`E1 -> P5 <-> D6 and D2(update) -> E1`
`E1 -> P6 <-> D7 -> E1`
`E1 -> P7 <-> D8 and D2(ready check) -> E1`
`E1 -> P3 <-> D9 -> E1`
`E2 -> P7 <- D2/D3/D5/D6/D9 -> E2`

### Level 2 Selected (Core Three)
`UC-004: E1 -> P2.1 -> P2.2 -> P2.3 -> P2.4 -> P2.5 -> P2.6 -> D2 -> P2.7 -> E1`
`UC-011: E1 -> P3.1 -> P3.2(D2) -> P3.3 -> P3.4(D3) -> P3.5 -> P3.6(D4) -> P3.7(D3) -> P3.8 -> E1`
`UC-016: E1 -> P4.1 -> P4.2(D2) -> P4.3 -> P4.4(D5) -> P4.5 -> P4.6(D2) -> P4.7 -> E1`

### Level 2 Appendix Expansions
`UC-032: E1 -> P7.1 -> P7.2 -> P7.3(D2) -> P7.4(D8) -> P7.5 -> P7.6(D8) -> P7.7 -> E1`
`UC-035/036: E1 -> P3.9 -> P3.10 -> P3.11(D3) -> P3.12(D9) -> P3.13 -> E1`
`UC-037: E1 -> P7.11 -> P7.12(D8) -> P7.13 -> P7.14 -> E1`

