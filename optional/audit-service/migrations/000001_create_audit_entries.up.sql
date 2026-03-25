CREATE TABLE IF NOT EXISTS audit_entries (
    id          VARCHAR(36) NOT NULL,
    tenant_id   VARCHAR(36) NOT NULL,
    event_type  VARCHAR(255) NOT NULL,
    actor_id    VARCHAR(255),
    resource    VARCHAR(255),
    action      VARCHAR(50),
    payload     JSONB,
    timestamp   TIMESTAMPTZ NOT NULL
);

-- Convert to TimescaleDB hypertable for time-series optimization
SELECT create_hypertable('audit_entries', 'timestamp', if_not_exists => TRUE);

-- Indexes for common query patterns
CREATE INDEX idx_audit_tenant_time ON audit_entries(tenant_id, timestamp DESC);
CREATE INDEX idx_audit_event_type ON audit_entries(event_type, timestamp DESC);
CREATE INDEX idx_audit_actor ON audit_entries(actor_id, timestamp DESC);
