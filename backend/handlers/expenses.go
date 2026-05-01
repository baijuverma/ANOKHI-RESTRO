package handlers

import (
	"backend/db"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func GetExpenses(c *fiber.Ctx) error {
	restaurantID := c.Query("restaurant_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if restaurantID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "restaurant_id is required"})
	}

	uid, _ := uuid.Parse(restaurantID)

	var expenses []models.Expense
	query := db.DB.Where("restaurant_id = ?", uid)

	if startDate != "" && endDate != "" {
		query = query.Where("expense_date >= ? AND expense_date <= ?", startDate, endDate)
	}

	result := query.Order("expense_date desc, created_at desc").Find(&expenses)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}

	return c.JSON(expenses)
}

func CreateExpense(c *fiber.Ctx) error {
	expense := new(models.Expense)
	if err := c.BodyParser(expense); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "cannot parse JSON"})
	}

	result := db.DB.Create(&expense)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}

	return c.Status(201).JSON(expense)
}

func GetStats(c *fiber.Ctx) error {
	restaurantID := c.Query("restaurant_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if restaurantID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "restaurant_id is required"})
	}

	uid, _ := uuid.Parse(restaurantID)

	var rev float64
	var exp float64

	// Sum Revenue
	db.DB.Model(&models.Order{}).
		Where("restaurant_id = ? AND created_at >= ? AND created_at <= ?", uid, startDate+" 00:00:00", endDate+" 23:59:59").
		Select("COALESCE(SUM(total), 0)").Scan(&rev)

	// Sum Expenses
	db.DB.Model(&models.Expense{}).
		Where("restaurant_id = ? AND expense_date >= ? AND expense_date <= ?", uid, startDate, endDate).
		Select("COALESCE(SUM(amount), 0)").Scan(&exp)

	return c.JSON(fiber.Map{
		"revenue": rev,
		"expenses": exp,
	})
}
