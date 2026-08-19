package io.causora.incident.repository;

import io.causora.incident.model.Evidence;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EvidenceRepository extends JpaRepository<Evidence, UUID> {
    boolean existsByEventId(UUID eventId);
    List<Evidence> findByIncidentIdOrderByObservedAtAsc(UUID incidentId);
    List<Evidence> findByIncidentIdIsNullAndSourceServiceAndObservedAtAfterOrderByObservedAtAsc(
            String sourceService, Instant observedAfter);
    Optional<Evidence> findFirstByTraceIdAndIncidentIdIsNotNullOrderByObservedAtDesc(String traceId);
    Optional<Evidence> findFirstByDeploymentIdAndIncidentIdIsNotNullOrderByObservedAtDesc(String deploymentId);
}
