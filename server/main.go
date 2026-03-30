package main

import (
	"log"
	"net/http"
	"os"
	"server/db"
	"server/handlers"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}
	db.Connect()
	router := setupRouter()

	port := os.Getenv("PORT")
	log.Println("Server is running on :" + port)
	http.ListenAndServe(":"+port, router)
}

func setupRouter() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/login", handlers.LoginHandler)

	// Serve React strict production build
	fs := http.FileServer(http.Dir("../client/dist"))
	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// If the file exists, serve it
		if _, err := os.Stat("../client/dist" + r.URL.Path); err == nil {
			fs.ServeHTTP(w, r)
			return
		}
		// Otherwise, fall back to index.html for React Router
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