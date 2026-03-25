// Package noop provides no-op implementations for development/testing.
package noop

import (
	"context"
	"log/slog"

	"github.com/dxp-platform/dxp/services/template/internal/core/ports"
)

// EventPublisher is a no-op event publisher that logs events.
type EventPublisher struct {
	logger *slog.Logger
}

var _ ports.EventPublisher = (*EventPublisher)(nil)

func NewEventPublisher(logger *slog.Logger) *EventPublisher {
	return &EventPublisher{logger: logger}
}

func (p *EventPublisher) Publish(ctx context.Context, topic string, event ports.Event) error {
	p.logger.Info("event published (noop)",
		slog.String("topic", topic),
		slog.String("type", event.Type),
		slog.String("tenant", event.TenantID),
	)
	return nil
}
