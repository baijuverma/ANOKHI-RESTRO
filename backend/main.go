package main

import (
	"log"
	"os"

	"backend/db"
	"backend/handlers"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	godotenv.Load("../.env.local")

	// Initialize Database
	db.Connect()

	app := fiber.New(fiber.Config{
		AppName: "Restaurant Billing API",
	})

	// Middleware
	app.Use(cors.New())

	// Health Check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	// API Routes
	api := app.Group("/api")
	
	// Items
	api.Get("/items", handlers.GetItems)
	api.Post("/items", handlers.CreateItem)
	api.Put("/items/:id", handlers.UpdateItem)
	api.Delete("/items/:id", handlers.DeleteItem)
	
	// Orders
	api.Get("/orders", handlers.GetOrders)
	api.Post("/orders", handlers.CreateOrder)
	
	// Expenses
	api.Get("/expenses", handlers.GetExpenses)
	api.Post("/expenses", handlers.CreateExpense)
	api.Get("/stats", handlers.GetStats)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(app.Listen(":" + port))
}
