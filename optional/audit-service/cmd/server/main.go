package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/IBM/sarama"
	_ "github.com/lib/pq"

	"github.com/dxp-platform/dxp/packages/go-kit/config"
	"github.com/dxp-platform/dxp/packages/go-kit/health"
	kafkakit "github.com/dxp-platform/dxp/packages/go-kit/kafka"
	"github.com/dxp-platform/dxp/packages/go-kit/logger"
	"github.com/dxp-platform/dxp/packages/go-kit/middleware"
	handler "github.com/dxp-platform/dxp/services/audit/internal/adapters/primary/http"
	"github.com/dxp-platform/dxp/services/audit/internal/adapters/secondary/timescaledb"
	"github.com/dxp-platform/dxp/services/audit/internal/core/services"
)

func main() {
	cfg := config.LoadServiceConfig("audit-service")
	log := logger.New(cfg.Name)

	// --- Database (TimescaleDB) ---
	dbURL := config.Get("TIMESCALEDB_URL", "postgres://dxp:dxp_local_pass@localhost:5433/dxp_timeseries?sslmode=disable")
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Error("failed to connect to TimescaleDB", slog.Any("error", err))
		os.Exit(1)
	}
	defer db.Close()

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// --- Wire adapters ---
	repo := timescaledb.NewAuditRepository(db)
	svc := services.NewAuditService(repo)
	h := handler.NewHandler(svc)

	// --- Kafka consumer ---
	brokers := strings.Split(cfg.KafkaBrokers, ",")
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	consumer, err := kafkakit.NewConsumerGroup(
		brokers,
		"audit-service",
		[]string{"dxp.events.audit", "dxp.events.domain", "dxp.events.platform"},
		func(ctx context.Context, msg *sarama.ConsumerMessage) error {
			var raw services.RawEvent
			if err := json.Unmarshal(msg.Value, &raw); err != nil {
				log.Warn("failed to unmarshal event", slog.Any("error", err))
				return nil // skip malformed messages
			}
			return svc.IngestEvent(ctx, raw)
		},
		log,
	)
	if err != nil {
		log.Warn("failed to create Kafka consumer, audit will only serve queries", slog.Any("error", err))
	} else {
		defer consumer.Close()
		go func() {
			log.Info("Kafka consumer starting", slog.Any("topics", []string{"dxp.events.audit", "dxp.events.domain", "dxp.events.platform"}))
			if err := consumer.Run(ctx); err != nil {
				log.Error("Kafka consumer stopped", slog.Any("error", err))
			}
		}()
	}

	// --- Health checks ---
	healthHandler := health.NewHandler(cfg.Name)
	healthHandler.Register("timescaledb", func(ctx context.Context) error {
		return db.PingContext(ctx)
	})

	// --- HTTP server ---
	mux := http.NewServeMux()
	h.Routes(mux)
	mux.Handle("/health", healthHandler)

	var httpHandler http.Handler = mux
	httpHandler = middleware.RequestContext(httpHandler)
	httpHandler = middleware.RequestLogging(httpHandler)
	httpHandler = middleware.Recovery(httpHandler)

	addr := fmt.Sprintf(":%d", cfg.Port)
	server := &http.Server{
		Addr:         addr,
		Handler:      httpHandler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Info("audit service starting", slog.String("addr", addr))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("server failed", slog.Any("error", err))
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("shutting down audit service...")
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer shutdownCancel()
	server.Shutdown(shutdownCtx)
	log.Info("audit service stopped")
}
