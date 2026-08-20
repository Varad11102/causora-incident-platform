package io.causora.incident.repository;

import io.causora.incident.model.IncidentMemory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IncidentMemoryRepository extends JpaRepository<IncidentMemory, UUID> {
    boolean existsByIncidentId(UUID incidentId);
    Optional<IncidentMemory> findByIncidentId(UUID incidentId);
    List<IncidentMemory> findAllByOrderByResolvedAtDesc();
}
