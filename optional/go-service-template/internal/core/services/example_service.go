// Package services contains application use cases / service layer.
// Orchestrates domain logic using ports — never uses concrete adapters.
package services

import (
	"context"
	"time"

	"github.com/dxp-platform/dxp/services/template/internal/core/domain"
	"github.com/dxp-platform/dxp/services/template/internal/core/ports"
	"github.com/google/uuid"
)

// ExampleService implements the business use cases for Example entities.
type ExampleService struct {
	repo   ports.ExampleRepository
	events ports.EventPublisher
}

// NewExampleService creates a new ExampleService with injected ports.
func NewExampleService(repo ports.ExampleRepository, events ports.EventPublisher) *ExampleService {
	return &ExampleService{repo: repo, events: events}
}

func (s *ExampleService) GetByID(ctx context.Context, tenantID, id string) (*domain.Example, error) {
	return s.repo.FindByID(ctx, tenantID, id)
}

func (s *ExampleService) List(ctx context.Context, tenantID string, limit, offset int) ([]*domain.Example, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return s.repo.FindAll(ctx, tenantID, limit, offset)
}

func (s *ExampleService) Create(ctx context.Context, tenantID, name, description string) (*domain.Example, error) {
	now := time.Now().UTC()
	example := &domain.Example{
		Entity: domain.Entity{
			ID:        uuid.New().String(),
			TenantID:  tenantID,
			CreatedAt: now,
			UpdatedAt: now,
		},
		Name:        name,
		Description: description,
		Status:      "active",
	}

	if err := s.repo.Create(ctx, example); err != nil {
		return nil, err
	}

	_ = s.events.Publish(ctx, "dxp.events.domain", ports.Event{
		Type:     "example.created",
		TenantID: tenantID,
		Payload:  example,
	})

	return example, nil
}

func (s *ExampleService) Delete(ctx context.Context, tenantID, id string) error {
	if err := s.repo.Delete(ctx, tenantID, id); err != nil {
		return err
	}

	_ = s.events.Publish(ctx, "dxp.events.domain", ports.Event{
		Type:     "example.deleted",
		TenantID: tenantID,
		Payload:  map[string]string{"id": id},
	})

	return nil
}
