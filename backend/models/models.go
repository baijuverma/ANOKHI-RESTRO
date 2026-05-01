package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	RestaurantID uuid.UUID `gorm:"type:uuid" json:"restaurant_id"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

type Restaurant struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name          string    `json:"name"`
	GSTNumber     string    `json:"gst_number"`
	Address       string    `json:"address"`
	Phone         string    `json:"phone"`
	LogoURL       string    `json:"logo_url"`
	GSTEnabled    bool      `json:"gst_enabled"`
	GSTPercentage float64   `json:"gst_percentage"`
	PrinterSize   string    `json:"printer_size"`
	CreatedAt     time.Time `json:"created_at"`
	OwnerID       uuid.UUID `gorm:"type:uuid" json:"owner_id"`
}

type Item struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	RestaurantID uuid.UUID `gorm:"type:uuid" json:"restaurant_id"`
	Name         string    `json:"name"`
	Category     string    `json:"category"`
	Price        float64   `json:"price"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}

type Order struct {
	ID            uuid.UUID   `gorm:"type:uuid;primaryKey" json:"id"`
	RestaurantID  uuid.UUID   `gorm:"type:uuid" json:"restaurant_id"`
	BillNumber    int         `gorm:"autoIncrement" json:"bill_number"`
	CustomerName  string      `json:"customer_name"`
	CustomerPhone string      `json:"customer_phone"`
	GSTEnabled    bool        `json:"gst_enabled"`
	Subtotal      float64     `json:"subtotal"`
	GSTAmount     float64     `json:"gst_amount"`
	Total         float64     `json:"total"`
	PaymentMethod string      `json:"payment_method"`
	Status        string      `json:"status"`
	CreatedAt     time.Time   `json:"created_at"`
	Items         []OrderItem `gorm:"foreignKey:OrderID" json:"items"`
}

type OrderItem struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	OrderID    uuid.UUID `gorm:"type:uuid" json:"order_id"`
	ItemID     uuid.UUID `gorm:"type:uuid" json:"item_id"`
	ItemName   string    `json:"item_name"`
	Quantity   int       `json:"quantity"`
	Price      float64   `json:"price"`
	TotalPrice float64   `json:"total_price"`
}

type Expense struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	RestaurantID uuid.UUID `gorm:"type:uuid" json:"restaurant_id"`
	Category     string    `json:"category"`
	Amount       float64   `json:"amount"`
	Description  string    `json:"description"`
	ExpenseDate  string    `json:"expense_date"`
	CreatedAt    time.Time `json:"created_at"`
}

// BeforeCreate hooks for UUID generation
func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == uuid.Nil { u.ID = uuid.New() }
	return
}
func (r *Restaurant) BeforeCreate(tx *gorm.DB) (err error) {
	if r.ID == uuid.Nil { r.ID = uuid.New() }
	return
}
func (i *Item) BeforeCreate(tx *gorm.DB) (err error) {
	if i.ID == uuid.Nil { i.ID = uuid.New() }
	return
}
func (o *Order) BeforeCreate(tx *gorm.DB) (err error) {
	if o.ID == uuid.Nil { o.ID = uuid.New() }
	return
}
func (oi *OrderItem) BeforeCreate(tx *gorm.DB) (err error) {
	if oi.ID == uuid.Nil { oi.ID = uuid.New() }
	return
}
func (e *Expense) BeforeCreate(tx *gorm.DB) (err error) {
	if e.ID == uuid.Nil { e.ID = uuid.New() }
	return
}

