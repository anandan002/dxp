package kafka

import (
	"context"
	"log/slog"

	"github.com/IBM/sarama"
)

// MessageHandler processes a single Kafka message.
type MessageHandler func(ctx context.Context, msg *sarama.ConsumerMessage) error

// ConsumerGroup wraps Sarama's consumer group for topic consumption.
type ConsumerGroup struct {
	group   sarama.ConsumerGroup
	handler MessageHandler
	logger  *slog.Logger
	topics  []string
}

// NewConsumerGroup creates a consumer group for the given topics.
func NewConsumerGroup(brokers []string, groupID string, topics []string, handler MessageHandler, logger *slog.Logger) (*ConsumerGroup, error) {
	config := sarama.NewConfig()
	config.Consumer.Group.Rebalance.GroupStrategies = []sarama.BalanceStrategy{sarama.NewBalanceStrategyRoundRobin()}
	config.Consumer.Offsets.Initial = sarama.OffsetOldest

	group, err := sarama.NewConsumerGroup(brokers, groupID, config)
	if err != nil {
		return nil, err
	}

	return &ConsumerGroup{
		group:   group,
		handler: handler,
		logger:  logger,
		topics:  topics,
	}, nil
}

// Run starts consuming messages. Blocks until context is cancelled.
func (cg *ConsumerGroup) Run(ctx context.Context) error {
	consumer := &groupHandler{handler: cg.handler, logger: cg.logger}

	for {
		if err := cg.group.Consume(ctx, cg.topics, consumer); err != nil {
			cg.logger.Error("consumer group error", slog.Any("error", err))
			return err
		}
		if ctx.Err() != nil {
			return ctx.Err()
		}
	}
}

// Close shuts down the consumer group.
func (cg *ConsumerGroup) Close() error {
	return cg.group.Close()
}

// groupHandler implements sarama.ConsumerGroupHandler.
type groupHandler struct {
	handler MessageHandler
	logger  *slog.Logger
}

func (h *groupHandler) Setup(_ sarama.ConsumerGroupSession) error   { return nil }
func (h *groupHandler) Cleanup(_ sarama.ConsumerGroupSession) error { return nil }

func (h *groupHandler) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for msg := range claim.Messages() {
		if err := h.handler(session.Context(), msg); err != nil {
			h.logger.Error("failed to process message",
				slog.String("topic", msg.Topic),
				slog.Int("partition", int(msg.Partition)),
				slog.Int64("offset", msg.Offset),
				slog.Any("error", err),
			)
			continue
		}
		session.MarkMessage(msg, "")
	}
	return nil
}
