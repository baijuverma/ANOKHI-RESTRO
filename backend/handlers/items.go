package handlers

import (
	"backend/db"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func GetItems(c *fiber.Ctx) error {
	restaurantID := c.Query("restaurant_id")
	if restaurantID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "restaurant_id is required"})
	}

	uid, err := uuid.Parse(restaurantID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid restaurant_id"})
	}

	var items []models.Item
	result := db.DB.Where("restaurant_id = ? AND is_active = ?", uid, true).Find(&items)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}

	return c.JSON(items)
}

func CreateItem(c *fiber.Ctx) error {
	item := new(models.Item)
	if err := c.BodyParser(item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "cannot parse JSON"})
	}

	result := db.DB.Create(&item)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}

	return c.Status(201).JSON(item)
}

func UpdateItem(c *fiber.Ctx) error {
	id := c.Params("id")
	uid, err := uuid.Parse(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid item id"})
	}

	item := new(models.Item)
	if err := c.BodyParser(item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "cannot parse JSON"})
	}

	result := db.DB.Model(&models.Item{}).Where("id = ?", uid).Updates(item)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}

	return c.JSON(item)
}

func DeleteItem(c *fiber.Ctx) error {
	id := c.Params("id")
	uid, err := uuid.Parse(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid item id"})
	}

	result := db.DB.Delete(&models.Item{}, uid)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}

	return c.SendStatus(204)
}
