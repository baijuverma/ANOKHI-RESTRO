package handlers

import (
	"strconv"
	"backend/db"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func GetOrders(c *fiber.Ctx) error {
	restaurantID := c.Query("restaurant_id")
	page, _ := strconv.Atoi(c.Query("page", "0"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "25"))
	status := c.Query("status", "all")
	mode := c.Query("mode", "all")
	search := c.Query("search", "")

	if restaurantID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "restaurant_id is required"})
	}

	uid, _ := uuid.Parse(restaurantID)
	var orders []models.Order
	var count int64

	query := db.DB.Model(&models.Order{}).Where("restaurant_id = ?", uid)

	if status != "all" {
		query = query.Where("status = ?", status)
	}
	if mode != "all" {
		query = query.Where("payment_method = ?", mode)
	}
	if search != "" {
		query = query.Where("customer_name ILIKE ? OR CAST(bill_number AS TEXT) ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query.Count(&count)
	result := query.Order("created_at desc").Offset(page * perPage).Limit(perPage).Find(&orders)
	
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  orders,
		"count": count,
	})
}

func CreateOrder(c *fiber.Ctx) error {
	payload := new(struct {
		models.Order
		Items []models.OrderItem `json:"items"`
	})

	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "cannot parse JSON"})
	}

	// Transaction to ensure order and items are created together
	err := db.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Create Order
		if err := tx.Create(&payload.Order).Error; err != nil {
			return err
		}

		// 2. Set OrderID for items and create them
		for i := range payload.Items {
			payload.Items[i].OrderID = payload.Order.ID
		}

		if err := tx.Create(&payload.Items).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(payload)
}
