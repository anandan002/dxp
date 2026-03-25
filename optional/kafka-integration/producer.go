package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/IBM/sarama"
)

// Producer wraps Sarama's sync producer for simple event publishing.
type Producer struct {
	producer sarama.SyncProducer
	logger   *slog.Logger
}

// NewProducer creates a Kafka producer connected to the given brokers.
func NewProducer(brokers []string, logger *slog.Logger) (*Producer, error) {
	config := sarama.NewConfig()
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Retry.Max = 3
	config.Producer.Return.Successes = true

	producer, err := sarama.NewSyncProducer(brokers, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Kafka producer: %w", err)
	}

	return &Producer{producer: producer, logger: logger}, nil
}

// Publish sends a JSON-encoded message to the specified topic.
func (p *Producer) Publish(ctx context.Context, topic string, key string, payload interface{}) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	msg := &sarama.ProducerMessage{
		Topic: topic,
		Key:   sarama.StringEncoder(key),
		Value: sarama.ByteEncoder(data),
	}

	partition, offset, err := p.producer.SendMessage(msg)
	if err != nil {
		return fmt.Errorf("failed to send message to %s: %w", topic, err)
	}

	p.logger.Debug("message published",
		slog.String("topic", topic),
		slog.String("key", key),
		slog.Int("partition", int(partition)),
		slog.Int64("offset", offset),
	)
	return nil
}

// Close shuts down the producer.
func (p *Producer) Close() error {
	return p.producer.Close()
}
