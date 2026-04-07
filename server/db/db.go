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
var OrdersStatusTimestampsEnabled bool

func Connect() {
	var err error
	connStr := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?parseTime=true",
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

	if err = ensureSchema(); err != nil {
		log.Fatal("Schema migration failed: ", err)
	}

	log.Println("Database connected!")
}

func ensureSchema() error {
	startedAtExists, err := ordersColumnExists("started_at")
	if err != nil {
		return err
	}
	completedAtExists, err := ordersColumnExists("completed_at")
	if err != nil {
		return err
	}

	if !startedAtExists {
		if err := ensureOrdersColumn("started_at", "TIMESTAMP NULL"); err != nil {
			log.Printf("Schema migration warning: cannot add started_at column: %v", err)
		}
	}
	if !completedAtExists {
		if err := ensureOrdersColumn("completed_at", "TIMESTAMP NULL"); err != nil {
			log.Printf("Schema migration warning: cannot add completed_at column: %v", err)
		}
	}

	startedAtExists, err = ordersColumnExists("started_at")
	if err != nil {
		return err
	}
	completedAtExists, err = ordersColumnExists("completed_at")
	if err != nil {
		return err
	}

	OrdersStatusTimestampsEnabled = startedAtExists && completedAtExists
	if !OrdersStatusTimestampsEnabled {
		log.Printf("Schema migration warning: order status timestamps disabled (missing started_at/completed_at columns)")
	}

	return nil
}

func ensureOrdersColumn(columnName, columnType string) error {
	_, err := DB.Exec(fmt.Sprintf("ALTER TABLE orders ADD COLUMN %s %s", columnName, columnType))
	return err
}

func ordersColumnExists(columnName string) (bool, error) {
	var exists int
	err := DB.QueryRow(`
		SELECT COUNT(*)
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
		  AND TABLE_NAME = 'orders'
		  AND COLUMN_NAME = ?
	`, columnName).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists > 0, nil
}