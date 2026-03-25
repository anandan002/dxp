package services

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"

	"github.com/dxp-platform/dxp/services/audit/internal/core/domain"
	"github.com/dxp-platform/dxp/services/audit/internal/core/ports"
)

// AuditService implements audit event processing.
type AuditService struct {
	repo ports.AuditRepository
}

func NewAuditService(repo ports.AuditRepository) *AuditService {
	return &AuditService{repo: repo}
}

// IngestEvent is called by the Kafka consumer to store an audit event.
type RawEvent struct {
	Type     string      `json:"type"`
	TenantID string      `json:"tenant_id"`
	ActorID  string      `json:"actor_id,omitempty"`
	Resource string      `json:"resource,omitempty"`
	Action   string      `json:"action,omitempty"`
	Payload  interface{} `json:"payload"`
}

func (s *AuditService) IngestEvent(ctx context.Context, raw RawEvent) error {
	payloadBytes, _ := json.Marshal(raw.Payload)

	entry := &domain.AuditEntry{
		ID:        uuid.New().String(),
		TenantID:  raw.TenantID,
		EventType: raw.Type,
		ActorID:   raw.ActorID,
		Resource:  raw.Resource,
		Action:    raw.Action,
		Payload:   string(payloadBytes),
		Timestamp: time.Now().UTC(),
	}

	return s.repo.Store(ctx, entry)
}

func (s *AuditService) Query(ctx context.Context, query domain.AuditQuery) ([]*domain.AuditEntry, int, error) {
	if query.Limit <= 0 {
		query.Limit = 50
	}
	if query.Limit > 500 {
		query.Limit = 500
	}
	return s.repo.Query(ctx, query)
}
