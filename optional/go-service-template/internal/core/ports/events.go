package ports

import "context"

// Event represents a domain event to be published.
type Event struct {
	Type     string      `json:"type"`     // e.g. "example.created"
	TenantID string      `json:"tenant_id"`
	Payload  interface{} `json:"payload"`
}

// EventPublisher defines the contract for publishing domain events.
type EventPublisher interface {
	Publish(ctx context.Context, topic string, event Event) error
}
