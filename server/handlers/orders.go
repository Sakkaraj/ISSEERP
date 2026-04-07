package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"server/db"
	"time"
)

// ── Models ──────────────────────────────────────────────────────────────────

type Order struct {
	ID                     int        `json:"id"`
	CustomerName           string     `json:"customer_name"`
	OrderType              string     `json:"order_type"`
	UnitPrice              float64    `json:"unit_price"`
	TotalAmount            float64    `json:"total_amount"`
	ItemCount              int        `json:"item_count"`
	Status                 string     `json:"status"`
	OrderDate              time.Time  `json:"order_date"`
	StartedAt              *time.Time `json:"started_at,omitempty"`
	CompletedAt            *time.Time `json:"completed_at,omitempty"`
	ProductionAssignedTo   *string    `json:"production_assigned_to,omitempty"`
	ProductionProgress     *int       `json:"production_progress,omitempty"`
	ProductionProgressNote *string    `json:"production_progress_note,omitempty"`
	ProductionUpdatedAt    *time.Time `json:"production_updated_at,omitempty"`
	ProductionSubmittedAt  *time.Time `json:"production_submitted_at,omitempty"`
	ProductionUpdatedBy    *string    `json:"production_updated_by,omitempty"`
}

type CreateOrderRequest struct {
	CustomerName string  `json:"customer_name"`
	OrderType    string  `json:"order_type"`
	UnitPrice    float64 `json:"unit_price"`
	ItemCount    int     `json:"item_count"`
}

type UpdateOrderStatusRequest struct {
	ID     int    `json:"id"`
	Status string `json:"status"`
}

// ── Handlers ─────────────────────────────────────────────────────────────────

func OrdersHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		if r.URL.Query().Get("id") != "" {
			getOrderByID(w, r)
			return
		}
		getOrders(w, r)
	case http.MethodPost:
		createOrder(w, r)
	case http.MethodPatch:
		updateOrderStatus(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getOrders(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT orders.id, orders.customer_name, COALESCE(orders.order_type, 'OEM'), COALESCE(orders.unit_price, 0), orders.total_amount,
		       COALESCE(orders.item_count, 1), orders.status, orders.order_date,
		       pa.assigned_to,
		       pp.progress_percent,
		       pp.progress_note,
		       pp.updated_at,
		       pp.submitted_at,
		       pp.updated_by
		FROM orders
		LEFT JOIN production_assignments pa ON pa.order_id = orders.id
		LEFT JOIN production_progress pp ON pp.id = (
			SELECT p2.id
			FROM production_progress p2
			WHERE p2.order_id = orders.id
			ORDER BY p2.updated_at DESC, p2.id DESC
			LIMIT 1
		)
		ORDER BY orders.order_date DESC
	`
	if db.OrdersStatusTimestampsEnabled {
		query = `
			SELECT orders.id, orders.customer_name, COALESCE(orders.order_type, 'OEM'), COALESCE(orders.unit_price, 0), orders.total_amount,
			       COALESCE(orders.item_count, 1), orders.status, orders.order_date, orders.started_at, orders.completed_at,
			       pa.assigned_to,
			       pp.progress_percent,
			       pp.progress_note,
			       pp.updated_at,
			       pp.submitted_at,
			       pp.updated_by
			FROM orders
			LEFT JOIN production_assignments pa ON pa.order_id = orders.id
			LEFT JOIN production_progress pp ON pp.id = (
				SELECT p2.id
				FROM production_progress p2
				WHERE p2.order_id = orders.id
				ORDER BY p2.updated_at DESC, p2.id DESC
				LIMIT 1
			)
			ORDER BY orders.order_date DESC
		`
	}

	rows, err := db.DB.Query(query)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var orders []Order
	for rows.Next() {
		var o Order
		var assignedTo sql.NullString
		var progress sql.NullInt64
		var progressNote sql.NullString
		var progressUpdatedAt sql.NullTime
		var progressSubmittedAt sql.NullTime
		var progressUpdatedBy sql.NullString
		if db.OrdersStatusTimestampsEnabled {
			if err := rows.Scan(&o.ID, &o.CustomerName, &o.OrderType, &o.UnitPrice, &o.TotalAmount,
				&o.ItemCount, &o.Status, &o.OrderDate, &o.StartedAt, &o.CompletedAt,
				&assignedTo, &progress, &progressNote, &progressUpdatedAt, &progressSubmittedAt, &progressUpdatedBy); err != nil {
				continue
			}
		} else {
			if err := rows.Scan(&o.ID, &o.CustomerName, &o.OrderType, &o.UnitPrice, &o.TotalAmount,
				&o.ItemCount, &o.Status, &o.OrderDate,
				&assignedTo, &progress, &progressNote, &progressUpdatedAt, &progressSubmittedAt, &progressUpdatedBy); err != nil {
				continue
			}
		}

		if assignedTo.Valid {
			o.ProductionAssignedTo = &assignedTo.String
		}
		if progress.Valid {
			p := int(progress.Int64)
			o.ProductionProgress = &p
		}
		if progressNote.Valid {
			o.ProductionProgressNote = &progressNote.String
		}
		if progressUpdatedAt.Valid {
			t := progressUpdatedAt.Time
			o.ProductionUpdatedAt = &t
		}
		if progressSubmittedAt.Valid {
			t := progressSubmittedAt.Time
			o.ProductionSubmittedAt = &t
		}
		if progressUpdatedBy.Valid {
			o.ProductionUpdatedBy = &progressUpdatedBy.String
		}

		orders = append(orders, o)
	}
	if orders == nil {
		orders = []Order{}
	}
	writeJSON(w, http.StatusOK, orders)
}

func getOrderByID(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		jsonError(w, "id is required", http.StatusBadRequest)
		return
	}

	var o Order
	var assignedTo sql.NullString
	var progress sql.NullInt64
	var progressNote sql.NullString
	var progressUpdatedAt sql.NullTime
	var progressSubmittedAt sql.NullTime
	var progressUpdatedBy sql.NullString
	var err error
	if db.OrdersStatusTimestampsEnabled {
		err = db.DB.QueryRow(`
			SELECT orders.id, orders.customer_name, COALESCE(orders.order_type, 'OEM'), COALESCE(orders.unit_price, 0), orders.total_amount,
			       COALESCE(orders.item_count, 1), orders.status, orders.order_date, orders.started_at, orders.completed_at,
			       pa.assigned_to,
			       pp.progress_percent,
			       pp.progress_note,
			       pp.updated_at,
			       pp.submitted_at,
			       pp.updated_by
			FROM orders
			LEFT JOIN production_assignments pa ON pa.order_id = orders.id
			LEFT JOIN production_progress pp ON pp.id = (
				SELECT p2.id
				FROM production_progress p2
				WHERE p2.order_id = orders.id
				ORDER BY p2.updated_at DESC, p2.id DESC
				LIMIT 1
			)
			WHERE orders.id = ?
		`, id).Scan(
			&o.ID, &o.CustomerName, &o.OrderType, &o.UnitPrice, &o.TotalAmount,
			&o.ItemCount, &o.Status, &o.OrderDate, &o.StartedAt, &o.CompletedAt,
			&assignedTo, &progress, &progressNote, &progressUpdatedAt, &progressSubmittedAt, &progressUpdatedBy,
		)
	} else {
		err = db.DB.QueryRow(`
			SELECT orders.id, orders.customer_name, COALESCE(orders.order_type, 'OEM'), COALESCE(orders.unit_price, 0), orders.total_amount,
			       COALESCE(orders.item_count, 1), orders.status, orders.order_date,
			       pa.assigned_to,
			       pp.progress_percent,
			       pp.progress_note,
			       pp.updated_at,
			       pp.submitted_at,
			       pp.updated_by
			FROM orders
			LEFT JOIN production_assignments pa ON pa.order_id = orders.id
			LEFT JOIN production_progress pp ON pp.id = (
				SELECT p2.id
				FROM production_progress p2
				WHERE p2.order_id = orders.id
				ORDER BY p2.updated_at DESC, p2.id DESC
				LIMIT 1
			)
			WHERE orders.id = ?
		`, id).Scan(
			&o.ID, &o.CustomerName, &o.OrderType, &o.UnitPrice, &o.TotalAmount,
			&o.ItemCount, &o.Status, &o.OrderDate,
			&assignedTo, &progress, &progressNote, &progressUpdatedAt, &progressSubmittedAt, &progressUpdatedBy,
		)
	}
	if err != nil {
		jsonError(w, "Order not found", http.StatusNotFound)
		return
	}

	if assignedTo.Valid {
		o.ProductionAssignedTo = &assignedTo.String
	}
	if progress.Valid {
		p := int(progress.Int64)
		o.ProductionProgress = &p
	}
	if progressNote.Valid {
		o.ProductionProgressNote = &progressNote.String
	}
	if progressUpdatedAt.Valid {
		t := progressUpdatedAt.Time
		o.ProductionUpdatedAt = &t
	}
	if progressSubmittedAt.Valid {
		t := progressSubmittedAt.Time
		o.ProductionSubmittedAt = &t
	}
	if progressUpdatedBy.Valid {
		o.ProductionUpdatedBy = &progressUpdatedBy.String
	}

	writeJSON(w, http.StatusOK, o)
}

func createOrder(w http.ResponseWriter, r *http.Request) {
	var req CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.CustomerName == "" || req.OrderType == "" {
		jsonError(w, "customer_name and order_type are required", http.StatusBadRequest)
		return
	}
	if req.ItemCount <= 0 {
		jsonError(w, "item_count must be greater than 0", http.StatusBadRequest)
		return
	}
	if req.UnitPrice < 0 {
		jsonError(w, "unit_price must be greater than or equal to 0", http.StatusBadRequest)
		return
	}

	totalAmount := float64(req.ItemCount) * req.UnitPrice

	result, err := db.DB.Exec(
		`INSERT INTO orders (customer_name, order_type, unit_price, total_amount, item_count, status)
		 VALUES (?, ?, ?, ?, ?, 'Pending')`,
		req.CustomerName, req.OrderType, req.UnitPrice, totalAmount, req.ItemCount,
	)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	id, _ := result.LastInsertId()
	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message":      "Order created",
		"id":           id,
		"item_count":   req.ItemCount,
		"unit_price":   req.UnitPrice,
		"total_amount": totalAmount,
	})
}

func updateOrderStatus(w http.ResponseWriter, r *http.Request) {
	var req UpdateOrderStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.ID <= 0 || req.Status == "" {
		jsonError(w, "id and status are required", http.StatusBadRequest)
		return
	}

	validStatuses := map[string]bool{
		"Pending":     true,
		"In Progress": true,
		"Completed":   true,
		"Cancelled":   true,
	}
	if !validStatuses[req.Status] {
		jsonError(w, "Invalid status value", http.StatusBadRequest)
		return
	}

	var result interface {
		RowsAffected() (int64, error)
	}
	var err error
	if db.OrdersStatusTimestampsEnabled {
		result, err = db.DB.Exec(`
			UPDATE orders
			SET
				status = ?,
				started_at = CASE
					WHEN ? = 'In Progress' AND started_at IS NULL THEN CURRENT_TIMESTAMP
					WHEN ? = 'Completed' AND started_at IS NULL THEN CURRENT_TIMESTAMP
					ELSE started_at
				END,
				completed_at = CASE
					WHEN ? = 'Completed' THEN CURRENT_TIMESTAMP
					ELSE completed_at
				END
			WHERE id = ?
		`, req.Status, req.Status, req.Status, req.Status, req.ID)
	} else {
		result, err = db.DB.Exec(`UPDATE orders SET status = ? WHERE id = ?`, req.Status, req.ID)
	}
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if rowsAffected == 0 {
		jsonError(w, "Order not found", http.StatusNotFound)
		return
	}

	if req.Status == "In Progress" {
		if err := ensureProductionAssignment(req.ID); err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	var startedAt *time.Time
	var completedAt *time.Time
	if db.OrdersStatusTimestampsEnabled {
		if err := db.DB.QueryRow(`SELECT started_at, completed_at FROM orders WHERE id = ?`, req.ID).Scan(&startedAt, &completedAt); err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":      "Order status updated",
		"id":           req.ID,
		"status":       req.Status,
		"started_at":   startedAt,
		"completed_at": completedAt,
	})
}

func ensureProductionAssignment(orderID int) error {
	var assignedCount int
	if err := db.DB.QueryRow(`SELECT COUNT(*) FROM production_assignments WHERE order_id = ?`, orderID).Scan(&assignedCount); err != nil {
		return err
	}
	if assignedCount > 0 {
		return nil
	}

	assignee := "production_staff"
	if err := db.DB.QueryRow(`SELECT username FROM users WHERE role = 'Production' ORDER BY id ASC LIMIT 1`).Scan(&assignee); err != nil && err != sql.ErrNoRows {
		return err
	}

	_, err := db.DB.Exec(`INSERT INTO production_assignments (order_id, assigned_to) VALUES (?, ?)`, orderID, assignee)
	if err != nil {
		return err
	}

	return nil
}

// ── Helpers ──────────────────────────────────────────────────────────────────

func jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func writeJSON(w http.ResponseWriter, code int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}
