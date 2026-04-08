package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"server/db"
	"server/handlers"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found; using existing environment variables")
	}
	if os.Getenv("PORT") == "" {
		os.Setenv("PORT", "8080")
	}
	db.Connect()
	router := setupRouter()

	port := os.Getenv("PORT")
	log.Println("Server is running on :" + port)
	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatal(err)
	}
}

func setupRouter() *http.ServeMux {
	mux := http.NewServeMux()

	// Auth
	mux.HandleFunc("/api/login", handlers.LoginHandler)
	mux.HandleFunc("/api/users", handlers.CreateUserHandler)

	// UC1 — Orders
	mux.HandleFunc("/api/orders", handlers.OrdersHandler)

	// UC2 — Inventory & Material Reservations
	mux.HandleFunc("/api/inventory/materials", handlers.MaterialsHandler)
	mux.HandleFunc("/api/inventory/reservations", handlers.ReservationsHandler)

	// UC3 — QC Inspection Register
	mux.HandleFunc("/api/qc", handlers.QCHandler)
	mux.HandleFunc("/api/qc/requirements", handlers.QCRequirementsHandler)
	mux.HandleFunc("/api/finance", handlers.FinanceHandler)
	mux.HandleFunc("/api/production/orders", handlers.ProductionOrdersHandler)
	mux.HandleFunc("/api/production/progress", handlers.ProductionProgressHandler)

	// Construct — Design Specifications
	mux.HandleFunc("/api/constructions", handlers.ConstructionsHandler)

	// In development, forward all non-API routes to Vite dev server.
	// This lets http://localhost:8080 always show the latest frontend.
	if frontendDevURL := os.Getenv("FRONTEND_DEV_URL"); frontendDevURL != "" {
		target, err := url.Parse(frontendDevURL)
		if err != nil {
			log.Printf("Invalid FRONTEND_DEV_URL %q: %v", frontendDevURL, err)
		} else {
			log.Printf("Frontend mode: proxying non-API routes to %s", frontendDevURL)
			proxy := httputil.NewSingleHostReverseProxy(target)
			mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/api" || len(r.URL.Path) >= 5 && r.URL.Path[:5] == "/api/" {
					http.NotFound(w, r)
					return
				}
				proxy.ServeHTTP(w, r)
			}))
			return mux
		}
	}

	// Serve React production build (SPA fallback)
	log.Println("Frontend mode: serving ../client/dist")
	fs := http.FileServer(http.Dir("../client/dist"))
	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, err := os.Stat("../client/dist" + r.URL.Path); err == nil {
			fs.ServeHTTP(w, r)
			return
		}
		http.ServeFile(w, r, "../client/dist/index.html")
	}))

	return mux
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/api/login":
		handlers.LoginHandler(w, r)
	default:
		http.Error(w, "Not Found", http.StatusNotFound)
	}
}
