FROM golang:1.26-alpine AS builder

WORKDIR /build

COPY go.work go.work
COPY packages/go-kit/ packages/go-kit/
COPY services/audit/ services/audit/

WORKDIR /build/services/audit

RUN go build -ldflags="-s -w" -o /app ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /app /app

USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app"]
