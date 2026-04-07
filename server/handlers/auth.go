package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"server/db"

	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Success  bool   `json:"success"`
	Message  string `json:"message"`
	Token    string `json:"token,omitempty"`
	Role     string `json:"role,omitempty"`
	Username string `json:"username,omitempty"`
}

type CreateUserRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type CreateUserResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	UserID  int    `json:"user_id,omitempty"`
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Adjust this query based on your actual users table structure in MySQL
	row := db.DB.QueryRow("SELECT id, username, password, role FROM users WHERE username = ?", req.Username)

	var id int
	var username string
	var hashedPassword string
	var role string
	err := row.Scan(&id, &username, &hashedPassword, &role)
	if err != nil {
		if err == sql.ErrNoRows {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(LoginResponse{Success: false, Message: "Invalid username or password"})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(LoginResponse{Success: false, Message: "Internal server error: check database connection"})
		return
	}

	// Assuming passwords will be stored encrypted with bcrypt
	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(LoginResponse{Success: false, Message: "Invalid username or password"})
		return
	}

	// Login Successful (you might want to issue a JWT token here in a real app)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(LoginResponse{
		Success:  true,
		Message:  "Login successful",
		Token:    "dummy_token_for_now",
		Role:     role,
		Username: username,
	})
}

// CreateUserHandler handles creation of new users (Admin only)
func CreateUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(CreateUserResponse{Success: false, Message: "Invalid request body"})
		return
	}

	// Validate required fields
	if req.Username == "" || req.Password == "" || req.Role == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(CreateUserResponse{Success: false, Message: "Username, password, and role are required"})
		return
	}

	// Validate role
	validRoles := map[string]bool{
		"Admin":             true,
		"SaleStaff":         true,
		"QualityController": true,
		"LogisticsStaff":    true,
		"Production":        true,
	}
	if !validRoles[req.Role] {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(CreateUserResponse{Success: false, Message: "Invalid role. Valid roles are: Admin, SaleStaff, QualityController, LogisticsStaff, Production"})
		return
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(CreateUserResponse{Success: false, Message: "Error hashing password"})
		return
	}

	// Insert into database
	result, err := db.DB.Exec(
		"INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
		req.Username,
		string(hashedPassword),
		req.Role,
	)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(CreateUserResponse{Success: false, Message: "Username already exists"})
		return
	}

	// Get the inserted user ID
	userID, err := result.LastInsertId()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(CreateUserResponse{Success: false, Message: "Error retrieving user ID"})
		return
	}

	// Success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(CreateUserResponse{
		Success: true,
		Message: "User created successfully",
		UserID:  int(userID),
	})
}
