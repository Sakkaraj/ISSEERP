package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"server/db"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type authTokenClaims struct {
	Username  string `json:"username"`
	Role      string `json:"role"`
	IssuedAt  int64  `json:"iat"`
	ExpiresAt int64  `json:"exp"`
}

func authTokenSecret() []byte {
	secret := os.Getenv("AUTH_TOKEN_SECRET")
	if secret == "" {
		secret = "boonsunclon-demo-secret"
	}
	return []byte(secret)
}

func generateAuthToken(username, role string) (string, error) {
	now := time.Now().UTC()
	claims := authTokenClaims{
		Username:  username,
		Role:      role,
		IssuedAt:  now.Unix(),
		ExpiresAt: now.Add(24 * time.Hour).Unix(),
	}

	payload, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}

	encodedPayload := base64.RawURLEncoding.EncodeToString(payload)
	mac := hmac.New(sha256.New, authTokenSecret())
	mac.Write([]byte(encodedPayload))
	signature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	return encodedPayload + "." + signature, nil
}

func parseAuthToken(token string) (*authTokenClaims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return nil, errors.New("invalid token format")
	}

	payloadPart := parts[0]
	signaturePart := parts[1]

	mac := hmac.New(sha256.New, authTokenSecret())
	mac.Write([]byte(payloadPart))
	expectedSignature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(signaturePart), []byte(expectedSignature)) {
		return nil, errors.New("invalid token signature")
	}

	payload, err := base64.RawURLEncoding.DecodeString(payloadPart)
	if err != nil {
		return nil, err
	}

	var claims authTokenClaims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, err
	}

	if time.Now().UTC().Unix() > claims.ExpiresAt {
		return nil, errors.New("token expired")
	}

	return &claims, nil
}

func bearerTokenFromRequest(r *http.Request) string {
	authorization := strings.TrimSpace(r.Header.Get("Authorization"))
	if authorization == "" {
		return ""
	}
	if !strings.HasPrefix(strings.ToLower(authorization), "bearer ") {
		return ""
	}
	return strings.TrimSpace(authorization[len("Bearer "):])
}

func requireAdminRole(r *http.Request) error {
	token := bearerTokenFromRequest(r)
	if token == "" {
		return errors.New("missing authorization token")
	}

	claims, err := parseAuthToken(token)
	if err != nil {
		return err
	}
	if claims.Role != "Admin" {
		return fmt.Errorf("forbidden: admin role required")
	}
	return nil
}

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

	token, err := generateAuthToken(username, role)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(LoginResponse{Success: false, Message: "Failed to create session token"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(LoginResponse{
		Success:  true,
		Message:  "Login successful",
		Token:    token,
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

	if err := requireAdminRole(r); err != nil {
		w.Header().Set("Content-Type", "application/json")
		status := http.StatusUnauthorized
		if strings.HasPrefix(err.Error(), "forbidden") {
			status = http.StatusForbidden
		}
		w.WriteHeader(status)
		json.NewEncoder(w).Encode(CreateUserResponse{Success: false, Message: err.Error()})
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
