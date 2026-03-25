package timescaledb

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/dxp-platform/dxp/services/audit/internal/core/domain"
	"github.com/dxp-platform/dxp/services/audit/internal/core/ports"
)

type AuditRepository struct {
	db *sql.DB
}

var _ ports.AuditRepository = (*AuditRepository)(nil)

func NewAuditRepository(db *sql.DB) *AuditRepository {
	return &AuditRepository{db: db}
}

func (r *AuditRepository) Store(ctx context.Context, entry *domain.AuditEntry) error {
	query := `INSERT INTO audit_entries (id, tenant_id, event_type, actor_id, resource, action, payload, timestamp)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err := r.db.ExecContext(ctx, query,
		entry.ID, entry.TenantID, entry.EventType, entry.ActorID,
		entry.Resource, entry.Action, entry.Payload, entry.Timestamp,
	)
	return err
}

func (r *AuditRepository) Query(ctx context.Context, q domain.AuditQuery) ([]*domain.AuditEntry, int, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if q.TenantID != "" {
		conditions = append(conditions, fmt.Sprintf("tenant_id = $%d", argIdx))
		args = append(args, q.TenantID)
		argIdx++
	}
	if q.EventType != "" {
		conditions = append(conditions, fmt.Sprintf("event_type = $%d", argIdx))
		args = append(args, q.EventType)
		argIdx++
	}
	if q.ActorID != "" {
		conditions = append(conditions, fmt.Sprintf("actor_id = $%d", argIdx))
		args = append(args, q.ActorID)
		argIdx++
	}
	if !q.From.IsZero() {
		conditions = append(conditions, fmt.Sprintf("timestamp >= $%d", argIdx))
		args = append(args, q.From)
		argIdx++
	}
	if !q.To.IsZero() {
		conditions = append(conditions, fmt.Sprintf("timestamp <= $%d", argIdx))
		args = append(args, q.To)
		argIdx++
	}

	where := ""
	if len(conditions) > 0 {
		where = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count query
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM audit_entries %s", where)
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Data query
	dataQuery := fmt.Sprintf(
		"SELECT id, tenant_id, event_type, actor_id, resource, action, payload, timestamp FROM audit_entries %s ORDER BY timestamp DESC LIMIT $%d OFFSET $%d",
		where, argIdx, argIdx+1,
	)
	args = append(args, q.Limit, q.Offset)

	rows, err := r.db.QueryContext(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var entries []*domain.AuditEntry
	for rows.Next() {
		e := &domain.AuditEntry{}
		if err := rows.Scan(&e.ID, &e.TenantID, &e.EventType, &e.ActorID, &e.Resource, &e.Action, &e.Payload, &e.Timestamp); err != nil {
			return nil, 0, err
		}
		entries = append(entries, e)
	}
	return entries, total, rows.Err()
}
