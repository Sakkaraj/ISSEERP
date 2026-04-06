package handlers

import (
	"encoding/json"
	"net/http"
	"server/db"
	"time"
)

// ── Models ──────────────────────────────────────────────────────────────────

type Construction struct {
	ID              int             `json:"id"`
	FurnitureType   string          `json:"furniture_type"`
	PrimaryFinish   string          `json:"primary_finish"`
	SecondaryFinish string          `json:"secondary_finish"`
	ExtraFinish     bool            `json:"extra_finish"`
	SpecialFinishes json.RawMessage `json:"special_finishes"`
	ImageURL        string          `json:"image_url"`
	RequestDate     time.Time       `json:"request_date"`
}

type CreateConstructionRequest struct {
	FurnitureType   string   `json:"furniture_type"`
	PrimaryFinish   string   `json:"primary_finish"`
	SecondaryFinish string   `json:"secondary_finish"`
	ExtraFinish     bool     `json:"extra_finish"`
	SpecialFinishes []string `json:"special_finishes"`
	ImageURL        string   `json:"image_url"`
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
		SELECT id, furniture_type, primary_finish, COALESCE(secondary_finish,''),
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
		if err := rows.Scan(&c.ID, &c.FurnitureType, &c.PrimaryFinish, &c.SecondaryFinish,
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

	specialFinishesJSON, err := json.Marshal(req.SpecialFinishes)
	if err != nil {
		jsonError(w, "Invalid special_finishes", http.StatusBadRequest)
		return
	}

	result, err := db.DB.Exec(
		`INSERT INTO constructions (furniture_type, primary_finish, secondary_finish, extra_finish, special_finishes, image_url)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		req.FurnitureType, req.PrimaryFinish, req.SecondaryFinish,
		req.ExtraFinish, string(specialFinishesJSON), req.ImageURL,
	)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	id, _ := result.LastInsertId()
	writeJSON(w, http.StatusCreated, map[string]interface{}{"message": "Design specification created", "id": id})
}
