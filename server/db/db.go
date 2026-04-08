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
	unitPriceExists, err := ordersColumnExists("unit_price")
	if err != nil {
		return err
	}
	if !unitPriceExists {
		if err := ensureOrdersColumn("unit_price", "DECIMAL(15,2) NOT NULL DEFAULT 0.00"); err != nil {
			log.Printf("Schema migration warning: cannot add unit_price column: %v", err)
		}
	}
	constructionIDExists, err := ordersColumnExists("construction_id")
	if err != nil {
		return err
	}
	if !constructionIDExists {
		if err := ensureOrdersColumn("construction_id", "INT NULL"); err != nil {
			log.Printf("Schema migration warning: cannot add construction_id column: %v", err)
		}
	}
	if _, err := DB.Exec(`
		UPDATE orders
		SET unit_price = ROUND(total_amount / item_count, 2)
		WHERE item_count > 0 AND total_amount > 0 AND unit_price = 0
	`); err != nil {
		log.Printf("Schema migration warning: cannot backfill unit_price values: %v", err)
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

	if err := ensureProductionTables(); err != nil {
		return err
	}

	if err := ensureConstructionColumns(); err != nil {
		return err
	}

	return nil
}

func ensureProductionTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS production_assignments (
			id INT AUTO_INCREMENT PRIMARY KEY,
			order_id INT NOT NULL UNIQUE,
			assigned_to VARCHAR(100) NOT NULL,
			assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (order_id) REFERENCES orders(id)
		)`,
		`CREATE TABLE IF NOT EXISTS production_progress (
			id INT AUTO_INCREMENT PRIMARY KEY,
			order_id INT NOT NULL,
			updated_by VARCHAR(100) NOT NULL,
			progress_percent INT NOT NULL,
			progress_note TEXT,
			is_submitted BOOLEAN NOT NULL DEFAULT FALSE,
			submitted_at TIMESTAMP NULL,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (order_id) REFERENCES orders(id)
		)`,
	}

	for _, q := range queries {
		if _, err := DB.Exec(q); err != nil {
			return err
		}
	}

	return nil
}

func ensureOrdersColumn(columnName, columnType string) error {
	_, err := DB.Exec(fmt.Sprintf("ALTER TABLE orders ADD COLUMN %s %s", columnName, columnType))
	return err
}

func ensureConstructionColumns() error {
	columns := map[string]string{
		"design_mode":           "ENUM('OEM', 'ODM', 'Bespoke') NOT NULL DEFAULT 'OEM'",
		"reference_code":        "VARCHAR(100) NULL",
		"customer_requirements": "TEXT NULL",
	}

	for columnName, columnType := range columns {
		exists, err := constructionsColumnExists(columnName)
		if err != nil {
			return err
		}
		if exists {
			continue
		}
		_, err = DB.Exec(fmt.Sprintf("ALTER TABLE constructions ADD COLUMN %s %s", columnName, columnType))
		if err != nil {
			log.Printf("Schema migration warning: cannot add constructions.%s column: %v", columnName, err)
		}
	}

	return nil
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

func constructionsColumnExists(columnName string) (bool, error) {
	var exists int
	err := DB.QueryRow(`
		SELECT COUNT(*)
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
		  AND TABLE_NAME = 'constructions'
		  AND COLUMN_NAME = ?
	`, columnName).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists > 0, nil
}
