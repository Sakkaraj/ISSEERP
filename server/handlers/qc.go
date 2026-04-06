package handlers

import (
	"encoding/json"
	"net/http"
	"server/db"
	"time"
)

// ── Models ──────────────────────────────────────────────────────────────────

type QCRecord struct {
	ID                 int       `json:"id"`
	OrderID            string    `json:"order_id"`
	BatchID            string    `json:"batch_id"`
	ProductDescription string    `json:"product_description"`
	AQLLevel           string    `json:"aql_level"`
	Result             string    `json:"result"`
	DefectCount        int       `json:"defect_count"`
	InspectorName      string    `json:"inspector_name"`
	Department         string    `json:"department"`
	Notes              string    `json:"notes"`
	InspectedAt        time.Time `json:"inspected_at"`
}

type CreateQCRequest struct {
	OrderID            string `json:"order_id"`
	BatchID            string `json:"batch_id"`
	ProductDescription string `json:"product_description"`
	AQLLevel           string `json:"aql_level"`
	Result             string `json:"result"`
	DefectCount        int    `json:"defect_count"`
	InspectorName      string `json:"inspector_name"`
	Notes              string `json:"notes"`
}

// ── Handler ──────────────────────────────────────────────────────────────────

func QCHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getQCRecords(w, r)
	case http.MethodPost:
		createQCRecord(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getQCRecords(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(`
		SELECT id, order_id, batch_id, product_description, aql_level, result,
		       defect_count, inspector_name,
		       COALESCE(department, 'QC/QA'), COALESCE(notes, ''), inspected_at
		FROM qc_records
		ORDER BY inspected_at DESC
	`)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var records []QCRecord
	for rows.Next() {
		var rec QCRecord
		if err := rows.Scan(&rec.ID, &rec.OrderID, &rec.BatchID, &rec.ProductDescription,
			&rec.AQLLevel, &rec.Result, &rec.DefectCount, &rec.InspectorName,
			&rec.Department, &rec.Notes, &rec.InspectedAt); err != nil {
			continue
		}
		records = append(records, rec)
	}
	if records == nil {
		records = []QCRecord{}
	}
	writeJSON(w, http.StatusOK, records)
}

func createQCRecord(w http.ResponseWriter, r *http.Request) {
	var req CreateQCRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.OrderID == "" || req.BatchID == "" || req.ProductDescription == "" ||
		req.AQLLevel == "" || req.Result == "" || req.InspectorName == "" {
		jsonError(w, "order_id, batch_id, product_description, aql_level, result, and inspector_name are required", http.StatusBadRequest)
		return
	}

	result, err := db.DB.Exec(
		`INSERT INTO qc_records
		 (order_id, batch_id, product_description, aql_level, result, defect_count, inspector_name, notes)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		req.OrderID, req.BatchID, req.ProductDescription, req.AQLLevel,
		req.Result, req.DefectCount, req.InspectorName, req.Notes,
	)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	id, _ := result.LastInsertId()
	writeJSON(w, http.StatusCreated, map[string]interface{}{"message": "QC record created", "id": id})
}
