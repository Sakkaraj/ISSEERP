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

type ProductionOrder struct {
	ID                    int        `json:"id"`
	CustomerName          string     `json:"customer_name"`
	OrderType             string     `json:"order_type"`
	TotalAmount           float64    `json:"total_amount"`
	ItemCount             int        `json:"item_count"`
	Status                string     `json:"status"`
	OrderDate             time.Time  `json:"order_date"`
	StartedAt             *time.Time `json:"started_at,omitempty"`
	CompletedAt           *time.Time `json:"completed_at,omitempty"`
	AssignedTo            string     `json:"assigned_to"`
	ProgressPercent       int        `json:"progress_percent"`
	ProgressNote          *string    `json:"progress_note,omitempty"`
	ProgressUpdatedAt     *time.Time `json:"progress_updated_at,omitempty"`
	ProgressSubmittedAt   *time.Time `json:"progress_submitted_at,omitempty"`
	ProgressLastUpdatedBy *string    `json:"progress_last_updated_by,omitempty"`
}

type ProductionProgressRequest struct {
	OrderID         int      `json:"order_id"`
	Assignee        string   `json:"assignee"`
	ProgressPercent int      `json:"progress_percent"`
	ProgressNote    string   `json:"progress_note"`
	CompletedSteps  []string `json:"completed_steps"`
	TotalSteps      int      `json:"total_steps"`
	Submit          bool     `json:"submit"`
}

func stripChecklistSummary(note string) string {
	note = strings.TrimSpace(note)
	for strings.HasPrefix(strings.ToLower(note), "checklist ") {
		separatorIdx := strings.Index(note, " | ")
		if separatorIdx < 0 {
			return ""
		}
		note = strings.TrimSpace(note[separatorIdx+3:])
	}
	return note
}

func ProductionOrdersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	assignee := strings.TrimSpace(r.URL.Query().Get("assignee"))

	rows, err := db.DB.Query(`
		SELECT
			o.id,
			o.customer_name,
			COALESCE(o.order_type, 'OEM') AS order_type,
			o.total_amount,
			COALESCE(o.item_count, 1) AS item_count,
			o.status,
			o.order_date,
			o.started_at,
			o.completed_at,
			pa.assigned_to,
			COALESCE(pp.progress_percent, 0) AS progress_percent,
			pp.progress_note,
			pp.updated_at,
			pp.submitted_at,
			pp.updated_by
		FROM production_assignments pa
		JOIN orders o ON o.id = pa.order_id
		LEFT JOIN production_progress pp ON pp.id = (
			SELECT p2.id
			FROM production_progress p2
			WHERE p2.order_id = o.id
			ORDER BY p2.updated_at DESC, p2.id DESC
			LIMIT 1
		)
		WHERE (? = '' OR pa.assigned_to = ?)
		ORDER BY o.order_date DESC
	`, assignee, assignee)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	orders := make([]ProductionOrder, 0)
	for rows.Next() {
		var o ProductionOrder
		var progressNote sql.NullString
		var updatedAt sql.NullTime
		var submittedAt sql.NullTime
		var updatedBy sql.NullString

		if err := rows.Scan(
			&o.ID,
			&o.CustomerName,
			&o.OrderType,
			&o.TotalAmount,
			&o.ItemCount,
			&o.Status,
			&o.OrderDate,
			&o.StartedAt,
			&o.CompletedAt,
			&o.AssignedTo,
			&o.ProgressPercent,
			&progressNote,
			&updatedAt,
			&submittedAt,
			&updatedBy,
		); err != nil {
			continue
		}

		if progressNote.Valid {
			o.ProgressNote = &progressNote.String
		}
		if updatedAt.Valid {
			t := updatedAt.Time
			o.ProgressUpdatedAt = &t
		}
		if submittedAt.Valid {
			t := submittedAt.Time
			o.ProgressSubmittedAt = &t
		}
		if updatedBy.Valid {
			o.ProgressLastUpdatedBy = &updatedBy.String
		}

		orders = append(orders, o)
	}

	writeJSON(w, http.StatusOK, orders)
}

func ProductionProgressHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ProductionProgressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	req.Assignee = strings.TrimSpace(req.Assignee)
	req.ProgressNote = strings.TrimSpace(req.ProgressNote)

	if req.OrderID <= 0 {
		jsonError(w, "order_id is required", http.StatusBadRequest)
		return
	}
	if req.Assignee == "" {
		jsonError(w, "assignee is required", http.StatusBadRequest)
		return
	}

	calculatedProgress := req.ProgressPercent
	if req.TotalSteps > 0 {
		if len(req.CompletedSteps) > req.TotalSteps {
			jsonError(w, "completed_steps cannot exceed total_steps", http.StatusBadRequest)
			return
		}
		calculatedProgress = (len(req.CompletedSteps) * 100) / req.TotalSteps
	}

	if calculatedProgress < 0 || calculatedProgress > 100 {
		jsonError(w, "progress_percent must be between 0 and 100", http.StatusBadRequest)
		return
	}

	if req.Submit && calculatedProgress < 100 {
		jsonError(w, "cannot submit production until all checklist steps are complete", http.StatusBadRequest)
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	var orderExists int
	if err := tx.QueryRow(`SELECT COUNT(*) FROM orders WHERE id = ?`, req.OrderID).Scan(&orderExists); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if orderExists == 0 {
		jsonError(w, "Order not found", http.StatusNotFound)
		return
	}

	var assignedTo string
	assignmentErr := tx.QueryRow(`SELECT assigned_to FROM production_assignments WHERE order_id = ?`, req.OrderID).Scan(&assignedTo)
	if assignmentErr == sql.ErrNoRows {
		if _, err := tx.Exec(`INSERT INTO production_assignments (order_id, assigned_to) VALUES (?, ?)`, req.OrderID, req.Assignee); err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		assignedTo = req.Assignee
	} else if assignmentErr != nil {
		jsonError(w, assignmentErr.Error(), http.StatusInternalServerError)
		return
	}

	if assignedTo != req.Assignee {
		jsonError(w, "This order is assigned to a different production staff", http.StatusForbidden)
		return
	}

	manualProgressNote := stripChecklistSummary(req.ProgressNote)
	progressNoteToSave := manualProgressNote
	if req.TotalSteps > 0 {
		checklistSummary := fmt.Sprintf("Checklist %d/%d completed", len(req.CompletedSteps), req.TotalSteps)
		if len(req.CompletedSteps) > 0 {
			checklistSummary = checklistSummary + ": " + strings.Join(req.CompletedSteps, ", ")
		}
		if progressNoteToSave == "" {
			progressNoteToSave = checklistSummary
		} else {
			progressNoteToSave = checklistSummary + " | " + progressNoteToSave
		}
	}

	var result sql.Result
	if req.Submit {
		result, err = tx.Exec(`
			INSERT INTO production_progress (order_id, updated_by, progress_percent, progress_note, is_submitted, submitted_at)
			VALUES (?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP)
		`, req.OrderID, req.Assignee, calculatedProgress, progressNoteToSave)
	} else {
		result, err = tx.Exec(`
			INSERT INTO production_progress (order_id, updated_by, progress_percent, progress_note, is_submitted)
			VALUES (?, ?, ?, ?, FALSE)
		`, req.OrderID, req.Assignee, calculatedProgress, progressNoteToSave)
	}
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if req.Submit {
		if _, err := tx.Exec(`
			UPDATE orders
			SET
				status = 'In Progress',
				started_at = CASE WHEN started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
				completed_at = NULL
			WHERE id = ?
		`, req.OrderID); err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else if calculatedProgress > 0 {
		if _, err := tx.Exec(`
			UPDATE orders
			SET
				status = CASE WHEN status = 'Pending' THEN 'In Progress' ELSE status END,
				started_at = CASE WHEN started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
				completed_at = CASE WHEN status = 'Completed' THEN NULL ELSE completed_at END
			WHERE id = ?
		`, req.OrderID); err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	var orderStatus string
	var startedAt *time.Time
	var completedAt *time.Time
	if err := tx.QueryRow(`SELECT status, started_at, completed_at FROM orders WHERE id = ?`, req.OrderID).Scan(&orderStatus, &startedAt, &completedAt); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	progressID, _ := result.LastInsertId()
	if err := tx.Commit(); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message":             "Production progress saved",
		"progress_id":         progressID,
		"order_id":            req.OrderID,
		"assigned_to":         assignedTo,
		"progress_percent":    calculatedProgress,
		"progress_note":       progressNoteToSave,
		"submitted":           req.Submit,
		"order_status":        orderStatus,
		"started_at":          startedAt,
		"completed_at":        completedAt,
		"progress_updated_by": req.Assignee,
	})
}
