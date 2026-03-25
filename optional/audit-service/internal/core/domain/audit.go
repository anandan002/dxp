package domain

import "time"

// AuditEntry represents a single audit event in the system.
type AuditEntry struct {
	ID        string    `json:"id"`
	TenantID  string    `json:"tenant_id"`
	EventType string    `json:"event_type"`
	ActorID   string    `json:"actor_id"`
	Resource  string    `json:"resource"`
	Action    string    `json:"action"`
	Payload   string    `json:"payload"` // JSON string
	Timestamp time.Time `json:"timestamp"`
}

// AuditQuery defines filters for querying audit entries.
type AuditQuery struct {
	TenantID  string
	EventType string
	ActorID   string
	Resource  string
	From      time.Time
	To        time.Time
	Limit     int
	Offset    int
}
