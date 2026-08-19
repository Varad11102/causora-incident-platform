package io.causora.incident.repository;

import io.causora.incident.model.Hypothesis;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface HypothesisRepository extends JpaRepository<Hypothesis, UUID> {
    List<Hypothesis> findByIncidentIdOrderByScoreDescHypothesisTypeAsc(UUID incidentId);
    void deleteByIncidentId(UUID incidentId);
}
