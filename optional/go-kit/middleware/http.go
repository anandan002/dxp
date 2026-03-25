package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/dxp-platform/dxp/packages/go-kit/logger"
)

type ctxKey string

const (
	TenantIDKey  ctxKey = "tenant_id"
	UserIDKey    ctxKey = "user_id"
	RequestIDKey ctxKey = "request_id"
)

// TenantFromContext extracts the tenant ID from context.
func TenantFromContext(ctx context.Context) string {
	if v, ok := ctx.Value(TenantIDKey).(string); ok {
		return v
	}
	return ""
}

// RequestLogging logs each HTTP request with structured fields.
func RequestLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(wrapped, r)

		l := logger.FromContext(r.Context())
		l.LogAttrs(r.Context(), slog.LevelInfo, "http request",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status", wrapped.statusCode),
			slog.Duration("latency", time.Since(start)),
			slog.String("remote_addr", r.RemoteAddr),
		)
	})
}

// RequestContext extracts tenant_id, user_id, request_id from headers
// (injected by Kong) and places them in the request context.
func RequestContext(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		if tid := r.Header.Get("X-Tenant-ID"); tid != "" {
			ctx = context.WithValue(ctx, TenantIDKey, tid)
		}
		if uid := r.Header.Get("X-User-ID"); uid != "" {
			ctx = context.WithValue(ctx, UserIDKey, uid)
		}
		if rid := r.Header.Get("X-Request-ID"); rid != "" {
			ctx = context.WithValue(ctx, RequestIDKey, rid)
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Recovery catches panics and returns 500 instead of crashing.
func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				l := logger.FromContext(r.Context())
				l.Error("panic recovered", slog.Any("error", err))
				http.Error(w, `{"code":"INTERNAL","message":"internal server error"}`, http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
