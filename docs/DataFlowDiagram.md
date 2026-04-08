# Data Flow Diagram (DFD) Specification — BoonSunClon ERP System

This document provides text-based DFDs so the diagrams can be redrawn graphically.

Coverage included:
1. DFD Level 0 (Context Diagram)
2. DFD Level 1 (Main Processes)
3. DFD Level 2 for the three selected use cases (non-authentication):
	- UC-004 Create New Order
	- UC-011 Reserve Material for Order
	- UC-016 Submit QC Inspection Record

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
7. `P7 Dashboard/Finance/Administration`

### Data Stores
1. `D1 User Store`
2. `D2 Order Store`
3. `D3 Inventory Material Store`
4. `D4 Material Reservation Store`
5. `D5 QC Record Store`
6. `D6 Production Progress Store`
7. `D7 Construction Specification Store`

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
5. `P3 -> E1`: inventory and reservation results

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
3. `P6 -> E1`: specification responses

#### Dashboard/Finance/Administration
1. `E2 -> P7`: dashboard/finance request
2. `P7 <- D2/D3/D5/D6`: aggregated operational data
3. `P7 -> E2`: KPI and financial summaries

### Level 1 Inter-Process Dependency Flows
1. `P3 -> P2/D2`: validate order before material reservation.
2. `P4 -> P2/D2`: update order status after QC result.
3. `P5 -> P2/D2`: update order stage based on production completion.

---

## 3) DFD Level 2 — Selected Use Case Processes

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

## 4) Compact Draw-Ready Map

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
`E2 -> P7 <- D2/D3/D5/D6 -> E2`

### Level 2 Selected
`UC-004: E1 -> P2.1 -> P2.2 -> P2.3 -> P2.4 -> P2.5 -> P2.6 -> D2 -> P2.7 -> E1`
`UC-011: E1 -> P3.1 -> P3.2(D2) -> P3.3 -> P3.4(D3) -> P3.5 -> P3.6(D4) -> P3.7(D3) -> P3.8 -> E1`
`UC-016: E1 -> P4.1 -> P4.2(D2) -> P4.3 -> P4.4(D5) -> P4.5 -> P4.6(D2) -> P4.7 -> E1`

