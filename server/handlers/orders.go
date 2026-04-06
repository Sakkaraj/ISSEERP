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
}

type CreateOrderRequest struct {
	CustomerName string  `json:"customer_name"`
	OrderType    string  `json:"order_type"`
	TotalAmount  float64 `json:"total_amount"`
	ItemCount    int     `json:"item_count"`
}

// ── Handlers ─────────────────────────────────────────────────────────────────

func OrdersHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getOrders(w, r)
	case http.MethodPost:
		createOrder(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getOrders(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(`
		SELECT id, customer_name, COALESCE(order_type, 'OEM'), total_amount,
		       COALESCE(item_count, 1), status, order_date
		FROM orders
		ORDER BY order_date DESC
	`)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var orders []Order
	for rows.Next() {
		var o Order
		if err := rows.Scan(&o.ID, &o.CustomerName, &o.OrderType, &o.TotalAmount,
			&o.ItemCount, &o.Status, &o.OrderDate); err != nil {
			continue
		}
		orders = append(orders, o)
	}
	if orders == nil {
		orders = []Order{}
	}
	writeJSON(w, http.StatusOK, orders)
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
