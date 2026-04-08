package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"server/db"
	"strconv"
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

type QCRequirement struct {
	OrderID               int        `json:"order_id"`
	CustomerName          string     `json:"customer_name"`
	OrderType             string     `json:"order_type"`
	ItemCount             int        `json:"item_count"`
	AssignedTo            *string    `json:"assigned_to,omitempty"`
	ProductionSubmittedAt *time.Time `json:"production_submitted_at,omitempty"`
	ProductionSubmittedBy *string    `json:"production_submitted_by,omitempty"`
	LatestQCResult        *string    `json:"latest_qc_result,omitempty"`
	LatestQCInspectedAt   *time.Time `json:"latest_qc_inspected_at,omitempty"`
	LatestQCInspector     *string    `json:"latest_qc_inspector,omitempty"`
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

func QCRequirementsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.DB.Query(`
		SELECT
			o.id,
			o.customer_name,
			COALESCE(o.order_type, 'OEM') AS order_type,
			COALESCE(o.item_count, 1) AS item_count,
			pa.assigned_to,
			ps.submitted_at AS production_submitted_at,
			ps.updated_by AS production_submitted_by,
			q.result,
			q.inspected_at,
			q.inspector_name
		FROM orders o
		LEFT JOIN production_assignments pa ON pa.order_id = o.id
		LEFT JOIN production_progress ps ON ps.id = (
			SELECT p2.id
			FROM production_progress p2
			WHERE p2.order_id = o.id
			  AND p2.is_submitted = TRUE
			ORDER BY p2.submitted_at DESC, p2.id DESC
			LIMIT 1
		)
		LEFT JOIN qc_records q ON q.id = (
			SELECT q2.id
			FROM qc_records q2
			WHERE CAST(q2.order_id AS UNSIGNED) = o.id
			ORDER BY q2.inspected_at DESC, q2.id DESC
			LIMIT 1
		)
		WHERE
			(
				ps.submitted_at IS NOT NULL
				OR q.result = 'Fail'
			)
			AND (q.result IS NULL OR q.result <> 'Pass')
		ORDER BY o.order_date DESC
	`)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	requirements := make([]QCRequirement, 0)
	for rows.Next() {
		var req QCRequirement
		var assignedTo sql.NullString
		var submittedAt sql.NullTime
		var submittedBy sql.NullString
		var latestResult sql.NullString
		var latestInspectedAt sql.NullTime
		var latestInspector sql.NullString

		if err := rows.Scan(
			&req.OrderID,
			&req.CustomerName,
			&req.OrderType,
			&req.ItemCount,
			&assignedTo,
			&submittedAt,
			&submittedBy,
			&latestResult,
			&latestInspectedAt,
			&latestInspector,
		); err != nil {
			continue
		}

		if assignedTo.Valid {
			req.AssignedTo = &assignedTo.String
		}
		if submittedAt.Valid {
			t := submittedAt.Time
			req.ProductionSubmittedAt = &t
		}
		if submittedBy.Valid {
			req.ProductionSubmittedBy = &submittedBy.String
		}
		if latestResult.Valid {
			req.LatestQCResult = &latestResult.String
		}
		if latestInspectedAt.Valid {
			t := latestInspectedAt.Time
			req.LatestQCInspectedAt = &t
		}
		if latestInspector.Valid {
			req.LatestQCInspector = &latestInspector.String
		}

		requirements = append(requirements, req)
	}

	writeJSON(w, http.StatusOK, requirements)
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

	orderID, err := strconv.Atoi(req.OrderID)
	if err != nil || orderID <= 0 {
		jsonError(w, "order_id must be a valid numeric order id", http.StatusBadRequest)
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	var exists int
	if err := tx.QueryRow(`SELECT id FROM orders WHERE id = ?`, orderID).Scan(&exists); err != nil {
		if err == sql.ErrNoRows {
			jsonError(w, "Linked order not found", http.StatusBadRequest)
			return
		}
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var productionSubmittedCount int
	if err := tx.QueryRow(`
		SELECT COUNT(*)
		FROM production_progress
		WHERE order_id = ? AND is_submitted = TRUE
	`, orderID).Scan(&productionSubmittedCount); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if productionSubmittedCount == 0 {
		jsonError(w, "Order is not yet submitted from production", http.StatusBadRequest)
		return
	}

	result, err := tx.Exec(
		`INSERT INTO qc_records
		 (order_id, batch_id, product_description, aql_level, result, defect_count, inspector_name, notes)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		orderID, req.BatchID, req.ProductDescription, req.AQLLevel,
		req.Result, req.DefectCount, req.InspectorName, req.Notes,
	)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	id, _ := result.LastInsertId()

	var startedAt *time.Time
	var completedAt *time.Time
	orderStatus := ""
	if req.Result == "Pass" {
		updateResult, err := tx.Exec(`
			UPDATE orders
			SET
				status = 'Completed',
				started_at = CASE WHEN started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
				completed_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`, orderID)
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}

		rowsAffected, err := updateResult.RowsAffected()
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if rowsAffected == 0 {
			jsonError(w, "Linked order not found", http.StatusBadRequest)
			return
		}

		if err := tx.QueryRow(`SELECT completed_at FROM orders WHERE id = ?`, orderID).Scan(&completedAt); err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		orderStatus = "Completed"
	} else if req.Result == "Fail" {
		updateResult, err := tx.Exec(`
			UPDATE orders
			SET
				status = 'In Progress',
				started_at = CASE WHEN started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
				completed_at = NULL
			WHERE id = ?
		`, orderID)
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}

		rowsAffected, err := updateResult.RowsAffected()
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if rowsAffected == 0 {
			jsonError(w, "Linked order not found", http.StatusBadRequest)
			return
		}

		if err := tx.QueryRow(`SELECT started_at FROM orders WHERE id = ?`, orderID).Scan(&startedAt); err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		orderStatus = "In Progress"
	}

	if err := tx.Commit(); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"message":  "QC record created",
		"id":       id,
		"order_id": orderID,
	}
	if orderStatus != "" {
		response["order_status"] = orderStatus
	}
	if startedAt != nil {
		response["started_at"] = startedAt
	}
	if completedAt != nil {
		response["completed_at"] = completedAt
		response["message"] = "QC record created and linked order marked as Completed"
	}
	if orderStatus == "In Progress" {
		response["message"] = "QC record created and linked order moved to In Progress"
	}

	writeJSON(w, http.StatusCreated, response)
}
