CREATE TABLE incidents (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    source_service VARCHAR(255) NOT NULL,
    source_node VARCHAR(255) NOT NULL,
    triggering_event_id UUID NOT NULL UNIQUE,
    summary VARCHAR(2000) NOT NULL
);
CREATE INDEX idx_incidents_created_at ON incidents (created_at DESC);
CREATE INDEX idx_incidents_status ON incidents (status);
