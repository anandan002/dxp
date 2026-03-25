package main

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/lib/pq"

	"github.com/dxp-platform/dxp/packages/go-kit/config"
	"github.com/dxp-platform/dxp/packages/go-kit/health"
	"github.com/dxp-platform/dxp/packages/go-kit/logger"
	"github.com/dxp-platform/dxp/packages/go-kit/middleware"
	"github.com/dxp-platform/dxp/packages/go-kit/tracing"
	handler "github.com/dxp-platform/dxp/services/template/internal/adapters/primary/http"
	"github.com/dxp-platform/dxp/services/template/internal/adapters/secondary/noop"
	"github.com/dxp-platform/dxp/services/template/internal/adapters/secondary/postgres"
	"github.com/dxp-platform/dxp/services/template/internal/core/services"
)

func main() {
	cfg := config.LoadServiceConfig("template-service")
	log := logger.New(cfg.Name)

	// --- OpenTelemetry ---
	shutdownTracer, err := tracing.Init(context.Background(), cfg.Name, cfg.OTelEndpoint)
	if err != nil {
		log.Warn("failed to initialize tracing, continuing without it", slog.Any("error", err))
	} else {
		defer shutdownTracer(context.Background())
	}

	// --- Database ---
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Error("failed to connect to database", slog.Any("error", err))
		os.Exit(1)
	}
	defer db.Close()

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// --- Wire adapters to ports ---
	repo := postgres.NewExampleRepository(db)
	events := noop.NewEventPublisher(log)
	svc := services.NewExampleService(repo, events)
	h := handler.NewHandler(svc)

	// --- Health checks ---
	healthHandler := health.NewHandler(cfg.Name)
	healthHandler.Register("postgres", func(ctx context.Context) error {
		return db.PingContext(ctx)
	})

	// --- HTTP server ---
	mux := http.NewServeMux()
	h.Routes(mux)
	mux.Handle("/health", healthHandler)

	// Apply middleware chain
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

	// --- Graceful shutdown ---
	go func() {
		log.Info("server starting", slog.String("addr", addr))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("server failed", slog.Any("error", err))
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("shutting down gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Error("forced shutdown", slog.Any("error", err))
	}
	log.Info("server stopped")
}
