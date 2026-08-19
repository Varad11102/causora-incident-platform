CREATE TABLE evidence (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL UNIQUE,
    incident_id UUID REFERENCES incidents(id),
    observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    source_type VARCHAR(64) NOT NULL,
    source_service VARCHAR(255) NOT NULL,
    source_node VARCHAR(255) NOT NULL,
    evidence_type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    evidence_key VARCHAR(255) NOT NULL,
    evidence_value VARCHAR(2000) NOT NULL,
    trace_id VARCHAR(255),
    deployment_id VARCHAR(255),
    metadata_json TEXT NOT NULL,
    confidence INTEGER
);

CREATE INDEX idx_evidence_incident_observed ON evidence (incident_id, observed_at);
CREATE INDEX idx_evidence_correlation ON evidence (trace_id, deployment_id, source_service);

CREATE TABLE incident_timeline_entries (
    id UUID PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id),
    evidence_id UUID NOT NULL UNIQUE REFERENCES evidence(id),
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    entry_type VARCHAR(64) NOT NULL,
    source_service VARCHAR(255) NOT NULL,
    source_node VARCHAR(255) NOT NULL,
    summary VARCHAR(2000) NOT NULL,
    trace_id VARCHAR(255),
    deployment_id VARCHAR(255)
);

CREATE INDEX idx_timeline_incident_occurred ON incident_timeline_entries (incident_id, occurred_at);

CREATE TABLE hypotheses (
    id UUID PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id),
    hypothesis_type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    score INTEGER NOT NULL,
    explanation VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_hypothesis_incident_type UNIQUE (incident_id, hypothesis_type),
    CONSTRAINT chk_hypothesis_score CHECK (score BETWEEN 0 AND 100)
);

CREATE TABLE hypothesis_supporting_evidence (
    hypothesis_id UUID NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
    evidence_id UUID NOT NULL REFERENCES evidence(id),
    PRIMARY KEY (hypothesis_id, evidence_id)
);

CREATE TABLE hypothesis_counter_evidence (
    hypothesis_id UUID NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
    evidence_id UUID NOT NULL REFERENCES evidence(id),
    PRIMARY KEY (hypothesis_id, evidence_id)
);
