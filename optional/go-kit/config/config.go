package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Get returns an environment variable or a default value.
func Get(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// MustGet returns an environment variable or panics.
func MustGet(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic(fmt.Sprintf("required environment variable %s is not set", key))
	}
	return v
}

// GetInt returns an env var as int or a default value.
func GetInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}

// GetDuration returns an env var as time.Duration or a default.
func GetDuration(key string, fallback time.Duration) time.Duration {
	if v := os.Getenv(key); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			return d
		}
	}
	return fallback
}

// GetBool returns an env var as bool or a default value.
func GetBool(key string, fallback bool) bool {
	if v := os.Getenv(key); v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			return b
		}
	}
	return fallback
}

// ServiceConfig holds common config for all microservices.
type ServiceConfig struct {
	Name     string
	Port     int
	LogLevel string

	// Database
	DatabaseURL string

	// Kafka
	KafkaBrokers string

	// Telemetry
	OTelEndpoint string

	// Redis
	RedisAddr     string
	RedisPassword string
}

// LoadServiceConfig loads common service configuration from environment.
func LoadServiceConfig(name string) ServiceConfig {
	return ServiceConfig{
		Name:         name,
		Port:         GetInt("PORT", 8080),
		LogLevel:     Get("LOG_LEVEL", "info"),
		DatabaseURL:  Get("DATABASE_URL", ""),
		KafkaBrokers: Get("KAFKA_BROKERS", "localhost:29092"),
		OTelEndpoint: Get("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:4317"),
		RedisAddr:    Get("REDIS_ADDR", "localhost:6379"),
		RedisPassword: Get("REDIS_PASSWORD", ""),
	}
}
