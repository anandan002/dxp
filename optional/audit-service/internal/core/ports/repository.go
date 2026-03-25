package ports

import (
	"context"

	"github.com/dxp-platform/dxp/services/audit/internal/core/domain"
)

// AuditRepository defines the persistence contract for audit entries.
type AuditRepository interface {
	Store(ctx context.Context, entry *domain.AuditEntry) error
	Query(ctx context.Context, query domain.AuditQuery) ([]*domain.AuditEntry, int, error)
}
