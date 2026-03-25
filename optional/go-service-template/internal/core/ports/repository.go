// Package ports defines interfaces (contracts) that adapters must implement.
// Ports are defined in the domain layer and point INWARD.
package ports

import (
	"context"

	"github.com/dxp-platform/dxp/services/template/internal/core/domain"
)

// ExampleRepository defines the persistence contract for Example entities.
// Implement this interface in adapters/secondary/postgres or any other store.
type ExampleRepository interface {
	FindByID(ctx context.Context, tenantID, id string) (*domain.Example, error)
	FindAll(ctx context.Context, tenantID string, limit, offset int) ([]*domain.Example, error)
	Create(ctx context.Context, example *domain.Example) error
	Update(ctx context.Context, example *domain.Example) error
	Delete(ctx context.Context, tenantID, id string) error
}
