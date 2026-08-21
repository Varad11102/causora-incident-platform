CREATE TABLE remediation_proposals (
    id UUID PRIMARY KEY,
    incident_id UUID NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    playbook_key VARCHAR(64) NOT NULL,
    target VARCHAR(255) NOT NULL,
    reason VARCHAR(2000) NOT NULL,
    parameters_json TEXT NOT NULL,
    risk VARCHAR(16) NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    decided_by VARCHAR(255),
    decided_at TIMESTAMPTZ
);

CREATE INDEX idx_remediation_proposals_incident ON remediation_proposals (incident_id, created_at DESC);

CREATE TABLE remediation_audit_entries (
    id UUID PRIMARY KEY,
    proposal_id UUID NOT NULL REFERENCES remediation_proposals(id),
    action VARCHAR(32) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    detail VARCHAR(2000) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_remediation_audit_proposal ON remediation_audit_entries (proposal_id, occurred_at ASC);
