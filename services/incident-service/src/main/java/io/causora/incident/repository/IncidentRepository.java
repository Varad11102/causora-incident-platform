package io.causora.incident.repository;

import io.causora.incident.model.Incident;
import io.causora.incident.model.IncidentStatus;
import io.causora.events.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.time.Instant;
import java.util.UUID;

public interface IncidentRepository extends JpaRepository<Incident, UUID> {
    boolean existsByTriggeringEventId(UUID triggeringEventId);
    Optional<Incident> findByTriggeringEventId(UUID triggeringEventId);
    long countByStatus(IncidentStatus status);
    long countByStatusAndSeverity(IncidentStatus status, Severity severity);
    Optional<Incident> findFirstByOrderByUpdatedAtDesc();
    Optional<Incident> findFirstBySourceServiceAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(
            String sourceService, IncidentStatus status, Instant createdAfter);
}
