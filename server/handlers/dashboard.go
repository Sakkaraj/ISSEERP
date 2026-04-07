package handlers

import (
	"net/http"
	"server/db"
	"time"
)

type FinanceOrderItem struct {
	ID     int     `json:"id"`
	Name   string  `json:"name"`
	Amount float64 `json:"amount"`
	Date   string  `json:"date"`
}

type FinanceSupplyItem struct {
	ID   int     `json:"id"`
	Name string  `json:"name"`
	Cost float64 `json:"cost"`
	Date string  `json:"date"`
}

type FinanceSummaryResponse struct {
	TotalIncome    float64             `json:"totalIncome"`
	TotalExpenses  float64             `json:"totalExpenses"`
	NetProfit      float64             `json:"netProfit"`
	RecentOrders   []FinanceOrderItem  `json:"recentOrders"`
	RecentSupplies []FinanceSupplyItem `json:"recentSupplies"`
}

func FinanceHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var totalIncome float64
	if err := db.DB.QueryRow(`SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'Completed'`).Scan(&totalIncome); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var totalExpenses float64
	if err := db.DB.QueryRow(`SELECT COALESCE(SUM(cost), 0) FROM supplies`).Scan(&totalExpenses); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	orderRows, err := db.DB.Query(`
		SELECT id, customer_name, total_amount, order_date
		FROM orders
		WHERE status = 'Completed'
		ORDER BY order_date DESC
		LIMIT 8
	`)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer orderRows.Close()

	recentOrders := []FinanceOrderItem{}
	for orderRows.Next() {
		var row FinanceOrderItem
		var date time.Time
		if err := orderRows.Scan(&row.ID, &row.Name, &row.Amount, &date); err != nil {
			continue
		}
		row.Date = date.Format("2006-01-02")
		recentOrders = append(recentOrders, row)
	}

	supplyRows, err := db.DB.Query(`
		SELECT id, item_name, cost, purchase_date
		FROM supplies
		ORDER BY purchase_date DESC
		LIMIT 8
	`)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer supplyRows.Close()

	recentSupplies := []FinanceSupplyItem{}
	for supplyRows.Next() {
		var row FinanceSupplyItem
		var date time.Time
		if err := supplyRows.Scan(&row.ID, &row.Name, &row.Cost, &date); err != nil {
			continue
		}
		row.Date = date.Format("2006-01-02")
		recentSupplies = append(recentSupplies, row)
	}

	resp := FinanceSummaryResponse{
		TotalIncome:    totalIncome,
		TotalExpenses:  totalExpenses,
		NetProfit:      totalIncome - totalExpenses,
		RecentOrders:   recentOrders,
		RecentSupplies: recentSupplies,
	}

	writeJSON(w, http.StatusOK, resp)
}
