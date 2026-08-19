package io.causora.incident.repository;

import io.causora.events.Severity;
import io.causora.incident.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import java.time.Instant;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {"spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop"})
class IncidentRepositoryTest {
    @Autowired private IncidentRepository repository;
    @Test void findsIncidentByUniqueTriggeringEventId() {
        UUID eventId = UUID.randomUUID();
        Instant now = Instant.now();
        Incident incident = new Incident(UUID.randomUUID(), now, now, IncidentStatus.OPEN, Severity.CRITICAL,
                "Service down: payment", "payment", "node-1", eventId, "unavailable");
        repository.saveAndFlush(incident);
        assertThat(repository.existsByTriggeringEventId(eventId)).isTrue();
        Incident reloaded = repository.findByTriggeringEventId(eventId).orElseThrow();
        assertThat(reloaded.getId()).isEqualTo(incident.getId());
        assertThat(reloaded.getTriggeringEventId()).isEqualTo(eventId);
    }
}
