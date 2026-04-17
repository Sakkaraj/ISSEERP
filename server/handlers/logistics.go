package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"server/db"
	"strings"
	"time"
)

var logisticsStatuses = []string{"Planned", "Packed", "Dispatched", "Delivered", "Returned", "Cancelled"}
var logisticsPriorities = []string{"Low", "Normal", "High", "Urgent"}
var logisticsDeliveryMethods = []string{"Internal Vehicle", "Warehouse Pickup", "Internal Transfer"}

type LogisticsShipment struct {
	ID                  int        `json:"id"`
	OrderID             int        `json:"order_id"`
	ShipmentCode        string     `json:"shipment_code"`
	CustomerName        string     `json:"customer_name"`
	OrderType           string     `json:"order_type"`
	ItemCount           int        `json:"item_count"`
	TotalAmount         float64    `json:"total_amount"`
	Status              string     `json:"status"`
	Priority            string     `json:"priority"`
	DeliveryMethod      string     `json:"delivery_method"`
	Destination         string     `json:"destination"`
	VehicleCode         string     `json:"vehicle_code"`
	DriverName          string     `json:"driver_name"`
	ScheduledDispatchAt *time.Time `json:"scheduled_dispatch_at,omitempty"`
	DispatchedAt        *time.Time `json:"dispatched_at,omitempty"`
	DeliveredAt         *time.Time `json:"delivered_at,omitempty"`
	Notes               string     `json:"notes"`
	CreatedBy           string     `json:"created_by"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

type LogisticsReadyOrder struct {
	ID           int        `json:"id"`
	CustomerName string     `json:"customer_name"`
	OrderType    string     `json:"order_type"`
	ItemCount    int        `json:"item_count"`
	TotalAmount  float64    `json:"total_amount"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
	OrderDate    time.Time  `json:"order_date"`
}

type LogisticsSummary struct {
	TotalShipments      int `json:"total_shipments"`
	PlannedShipments    int `json:"planned_shipments"`
	PackedShipments     int `json:"packed_shipments"`
	DispatchedShipments int `json:"dispatched_shipments"`
	DeliveredShipments  int `json:"delivered_shipments"`
	ReturnedShipments   int `json:"returned_shipments"`
	CancelledShipments  int `json:"cancelled_shipments"`
	ReadyForDispatch    int `json:"ready_for_dispatch"`
}

type LogisticsMeta struct {
	Statuses        []string `json:"statuses"`
	Priorities      []string `json:"priorities"`
	DeliveryMethods []string `json:"delivery_methods"`
}

type LogisticsDashboardResponse struct {
	Meta        LogisticsMeta         `json:"meta"`
	Summary     LogisticsSummary      `json:"summary"`
	ReadyOrders []LogisticsReadyOrder `json:"ready_orders"`
	Shipments   []LogisticsShipment   `json:"shipments"`
}

type CreateShipmentRequest struct {
	OrderID             int    `json:"order_id"`
	Destination         string `json:"destination"`
	VehicleCode         string `json:"vehicle_code"`
	DriverName          string `json:"driver_name"`
	DeliveryMethod      string `json:"delivery_method"`
	Priority            string `json:"priority"`
	ScheduledDispatchAt string `json:"scheduled_dispatch_at"`
	Notes               string `json:"notes"`
	CreatedBy           string `json:"created_by"`
}

type UpdateShipmentRequest struct {
	ShipmentID          int    `json:"shipment_id"`
	Status              string `json:"status"`
	Destination         string `json:"destination"`
	VehicleCode         string `json:"vehicle_code"`
	DriverName          string `json:"driver_name"`
	DeliveryMethod      string `json:"delivery_method"`
	Priority            string `json:"priority"`
	ScheduledDispatchAt string `json:"scheduled_dispatch_at"`
	Notes               string `json:"notes"`
}

func LogisticsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getLogisticsDashboard(w, r)
	case http.MethodPost:
		createShipment(w, r)
	case http.MethodPatch:
		updateShipment(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getLogisticsDashboard(w http.ResponseWriter, r *http.Request) {
	shipments, err := getShipmentRows()
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	readyOrders, err := getReadyOrders()
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	summary, err := getLogisticsSummary()
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, LogisticsDashboardResponse{
		Meta: LogisticsMeta{
			Statuses:        logisticsStatuses,
			Priorities:      logisticsPriorities,
			DeliveryMethods: logisticsDeliveryMethods,
		},
		Summary:     summary,
		ReadyOrders: readyOrders,
		Shipments:   shipments,
	})
}

func getShipmentRows() ([]LogisticsShipment, error) {
	rows, err := db.DB.Query(`
		SELECT ls.id, ls.order_id, ls.shipment_code, o.customer_name,
		       COALESCE(o.order_type, 'OEM'), COALESCE(o.item_count, 1),
		       COALESCE(o.total_amount, 0), ls.status, ls.priority,
		       ls.delivery_method, ls.destination, ls.vehicle_code, ls.driver_name,
		       ls.scheduled_dispatch_at, ls.dispatched_at, ls.delivered_at,
		       COALESCE(ls.notes, ''), ls.created_by, ls.created_at, ls.updated_at
		FROM logistics_shipments ls
		JOIN orders o ON o.id = ls.order_id
		ORDER BY COALESCE(ls.dispatched_at, ls.created_at) DESC, ls.id DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	shipments := make([]LogisticsShipment, 0)
	for rows.Next() {
		var shipment LogisticsShipment
		var scheduled sql.NullTime
		var dispatched sql.NullTime
		var delivered sql.NullTime
		if err := rows.Scan(
			&shipment.ID,
			&shipment.OrderID,
			&shipment.ShipmentCode,
			&shipment.CustomerName,
			&shipment.OrderType,
			&shipment.ItemCount,
			&shipment.TotalAmount,
			&shipment.Status,
			&shipment.Priority,
			&shipment.DeliveryMethod,
			&shipment.Destination,
			&shipment.VehicleCode,
			&shipment.DriverName,
			&scheduled,
			&dispatched,
			&delivered,
			&shipment.Notes,
			&shipment.CreatedBy,
			&shipment.CreatedAt,
			&shipment.UpdatedAt,
		); err != nil {
			continue
		}
		if scheduled.Valid {
			t := scheduled.Time
			shipment.ScheduledDispatchAt = &t
		}
		if dispatched.Valid {
			t := dispatched.Time
			shipment.DispatchedAt = &t
		}
		if delivered.Valid {
			t := delivered.Time
			shipment.DeliveredAt = &t
		}
		shipments = append(shipments, shipment)
	}
	if shipments == nil {
		shipments = []LogisticsShipment{}
	}
	return shipments, nil
}

func getReadyOrders() ([]LogisticsReadyOrder, error) {
	rows, err := db.DB.Query(`
		SELECT o.id, o.customer_name, COALESCE(o.order_type, 'OEM'), COALESCE(o.item_count, 1),
		       COALESCE(o.total_amount, 0), o.completed_at, o.order_date
		FROM orders o
		LEFT JOIN qc_records q ON q.id = (
			SELECT q2.id
			FROM qc_records q2
			WHERE CAST(q2.order_id AS UNSIGNED) = o.id
			ORDER BY q2.inspected_at DESC, q2.id DESC
			LIMIT 1
		)
		LEFT JOIN logistics_shipments ls ON ls.order_id = o.id
			AND ls.status <> 'Cancelled'
		WHERE o.status <> 'Cancelled'
			AND q.result = 'Pass'
			AND ls.id IS NULL
		ORDER BY o.order_date DESC, o.id DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	orders := make([]LogisticsReadyOrder, 0)
	for rows.Next() {
		var order LogisticsReadyOrder
		var completedAt sql.NullTime
		if err := rows.Scan(&order.ID, &order.CustomerName, &order.OrderType, &order.ItemCount, &order.TotalAmount, &completedAt, &order.OrderDate); err != nil {
			continue
		}
		if completedAt.Valid {
			t := completedAt.Time
			order.CompletedAt = &t
		}
		orders = append(orders, order)
	}
	if orders == nil {
		orders = []LogisticsReadyOrder{}
	}
	return orders, nil
}

func getLogisticsSummary() (LogisticsSummary, error) {
	var summary LogisticsSummary
	if err := db.DB.QueryRow(`
		SELECT
			COUNT(*) AS total_shipments,
			COALESCE(SUM(status = 'Planned'), 0) AS planned_shipments,
			COALESCE(SUM(status = 'Packed'), 0) AS packed_shipments,
			COALESCE(SUM(status = 'Dispatched'), 0) AS dispatched_shipments,
			COALESCE(SUM(status = 'Delivered'), 0) AS delivered_shipments,
			COALESCE(SUM(status = 'Returned'), 0) AS returned_shipments,
			COALESCE(SUM(status = 'Cancelled'), 0) AS cancelled_shipments
		FROM logistics_shipments
	`).Scan(
		&summary.TotalShipments,
		&summary.PlannedShipments,
		&summary.PackedShipments,
		&summary.DispatchedShipments,
		&summary.DeliveredShipments,
		&summary.ReturnedShipments,
		&summary.CancelledShipments,
	); err != nil {
		return summary, err
	}

	if err := db.DB.QueryRow(`
		SELECT COUNT(*)
		FROM orders o
		LEFT JOIN qc_records q ON q.id = (
			SELECT q2.id
			FROM qc_records q2
			WHERE CAST(q2.order_id AS UNSIGNED) = o.id
			ORDER BY q2.inspected_at DESC, q2.id DESC
			LIMIT 1
		)
		LEFT JOIN logistics_shipments ls ON ls.order_id = o.id
			AND ls.status <> 'Cancelled'
		WHERE o.status <> 'Cancelled'
			AND q.result = 'Pass'
			AND ls.id IS NULL
	`).Scan(&summary.ReadyForDispatch); err != nil {
		return summary, err
	}

	return summary, nil
}

func createShipment(w http.ResponseWriter, r *http.Request) {
	var req CreateShipmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	req.Destination = strings.TrimSpace(req.Destination)
	req.VehicleCode = strings.TrimSpace(req.VehicleCode)
	req.DriverName = strings.TrimSpace(req.DriverName)
	req.DeliveryMethod = strings.TrimSpace(req.DeliveryMethod)
	req.Priority = strings.TrimSpace(req.Priority)
	req.ScheduledDispatchAt = strings.TrimSpace(req.ScheduledDispatchAt)
	req.Notes = strings.TrimSpace(req.Notes)
	req.CreatedBy = strings.TrimSpace(req.CreatedBy)

	if req.OrderID <= 0 || req.Destination == "" || req.VehicleCode == "" || req.DriverName == "" || req.CreatedBy == "" {
		jsonError(w, "order_id, destination, vehicle_code, driver_name, and created_by are required", http.StatusBadRequest)
		return
	}

	if !containsString(logisticsDeliveryMethods, req.DeliveryMethod) {
		req.DeliveryMethod = logisticsDeliveryMethods[0]
	}
	if !containsString(logisticsPriorities, req.Priority) {
		req.Priority = "Normal"
	}

	var orderStatus string
	var orderCustomer string
	var latestQCResult sql.NullString
	if err := db.DB.QueryRow(`
		SELECT
			o.status,
			o.customer_name,
			(
				SELECT q.result
				FROM qc_records q
				WHERE CAST(q.order_id AS UNSIGNED) = o.id
				ORDER BY q.inspected_at DESC, q.id DESC
				LIMIT 1
			) AS latest_qc_result
		FROM orders o
		WHERE o.id = ?
	`, req.OrderID).Scan(&orderStatus, &orderCustomer, &latestQCResult); err != nil {
		if err == sql.ErrNoRows {
			jsonError(w, "Order not found", http.StatusNotFound)
			return
		}
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if orderStatus == "Cancelled" {
		jsonError(w, "Cancelled orders cannot be dispatched", http.StatusBadRequest)
		return
	}
	if !latestQCResult.Valid || latestQCResult.String != "Pass" {
		jsonError(w, "Only QC passed orders can be dispatched by logistics", http.StatusBadRequest)
		return
	}

	var activeShipmentCount int
	if err := db.DB.QueryRow(`
		SELECT COUNT(*)
		FROM logistics_shipments
		WHERE order_id = ? AND status <> 'Cancelled'
	`, req.OrderID).Scan(&activeShipmentCount); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if activeShipmentCount > 0 {
		jsonError(w, "A logistics shipment already exists for this order", http.StatusConflict)
		return
	}

	var scheduledDispatchAt interface{}
	if req.ScheduledDispatchAt != "" {
		parsed, err := parseFlexibleTime(req.ScheduledDispatchAt)
		if err != nil {
			jsonError(w, "scheduled_dispatch_at must be a valid date and time", http.StatusBadRequest)
			return
		}
		scheduledDispatchAt = parsed
	}

	shipmentCode := fmt.Sprintf("LGS-%d-%d", req.OrderID, time.Now().UTC().UnixNano())
	result, err := db.DB.Exec(`
		INSERT INTO logistics_shipments (
			order_id,
			shipment_code,
			destination,
			delivery_method,
			vehicle_code,
			driver_name,
			priority,
			status,
			scheduled_dispatch_at,
			notes,
			created_by
		) VALUES (?, ?, ?, ?, ?, ?, ?, 'Planned', ?, ?, ?)
	`, req.OrderID, shipmentCode, req.Destination, req.DeliveryMethod, req.VehicleCode, req.DriverName, req.Priority, scheduledDispatchAt, req.Notes, req.CreatedBy)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	shipmentID, _ := result.LastInsertId()
	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message":       "Logistics shipment created successfully",
		"shipment_id":   shipmentID,
		"shipment_code": shipmentCode,
		"customer_name": orderCustomer,
		"order_id":      req.OrderID,
	})
}

func updateShipment(w http.ResponseWriter, r *http.Request) {
	var req UpdateShipmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	req.Status = strings.TrimSpace(req.Status)
	req.Destination = strings.TrimSpace(req.Destination)
	req.VehicleCode = strings.TrimSpace(req.VehicleCode)
	req.DriverName = strings.TrimSpace(req.DriverName)
	req.DeliveryMethod = strings.TrimSpace(req.DeliveryMethod)
	req.Priority = strings.TrimSpace(req.Priority)
	req.ScheduledDispatchAt = strings.TrimSpace(req.ScheduledDispatchAt)
	req.Notes = strings.TrimSpace(req.Notes)

	if req.ShipmentID <= 0 {
		jsonError(w, "shipment_id is required", http.StatusBadRequest)
		return
	}

	var current struct {
		ID                  int
		Status              string
		Destination         string
		VehicleCode         string
		DriverName          string
		DeliveryMethod      string
		Priority            string
		Notes               string
		ScheduledDispatchAt sql.NullTime
	}

	if err := db.DB.QueryRow(`
		SELECT id, status, destination, vehicle_code, driver_name, delivery_method, priority, COALESCE(notes, ''), scheduled_dispatch_at
		FROM logistics_shipments
		WHERE id = ?
	`, req.ShipmentID).Scan(
		&current.ID,
		&current.Status,
		&current.Destination,
		&current.VehicleCode,
		&current.DriverName,
		&current.DeliveryMethod,
		&current.Priority,
		&current.Notes,
		&current.ScheduledDispatchAt,
	); err != nil {
		if err == sql.ErrNoRows {
			jsonError(w, "Shipment not found", http.StatusNotFound)
			return
		}
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	nextStatus := current.Status
	if req.Status != "" {
		if !containsString(logisticsStatuses, req.Status) {
			jsonError(w, "Invalid shipment status", http.StatusBadRequest)
			return
		}
		nextStatus = req.Status
	}

	if !canTransitionShipmentStatus(current.Status, nextStatus) {
		jsonError(w, "Invalid shipment status transition", http.StatusBadRequest)
		return
	}

	if req.Destination == "" {
		req.Destination = current.Destination
	}
	if req.VehicleCode == "" {
		req.VehicleCode = current.VehicleCode
	}
	if req.DriverName == "" {
		req.DriverName = current.DriverName
	}
	if req.DeliveryMethod == "" || !containsString(logisticsDeliveryMethods, req.DeliveryMethod) {
		req.DeliveryMethod = current.DeliveryMethod
	}
	if req.Priority == "" || !containsString(logisticsPriorities, req.Priority) {
		req.Priority = current.Priority
	}
	if req.Notes == "" {
		req.Notes = current.Notes
	}

	var scheduledDispatchAt interface{}
	if req.ScheduledDispatchAt == "" {
		if current.ScheduledDispatchAt.Valid {
			scheduledDispatchAt = current.ScheduledDispatchAt.Time
		}
	} else {
		parsed, err := parseFlexibleTime(req.ScheduledDispatchAt)
		if err != nil {
			jsonError(w, "scheduled_dispatch_at must be a valid date and time", http.StatusBadRequest)
			return
		}
		scheduledDispatchAt = parsed
	}

	tx, err := db.DB.Begin()
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	now := time.Now().UTC()
	if _, err := tx.Exec(`
		UPDATE logistics_shipments
		SET status = ?,
		    destination = ?,
		    vehicle_code = ?,
		    driver_name = ?,
		    delivery_method = ?,
		    priority = ?,
		    scheduled_dispatch_at = ?,
		    dispatched_at = CASE WHEN ? = 'Dispatched' AND dispatched_at IS NULL THEN ? ELSE dispatched_at END,
		    delivered_at = CASE WHEN ? = 'Delivered' AND delivered_at IS NULL THEN ? ELSE delivered_at END,
		    notes = ?,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`, nextStatus, req.Destination, req.VehicleCode, req.DriverName, req.DeliveryMethod, req.Priority, scheduledDispatchAt, nextStatus, now, nextStatus, now, req.Notes, req.ShipmentID); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if nextStatus == "Delivered" {
		if _, err := tx.Exec(`
			UPDATE orders o
			JOIN logistics_shipments ls ON ls.order_id = o.id
			SET
				o.status = 'Completed',
				o.started_at = CASE WHEN o.started_at IS NULL THEN CURRENT_TIMESTAMP ELSE o.started_at END,
				o.completed_at = CASE WHEN o.completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE o.completed_at END
			WHERE ls.id = ? AND o.status <> 'Cancelled'
		`, req.ShipmentID); err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":     "Shipment updated successfully",
		"shipment_id": req.ShipmentID,
		"status":      nextStatus,
	})
}

func parseFlexibleTime(raw string) (time.Time, error) {
	if parsed, err := time.Parse(time.RFC3339, raw); err == nil {
		return parsed.UTC(), nil
	}
	if parsed, err := time.ParseInLocation("2006-01-02T15:04", raw, time.Local); err == nil {
		return parsed.UTC(), nil
	}
	return time.Time{}, fmt.Errorf("invalid time format")
}

func canTransitionShipmentStatus(currentStatus, nextStatus string) bool {
	if currentStatus == nextStatus {
		return true
	}

	allowed := map[string][]string{
		"Planned":    {"Packed", "Dispatched", "Cancelled"},
		"Packed":     {"Dispatched", "Delivered", "Cancelled"},
		"Dispatched": {"Delivered", "Returned"},
		"Delivered":  {"Returned"},
	}

	for _, candidate := range allowed[currentStatus] {
		if candidate == nextStatus {
			return true
		}
	}

	return false
}

func containsString(values []string, candidate string) bool {
	for _, value := range values {
		if value == candidate {
			return true
		}
	}
	return false
}
