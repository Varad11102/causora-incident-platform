CREATE TABLE incident_memories (
    id UUID PRIMARY KEY,
    incident_id UUID NOT NULL UNIQUE REFERENCES incidents(id),
    resolved_at TIMESTAMP WITH TIME ZONE NOT NULL,
    cause_type VARCHAR(64) NOT NULL,
    cause_title VARCHAR(255) NOT NULL,
    cause_score INTEGER NOT NULL,
    symptoms_json TEXT NOT NULL,
    evidence_summary_json TEXT NOT NULL,
    remediation VARCHAR(2000) NOT NULL,
    result VARCHAR(2000) NOT NULL,
    deployment_id VARCHAR(255),
    services_json TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_incident_memories_resolved ON incident_memories (resolved_at DESC);
CREATE INDEX idx_incident_memories_cause ON incident_memories (cause_type);
