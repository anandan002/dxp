FROM golang:1.26-alpine AS builder

WORKDIR /build

# Copy go workspace and shared libs first for caching
COPY go.work go.work
COPY packages/go-kit/ packages/go-kit/
COPY services/_template/ services/_template/

WORKDIR /build/services/_template

RUN go build -ldflags="-s -w" -o /app ./cmd/server

# ---

FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /app /app

USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/app"]
