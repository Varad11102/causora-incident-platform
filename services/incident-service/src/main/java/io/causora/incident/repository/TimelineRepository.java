package io.causora.incident.repository;

import io.causora.incident.model.TimelineEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TimelineRepository extends JpaRepository<TimelineEntry, UUID> {
    boolean existsByEvidenceId(UUID evidenceId);
    List<TimelineEntry> findByIncidentIdOrderByOccurredAtAsc(UUID incidentId);
}
