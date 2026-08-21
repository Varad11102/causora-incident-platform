package io.causora.incident.model;

import io.causora.events.Severity;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class IncidentTest {
    @Test
    void resolutionCannotMoveUpdatedAtBeforeCreation() {
        Instant createdAt = Instant.parse("2026-08-21T10:00:01Z");
        Incident incident = new Incident(UUID.randomUUID(), createdAt, createdAt, IncidentStatus.OPEN,
                Severity.ERROR, "failure", "payment", "node-1", UUID.randomUUID(), "failure");

        incident.resolve(createdAt.minusSeconds(1));

        assertThat(incident.getStatus()).isEqualTo(IncidentStatus.RESOLVED);
        assertThat(incident.getUpdatedAt()).isEqualTo(createdAt);
    }
}
