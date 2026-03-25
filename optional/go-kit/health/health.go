package health

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

// Checker is a function that checks a dependency's health.
type Checker func(ctx context.Context) error

// Status represents the health state of a dependency.
type Status struct {
	Name    string `json:"name"`
	Status  string `json:"status"` // "up" or "down"
	Latency string `json:"latency,omitempty"`
	Error   string `json:"error,omitempty"`
}

// Response is the full health check response.
type Response struct {
	Status  string   `json:"status"` // "healthy" or "unhealthy"
	Service string   `json:"service"`
	Checks  []Status `json:"checks"`
}

// Handler manages health check dependencies and serves the endpoint.
type Handler struct {
	service  string
	checkers map[string]Checker
	mu       sync.RWMutex
}

// NewHandler creates a health handler for the given service.
func NewHandler(service string) *Handler {
	return &Handler{
		service:  service,
		checkers: make(map[string]Checker),
	}
}

// Register adds a named health checker.
func (h *Handler) Register(name string, checker Checker) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.checkers[name] = checker
}

// ServeHTTP implements the http.Handler interface.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	resp := Response{
		Status:  "healthy",
		Service: h.service,
		Checks:  make([]Status, 0, len(h.checkers)),
	}

	for name, checker := range h.checkers {
		start := time.Now()
		err := checker(ctx)
		latency := time.Since(start)

		s := Status{
			Name:    name,
			Status:  "up",
			Latency: latency.String(),
		}
		if err != nil {
			s.Status = "down"
			s.Error = err.Error()
			resp.Status = "unhealthy"
		}
		resp.Checks = append(resp.Checks, s)
	}

	w.Header().Set("Content-Type", "application/json")
	if resp.Status == "unhealthy" {
		w.WriteHeader(http.StatusServiceUnavailable)
	}
	json.NewEncoder(w).Encode(resp)
}
