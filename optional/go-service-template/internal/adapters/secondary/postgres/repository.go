package postgres

import (
	"context"
	"database/sql"
	"time"

	"github.com/dxp-platform/dxp/services/template/internal/core/domain"
	"github.com/dxp-platform/dxp/services/template/internal/core/ports"
)

// ExampleRepository implements ports.ExampleRepository using PostgreSQL.
type ExampleRepository struct {
	db *sql.DB
}

// Compile-time check that ExampleRepository implements the port.
var _ ports.ExampleRepository = (*ExampleRepository)(nil)

// NewExampleRepository creates a new PostgreSQL-backed repository.
func NewExampleRepository(db *sql.DB) *ExampleRepository {
	return &ExampleRepository{db: db}
}

func (r *ExampleRepository) FindByID(ctx context.Context, tenantID, id string) (*domain.Example, error) {
	query := `SELECT id, tenant_id, name, description, status, created_at, updated_at
			  FROM examples WHERE tenant_id = $1 AND id = $2`
	row := r.db.QueryRowContext(ctx, query, tenantID, id)
	return scanExample(row)
}

func (r *ExampleRepository) FindAll(ctx context.Context, tenantID string, limit, offset int) ([]*domain.Example, error) {
	query := `SELECT id, tenant_id, name, description, status, created_at, updated_at
			  FROM examples WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	rows, err := r.db.QueryContext(ctx, query, tenantID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*domain.Example
	for rows.Next() {
		e := &domain.Example{}
		err := rows.Scan(&e.ID, &e.TenantID, &e.Name, &e.Description, &e.Status, &e.CreatedAt, &e.UpdatedAt)
		if err != nil {
			return nil, err
		}
		results = append(results, e)
	}
	return results, rows.Err()
}

func (r *ExampleRepository) Create(ctx context.Context, example *domain.Example) error {
	query := `INSERT INTO examples (id, tenant_id, name, description, status, created_at, updated_at)
			  VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.db.ExecContext(ctx, query,
		example.ID, example.TenantID, example.Name, example.Description,
		example.Status, example.CreatedAt, example.UpdatedAt,
	)
	return err
}

func (r *ExampleRepository) Update(ctx context.Context, example *domain.Example) error {
	example.UpdatedAt = time.Now().UTC()
	query := `UPDATE examples SET name=$1, description=$2, status=$3, updated_at=$4
			  WHERE tenant_id=$5 AND id=$6`
	_, err := r.db.ExecContext(ctx, query,
		example.Name, example.Description, example.Status, example.UpdatedAt,
		example.TenantID, example.ID,
	)
	return err
}

func (r *ExampleRepository) Delete(ctx context.Context, tenantID, id string) error {
	query := `DELETE FROM examples WHERE tenant_id = $1 AND id = $2`
	_, err := r.db.ExecContext(ctx, query, tenantID, id)
	return err
}

type scanner interface {
	Scan(dest ...interface{}) error
}

func scanExample(s scanner) (*domain.Example, error) {
	e := &domain.Example{}
	err := s.Scan(&e.ID, &e.TenantID, &e.Name, &e.Description, &e.Status, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return e, nil
}
