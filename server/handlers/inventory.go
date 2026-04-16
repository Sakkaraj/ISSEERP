package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"server/db"
	"strconv"
	"strings"
	"time"
)

// ── Models ──────────────────────────────────────────────────────────────────

type InventoryMaterial struct {
	ID                 int       `json:"id"`
	MaterialName       string    `json:"material_name"`
	Unit               string    `json:"unit"`
	TotalQty           int       `json:"total_qty"`
	ReservedQty        int       `json:"reserved_qty"`
	UsableForFinishing bool      `json:"usable_for_finishing"`
	Location           string    `json:"location"`
	CreatedAt          time.Time `json:"created_at"`
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

type CreateMaterialRequest struct {
	MaterialName       string  `json:"material_name"`
	Unit               string  `json:"unit"`
	TotalQty           int     `json:"total_qty"`
	UnitCost           float64 `json:"unit_cost"`
	UsableForFinishing bool    `json:"usable_for_finishing"`
	Location           string  `json:"location"`
}

type RestockMaterialRequest struct {
	MaterialID int     `json:"material_id"`
	AddedQty   int     `json:"added_qty"`
	UnitCost   float64 `json:"unit_cost"`
}

// ── Handlers ─────────────────────────────────────────────────────────────────

func MaterialsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getMaterials(w, r)
	case http.MethodPost:
		createMaterial(w, r)
	case http.MethodPatch:
		restockMaterial(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getMaterials(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(`
		SELECT id, material_name, unit, total_qty, reserved_qty, COALESCE(usable_for_finishing, 0), location, created_at
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
		var usableForFinishing int
		if err := rows.Scan(&m.ID, &m.MaterialName, &m.Unit, &m.TotalQty,
			&m.ReservedQty, &usableForFinishing, &m.Location, &m.CreatedAt); err != nil {
			continue
		}
		m.UsableForFinishing = usableForFinishing == 1
		materials = append(materials, m)
	}
	if materials == nil {
		materials = []InventoryMaterial{}
	}
	writeJSON(w, http.StatusOK, materials)
}

func createMaterial(w http.ResponseWriter, r *http.Request) {
	var req CreateMaterialRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.MaterialName == "" || req.TotalQty < 0 {
		jsonError(w, "material_name is required and total_qty must be >= 0", http.StatusBadRequest)
		return
	}
	if req.TotalQty > 0 && req.UnitCost <= 0 {
		jsonError(w, "unit_cost must be greater than 0 when total_qty is greater than 0", http.StatusBadRequest)
		return
	}

	if req.Unit == "" {
		req.Unit = "units"
	}
	if req.Location == "" {
		req.Location = "Warehouse A"
	}

	result, err := db.DB.Exec(
		`INSERT INTO inventory_materials (material_name, unit, total_qty, reserved_qty, usable_for_finishing, location)
		 VALUES (?, ?, ?, 0, ?, ?)`,
		req.MaterialName, req.Unit, req.TotalQty, req.UsableForFinishing, req.Location,
	)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()

	if req.TotalQty > 0 {
		totalCost := float64(req.TotalQty) * req.UnitCost
		if _, err := db.DB.Exec(
			`INSERT INTO supplies (item_name, cost, category)
			 VALUES (?, ?, ?)`,
			req.MaterialName+" (Initial Stock)", totalCost, "Inventory",
		); err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{"message": "Material created", "id": id})
}

func restockMaterial(w http.ResponseWriter, r *http.Request) {
	var req RestockMaterialRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.MaterialID <= 0 || req.AddedQty <= 0 {
		jsonError(w, "material_id and added_qty must be greater than 0", http.StatusBadRequest)
		return
	}
	if req.UnitCost <= 0 {
		jsonError(w, "unit_cost must be greater than 0", http.StatusBadRequest)
		return
	}

	var materialName string
	if err := db.DB.QueryRow(`SELECT material_name FROM inventory_materials WHERE id = ?`, req.MaterialID).Scan(&materialName); err != nil {
		if err == sql.ErrNoRows {
			jsonError(w, "Material not found", http.StatusNotFound)
			return
		}
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	result, err := db.DB.Exec(
		`UPDATE inventory_materials SET total_qty = total_qty + ? WHERE id = ?`,
		req.AddedQty, req.MaterialID,
	)
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
		jsonError(w, "Material not found", http.StatusNotFound)
		return
	}

	totalCost := float64(req.AddedQty) * req.UnitCost
	if _, err := db.DB.Exec(
		`INSERT INTO supplies (item_name, cost, category)
		 VALUES (?, ?, ?)`,
		materialName+" (Restock)", totalCost, "Inventory",
	); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Material restocked", "material_id": req.MaterialID, "added_qty": req.AddedQty, "total_cost": totalCost})
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
	orderID := strings.TrimSpace(r.URL.Query().Get("order_id"))

	query := `
		SELECT mr.id, mr.material_id, im.material_name, mr.order_id,
		       mr.reserved_qty, COALESCE(mr.purpose,''), mr.reserved_by,
		       mr.status, mr.reserved_at
		FROM material_reservations mr
		JOIN inventory_materials im ON mr.material_id = im.id
		WHERE (? = '' OR mr.order_id = ?)
		ORDER BY mr.reserved_at DESC
	`
	rows, err := db.DB.Query(query, orderID, orderID)
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
	req.OrderID = strings.TrimSpace(req.OrderID)
	req.ReservedBy = strings.TrimSpace(req.ReservedBy)
	req.Purpose = strings.TrimSpace(req.Purpose)
	if req.MaterialID == 0 || req.OrderID == "" || req.ReservedQty <= 0 || req.ReservedBy == "" {
		jsonError(w, "material_id, order_id, reserved_qty, and reserved_by are required", http.StatusBadRequest)
		return
	}

	orderIDInt, err := strconv.Atoi(req.OrderID)
	if err != nil || orderIDInt <= 0 {
		jsonError(w, "order_id must be a valid numeric order id", http.StatusBadRequest)
		return
	}

	var orderExists int
	if err := db.DB.QueryRow(`SELECT COUNT(*) FROM orders WHERE id = ?`, orderIDInt).Scan(&orderExists); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if orderExists == 0 {
		jsonError(w, "Linked order not found", http.StatusBadRequest)
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	var totalQty int
	var currentReservedQty int
	materialErr := tx.QueryRow(`SELECT total_qty, reserved_qty FROM inventory_materials WHERE id = ? FOR UPDATE`, req.MaterialID).
		Scan(&totalQty, &currentReservedQty)
	if materialErr == sql.ErrNoRows {
		jsonError(w, "Material not found", http.StatusNotFound)
		return
	}
	if materialErr != nil {
		jsonError(w, materialErr.Error(), http.StatusInternalServerError)
		return
	}
	if req.ReservedQty > totalQty {
		jsonError(w, "Insufficient available quantity", http.StatusBadRequest)
		return
	}

	if _, err := tx.Exec(
		`INSERT INTO material_reservations (material_id, order_id, reserved_qty, purpose, reserved_by)
		 VALUES (?, ?, ?, ?, ?)`,
		req.MaterialID, strconv.Itoa(orderIDInt), req.ReservedQty, req.Purpose, req.ReservedBy,
	); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if _, err := tx.Exec(
		`UPDATE inventory_materials
		 SET total_qty = total_qty - ?,
		     reserved_qty = reserved_qty + ?
		 WHERE id = ?`,
		req.ReservedQty, req.ReservedQty, req.MaterialID,
	); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"message": "Reservation created successfully"})
}
