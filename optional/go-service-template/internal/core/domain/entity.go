// Package domain contains pure business entities and value objects.
// This package has ZERO external imports — no frameworks, no DB drivers.
package domain

import "time"

// Entity is the base for all domain entities.
type Entity struct {
	ID        string    `json:"id"`
	TenantID  string    `json:"tenant_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Example is a placeholder domain entity for the template.
// Replace with your actual domain entity.
type Example struct {
	Entity
	Name        string `json:"name"`
	Description string `json:"description"`
	Status      string `json:"status"`
}
