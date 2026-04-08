package handlers

import (
	"encoding/json"
	"net/http"
	"server/db"
	"strings"
	"time"
)

// ── Models ──────────────────────────────────────────────────────────────────

type Construction struct {
	ID                   int             `json:"id"`
	DesignMode           string          `json:"design_mode"`
	FurnitureType        string          `json:"furniture_type"`
	PrimaryFinish        string          `json:"primary_finish"`
	SecondaryFinish      string          `json:"secondary_finish"`
	ReferenceCode        string          `json:"reference_code"`
	CustomerRequirements string          `json:"customer_requirements"`
	ExtraFinish          bool            `json:"extra_finish"`
	SpecialFinishes      json.RawMessage `json:"special_finishes"`
	ImageURL             string          `json:"image_url"`
	RequestDate          time.Time       `json:"request_date"`
}

type CreateConstructionRequest struct {
	DesignMode           string   `json:"design_mode"`
	FurnitureType        string   `json:"furniture_type"`
	PrimaryFinish        string   `json:"primary_finish"`
	SecondaryFinish      string   `json:"secondary_finish"`
	ReferenceCode        string   `json:"reference_code"`
	CustomerRequirements string   `json:"customer_requirements"`
	ExtraFinish          bool     `json:"extra_finish"`
	SpecialFinishes      []string `json:"special_finishes"`
	ImageURL             string   `json:"image_url"`
}

// ── Handler ──────────────────────────────────────────────────────────────────

func ConstructionsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getConstructions(w, r)
	case http.MethodPost:
		createConstruction(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getConstructions(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(`
		SELECT id, COALESCE(design_mode, 'OEM'), furniture_type, primary_finish, COALESCE(secondary_finish,''),
		       COALESCE(reference_code,''), COALESCE(customer_requirements,''),
		       extra_finish, COALESCE(special_finishes, '[]'), COALESCE(image_url,''), request_date
		FROM constructions ORDER BY request_date DESC
	`)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var constructions []Construction
	for rows.Next() {
		var c Construction
		var extraFinish int
		var specialFinishesStr string
		if err := rows.Scan(&c.ID, &c.DesignMode, &c.FurnitureType, &c.PrimaryFinish, &c.SecondaryFinish,
			&c.ReferenceCode, &c.CustomerRequirements,
			&extraFinish, &specialFinishesStr, &c.ImageURL, &c.RequestDate); err != nil {
			continue
		}
		c.ExtraFinish = extraFinish == 1
		c.SpecialFinishes = json.RawMessage(specialFinishesStr)
		constructions = append(constructions, c)
	}
	if constructions == nil {
		constructions = []Construction{}
	}
	writeJSON(w, http.StatusOK, constructions)
}

func createConstruction(w http.ResponseWriter, r *http.Request) {
	var req CreateConstructionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.FurnitureType == "" || req.PrimaryFinish == "" {
		jsonError(w, "furniture_type and primary_finish are required", http.StatusBadRequest)
		return
	}
	req.DesignMode = strings.TrimSpace(req.DesignMode)
	req.FurnitureType = strings.TrimSpace(req.FurnitureType)
	req.PrimaryFinish = strings.TrimSpace(req.PrimaryFinish)
	req.SecondaryFinish = strings.TrimSpace(req.SecondaryFinish)
	req.ReferenceCode = strings.TrimSpace(req.ReferenceCode)
	req.CustomerRequirements = strings.TrimSpace(req.CustomerRequirements)
	if req.DesignMode == "" {
		req.DesignMode = "OEM"
	}
	validModes := map[string]bool{"OEM": true, "ODM": true, "Bespoke": true}
	if !validModes[req.DesignMode] {
		jsonError(w, "design_mode must be OEM, ODM, or Bespoke", http.StatusBadRequest)
		return
	}

	specialFinishesJSON, err := json.Marshal(req.SpecialFinishes)
	if err != nil {
		jsonError(w, "Invalid special_finishes", http.StatusBadRequest)
		return
	}

	result, err := db.DB.Exec(
		`INSERT INTO constructions (design_mode, furniture_type, primary_finish, secondary_finish, reference_code, customer_requirements, extra_finish, special_finishes, image_url)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		req.DesignMode, req.FurnitureType, req.PrimaryFinish, req.SecondaryFinish, req.ReferenceCode, req.CustomerRequirements,
		req.ExtraFinish, string(specialFinishesJSON), req.ImageURL,
	)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	id, _ := result.LastInsertId()
	writeJSON(w, http.StatusCreated, map[string]interface{}{"message": "Design specification created", "id": id})
}
