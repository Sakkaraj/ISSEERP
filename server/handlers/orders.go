package handlers

import (
	"encoding/json"
	"net/http"
	"server/db"
	"time"
)

// ── Models ──────────────────────────────────────────────────────────────────

type Order struct {
	ID           int       `json:"id"`
	CustomerName string    `json:"customer_name"`
	OrderType    string    `json:"order_type"`
	TotalAmount  float64   `json:"total_amount"`
	ItemCount    int       `json:"item_count"`
	Status       string    `json:"status"`
	OrderDate    time.Time `json:"order_date"`
	StartedAt    *time.Time `json:"started_at,omitempty"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
}

type CreateOrderRequest struct {
	CustomerName string  `json:"customer_name"`
	OrderType    string  `json:"order_type"`
	TotalAmount  float64 `json:"total_amount"`
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
		SELECT id, customer_name, COALESCE(order_type, 'OEM'), total_amount,
		       COALESCE(item_count, 1), status, order_date
		FROM orders
		ORDER BY order_date DESC
	`
	if db.OrdersStatusTimestampsEnabled {
		query = `
			SELECT id, customer_name, COALESCE(order_type, 'OEM'), total_amount,
			       COALESCE(item_count, 1), status, order_date, started_at, completed_at
			FROM orders
			ORDER BY order_date DESC
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
		if db.OrdersStatusTimestampsEnabled {
			if err := rows.Scan(&o.ID, &o.CustomerName, &o.OrderType, &o.TotalAmount,
				&o.ItemCount, &o.Status, &o.OrderDate, &o.StartedAt, &o.CompletedAt); err != nil {
				continue
			}
		} else {
			if err := rows.Scan(&o.ID, &o.CustomerName, &o.OrderType, &o.TotalAmount,
				&o.ItemCount, &o.Status, &o.OrderDate); err != nil {
				continue
			}
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
	var err error
	if db.OrdersStatusTimestampsEnabled {
		err = db.DB.QueryRow(`
			SELECT id, customer_name, COALESCE(order_type, 'OEM'), total_amount,
			       COALESCE(item_count, 1), status, order_date, started_at, completed_at
			FROM orders
			WHERE id = ?
		`, id).Scan(
			&o.ID, &o.CustomerName, &o.OrderType, &o.TotalAmount,
			&o.ItemCount, &o.Status, &o.OrderDate, &o.StartedAt, &o.CompletedAt,
		)
	} else {
		err = db.DB.QueryRow(`
			SELECT id, customer_name, COALESCE(order_type, 'OEM'), total_amount,
			       COALESCE(item_count, 1), status, order_date
			FROM orders
			WHERE id = ?
		`, id).Scan(
			&o.ID, &o.CustomerName, &o.OrderType, &o.TotalAmount,
			&o.ItemCount, &o.Status, &o.OrderDate,
		)
	}
	if err != nil {
		jsonError(w, "Order not found", http.StatusNotFound)
		return
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

	result, err := db.DB.Exec(
		`INSERT INTO orders (customer_name, order_type, total_amount, item_count, status)
		 VALUES (?, ?, ?, ?, 'Pending')`,
		req.CustomerName, req.OrderType, req.TotalAmount, req.ItemCount,
	)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	id, _ := result.LastInsertId()
	writeJSON(w, http.StatusCreated, map[string]interface{}{"message": "Order created", "id": id})
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
