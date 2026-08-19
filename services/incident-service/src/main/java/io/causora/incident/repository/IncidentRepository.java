package io.causora.incident.repository;

import io.causora.incident.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.time.Instant;
import java.util.UUID;

public interface IncidentRepository extends JpaRepository<Incident, UUID> {
    boolean existsByTriggeringEventId(UUID triggeringEventId);
    Optional<Incident> findByTriggeringEventId(UUID triggeringEventId);
    Optional<Incident> findFirstBySourceServiceAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(
            String sourceService, io.causora.incident.model.IncidentStatus status, Instant createdAfter);
}
