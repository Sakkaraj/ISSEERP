package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/joho/godotenv"
)

var DB *sql.DB

func Connect() {
	var err error
	connStr := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	DB, err = sql.Open("mysql", connStr)
	if err != nil {
		log.Fatal("Failed to connect to DB: ", err)
	}
	if err = DB.Ping(); err != nil {
		log.Fatal("DB not reachable: ", err)
	}

	log.Println("Database connected!")
}