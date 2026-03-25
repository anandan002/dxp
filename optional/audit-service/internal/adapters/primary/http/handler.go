package http

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/dxp-platform/dxp/packages/go-kit/middleware"
	"github.com/dxp-platform/dxp/services/audit/internal/core/domain"
	"github.com/dxp-platform/dxp/services/audit/internal/core/services"
)

type Handler struct {
	service *services.AuditService
}

func NewHandler(service *services.AuditService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /audit", h.Query)
}

func (h *Handler) Query(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantFromContext(r.Context())
	q := r.URL.Query()

	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))

	query := domain.AuditQuery{
		TenantID:  tenantID,
		EventType: q.Get("event_type"),
		ActorID:   q.Get("actor_id"),
		Resource:  q.Get("resource"),
		Limit:     limit,
		Offset:    offset,
	}

	if from := q.Get("from"); from != "" {
		if t, err := time.Parse(time.RFC3339, from); err == nil {
			query.From = t
		}
	}
	if to := q.Get("to"); to != "" {
		if t, err := time.Parse(time.RFC3339, to); err == nil {
			query.To = t
		}
	}

	entries, total, err := h.service.Query(r.Context(), query)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data":  entries,
		"total": total,
		"limit": query.Limit,
		"offset": query.Offset,
	})
}
