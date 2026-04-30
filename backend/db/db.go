package db

import (
	"log"
	"os"
	"backend/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Println("⚠️ DATABASE_URL not found, local Go API might fail. Please ensure it is set in .env.local")
		return
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to Supabase database:", err)
	}

	log.Println("Connected to Supabase PostgreSQL!")

	// Auto Migration
	DB.AutoMigrate(
		&models.User{},
		&models.Restaurant{},
		&models.Item{},
		&models.Order{},
		&models.OrderItem{},
		&models.Expense{},
	)
}
