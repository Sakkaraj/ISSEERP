package main

import (
	"fmt"
	"net/http"
	"encoding/json"
)

func main() {
	http.HandleFunc("/api/message", func(w http.ResponseWriter, r *http.Request){
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Hello from Go!"})
	})

	fmt.Println("Server is running on port 8080")
	http.ListenAndServe(":8080", nil)
}