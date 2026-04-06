package handlers

import (
	"encoding/json"
	"net/http"
	"server/db"
	"time"
)

// ── Models ──────────────────────────────────────────────────────────────────

type InventoryMaterial struct {
	ID           int       `json:"id"`
	MaterialName string    `json:"material_name"`
	Unit         string    `json:"unit"`
	TotalQty     int       `json:"total_qty"`
	ReservedQty  int       `json:"reserved_qty"`
	Location     string    `json:"location"`
	CreatedAt    time.Time `json:"created_at"`
}

type MaterialReservation struct {
	ID           int       `json:"id"`
	MaterialID   int       `json:"material_id"`
	MaterialName string    `json:"material_name"`
	OrderID      string    `json:"order_id"`
	ReservedQty  int       `json:"reserved_qty"`
	Purpose      string    `json:"purpose"`
	ReservedBy   string    `json:"reserved_by"`
	Status       string    `json:"status"`
	ReservedAt   time.Time `json:"reserved_at"`
}

type ReserveMaterialRequest struct {
	MaterialID  int    `json:"material_id"`
	OrderID     string `json:"order_id"`
	ReservedQty int    `json:"reserved_qty"`
	Purpose     string `json:"purpose"`
	ReservedBy  string `json:"reserved_by"`
}

// ── Handlers ─────────────────────────────────────────────────────────────────

func MaterialsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.DB.Query(`
		SELECT id, material_name, unit, total_qty, reserved_qty, location, created_at
		FROM inventory_materials
		ORDER BY material_name ASC
	`)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var materials []InventoryMaterial
	for rows.Next() {
		var m InventoryMaterial
		if err := rows.Scan(&m.ID, &m.MaterialName, &m.Unit, &m.TotalQty,
			&m.ReservedQty, &m.Location, &m.CreatedAt); err != nil {
			continue
		}
		materials = append(materials, m)
	}
	if materials == nil {
		materials = []InventoryMaterial{}
	}
	writeJSON(w, http.StatusOK, materials)
}

func ReservationsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getReservations(w, r)
	case http.MethodPost:
		createReservation(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getReservations(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(`
		SELECT mr.id, mr.material_id, im.material_name, mr.order_id,
		       mr.reserved_qty, COALESCE(mr.purpose,''), mr.reserved_by,
		       mr.status, mr.reserved_at
		FROM material_reservations mr
		JOIN inventory_materials im ON mr.material_id = im.id
		ORDER BY mr.reserved_at DESC
	`)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var reservations []MaterialReservation
	for rows.Next() {
		var res MaterialReservation
		if err := rows.Scan(&res.ID, &res.MaterialID, &res.MaterialName, &res.OrderID,
			&res.ReservedQty, &res.Purpose, &res.ReservedBy, &res.Status, &res.ReservedAt); err != nil {
			continue
		}
		reservations = append(reservations, res)
	}
	if reservations == nil {
		reservations = []MaterialReservation{}
	}
	writeJSON(w, http.StatusOK, reservations)
}

func createReservation(w http.ResponseWriter, r *http.Request) {
	var req ReserveMaterialRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.MaterialID == 0 || req.OrderID == "" || req.ReservedQty <= 0 || req.ReservedBy == "" {
		jsonError(w, "material_id, order_id, reserved_qty, and reserved_by are required", http.StatusBadRequest)
		return
	}

	// Check available stock
	var totalQty, reservedQty int
	err := db.DB.QueryRow(`SELECT total_qty, reserved_qty FROM inventory_materials WHERE id = ?`, req.MaterialID).
		Scan(&totalQty, &reservedQty)
	if err != nil {
		jsonError(w, "Material not found", http.StatusNotFound)
		return
	}
	if req.ReservedQty > (totalQty - reservedQty) {
		jsonError(w, "Insufficient available quantity", http.StatusBadRequest)
		return
	}

	// Insert reservation
	_, err = db.DB.Exec(
		`INSERT INTO material_reservations (material_id, order_id, reserved_qty, purpose, reserved_by)
		 VALUES (?, ?, ?, ?, ?)`,
		req.MaterialID, req.OrderID, req.ReservedQty, req.Purpose, req.ReservedBy,
	)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Update reserved_qty on the material
	_, err = db.DB.Exec(
		`UPDATE inventory_materials SET reserved_qty = reserved_qty + ? WHERE id = ?`,
		req.ReservedQty, req.MaterialID,
	)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"message": "Reservation created successfully"})
}
