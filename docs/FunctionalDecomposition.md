# Functional Decomposition Diagram — BoonSunClon ERP System

This document provides a text-based functional decomposition map that you can redraw as a graphical diagram.

## Decomposition Rules Applied
1. Top level has 7 processes (maximum allowed by assignment).
2. Decomposition includes multiple levels where needed.
3. Structure aligns with use cases and implemented modules.

---

## Level 0 (System)

`0.0 BoonSunClon ERP System`

---

## Level 1 (Top-Level Functions, max 7)

1. `1.0 Authentication & Access Control`
2. `2.0 Order Management`
3. `3.0 Inventory Management`
4. `4.0 Quality Control Management`
5. `5.0 Production Management`
6. `6.0 Design & Construction Specification Management`
7. `7.0 Reporting, Finance & Administration`

---

## Level 2 Decomposition

### 1.0 Authentication & Access Control
1.1 Validate User Credentials
1.2 Generate and Return Session Token
1.3 Load User Role and Permission Profile
1.4 Enforce Route/Feature Access by Role
1.5 Logout and Local Session Cleanup
1.6 User Assignment and User Creation (Admin Operations)

### 2.0 Order Management
2.1 View Order List
2.2 Search and Filter Orders
2.3 Create New Order
2.4 View Order Details
2.5 Update Order Status
2.6 Retrieve Order for Other Modules (Inventory, QC, Production)

### 3.0 Inventory Management
3.1 View Material Catalog and Stock Levels
3.2 Add New Material
3.3 Restock Material Quantity
3.4 Reserve Material for Order
3.5 Validate Reservation Against Available Stock
3.6 View Reservation Records by Material/Order
3.7 Tag Material for Finishing Eligibility
3.8 Record Inventory Opening Stock Expense
3.9 Record Inventory Restock Expense

### 4.0 Quality Control Management
4.1 View QC Records
4.2 Lookup Order for QC Form Autofill
4.3 Validate QC Submission Data
4.4 Submit QC Inspection Record
4.5 Update Linked Order Status Based on QC Result
4.6 Filter QC Records by Result/Order/Inspector

### 5.0 Production Management
5.1 View Assigned Production Orders
5.2 Update Production Checklist Progress
5.3 Validate 100 Percent Completion Before Submission
5.4 Submit Production Progress
5.5 Record Submission Timestamp and Status Transition

### 6.0 Design & Construction Specification Management
6.1 View Design/Construction Specifications
6.2 Create Specification Record
6.3 Manage Specification Metadata and Link to Order
6.4 Store Construction-Related Documentation
6.5 Track Implementation Status of Specification Features
6.6 Load and Validate Finish Options from Tagged Inventory Materials

### 7.0 Reporting, Finance & Administration
7.1 View Dashboard KPIs
7.2 View Finance Summaries
7.3 Aggregate Module Data for Reporting Cards
7.4 Navigate Pages and Shared UI Utilities (Theme and Settings)
7.5 Basic User Management View and Assignment Support
7.6 View Logistics Dispatch Dashboard
7.7 Create Shipment Plans for Completed Orders
7.8 Update Shipment Status and Dispatch Metadata
7.9 Track Ready-for-Dispatch Completed Orders
7.10 Exclude Closed Shipments from Planning Queue

---

## Level 3 Decomposition for Selected Main Use Cases

The following Level 3 detail is provided for the three selected narrative use cases.

### A) UC-004 Create New Order (from 2.3)
2.3.1 Open Order Creation Form
2.3.2 Capture Customer and Order Inputs
2.3.3 Validate Required Fields
2.3.4 Validate Numeric Rules (Unit Price, Quantity)
2.3.5 Calculate Total Amount
2.3.6 Set Initial Order Status (Pending)
2.3.7 Persist New Order Record
2.3.8 Return Success/Error to UI
2.3.9 Refresh Order List and Show Confirmation

### B) UC-011 Reserve Material for Order (from 3.4 and 3.5)
3.4.1 Open Reservation Form for Selected Material
3.4.2 Capture Order ID and Requested Quantity
3.4.3 Validate Order ID Exists
3.4.4 Validate Quantity Format and Positivity
3.5.1 Read Current Available and Reserved Stock
3.5.2 Compare Requested Quantity vs Available Quantity
3.5.3 Reject Reservation if Insufficient Stock
3.4.5 Create Reservation Record if Valid
3.4.6 Update Reserved Quantity Totals
3.4.7 Return Result and Refresh Reservation View

### C) UC-016 Submit QC Inspection Record (from 4.2, 4.3, 4.4, 4.5)
4.2.1 Lookup and Load Target Order
4.3.1 Validate QC Required Fields
4.3.2 Validate Business Rule (Order Is QC-Eligible)
4.4.1 Save QC Inspection Record
4.5.1 Evaluate QC Result (Pass/Fail)
4.5.2 Update Order Status Based on Result
4.5.3 Ensure Transaction Consistency (No Partial Update)
4.4.2 Return Success/Error Response
4.1.1 Refresh QC Record List for User Feedback

### D) UC-032 Create Shipment for Completed Order (from 7.7)
7.7.1 Load Ready Completed Orders
7.7.2 Select Target Order for Dispatch
7.7.3 Capture Destination and Dispatch Metadata
7.7.4 Validate Required Shipment Fields
7.7.5 Validate Order Is Completed and Dispatch-Eligible
7.7.6 Prevent Duplicate Active Shipment for Same Order
7.7.7 Generate Shipment Code
7.7.8 Persist Shipment Record
7.7.9 Return Success/Error and Refresh Shipment Register

### E) UC-035 / UC-036 Inventory Expense Recording (from 3.8 and 3.9)
3.8.1 Capture Unit Cost for Opening Stock
3.8.2 Validate Positive Quantity and Unit Cost
3.8.3 Persist Inventory Material Record
3.8.4 Create Expense Entry for Opening Stock
3.9.1 Capture Restock Quantity and Unit Cost
3.9.2 Validate Positive Restock Inputs
3.9.3 Update Material Quantity
3.9.4 Create Expense Entry for Restock Purchase
3.9.5 Return Success/Error and Refresh Inventory/Finance Views

### F) UC-037 Exclude Closed Shipments from Planning Queue (from 7.10)
7.10.1 Load Completed Orders for Dispatch Planning
7.10.2 Check Existing Shipment Status per Order
7.10.3 Filter Out Orders with Delivered/Returned/Active Shipments
7.10.4 Return Only Eligible Ready Orders

---

## Text Map for Redrawing

Use this as a simple parent-child map while drawing:

`0.0 ERP System`
-> `1.0 Authentication & Access Control`
-> `2.0 Order Management`
-> `3.0 Inventory Management`
-> `4.0 Quality Control Management`
-> `5.0 Production Management`
-> `6.0 Design & Construction Specification Management`
-> `7.0 Reporting, Finance & Administration`

Selected use case path map:

`2.0 -> 2.3 -> UC-004`
`3.0 -> 3.4 + 3.5 -> UC-011`
`4.0 -> 4.2 + 4.3 + 4.4 + 4.5 -> UC-016`
`7.0 -> 7.7 -> UC-032`
`3.0 -> 3.8 + 3.9 -> UC-035 / UC-036`
`7.0 -> 7.10 -> UC-037`

