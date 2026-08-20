package io.causora.incident.service;

import io.causora.incident.model.*;
import io.causora.incident.repository.IncidentMemoryRepository;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;

@Service
public class IncidentMemoryService {
    private final IncidentMemoryRepository repository;

    public IncidentMemoryService(IncidentMemoryRepository repository) { this.repository = repository; }

    public Optional<IncidentMemory> snapshot(Incident incident, List<Evidence> evidence, List<Hypothesis> hypotheses) {
        if (repository.existsByIncidentId(incident.getId()) || hypotheses.isEmpty()) return Optional.empty();
        Hypothesis top = hypotheses.stream().max(Comparator.comparingInt(Hypothesis::getScore)).orElseThrow();
        List<String> symptoms = evidence.stream()
                .filter(item -> item.getEvidenceType() != EvidenceType.DEPLOYMENT_CHANGE
                        && item.getEvidenceType() != EvidenceType.RECOVERY_EVENT)
                .map(Evidence::getValue).distinct().toList();
        List<String> summary = evidence.stream()
                .map(item -> item.getEvidenceType() + ": " + item.getValue()).toList();
        List<String> services = evidence.stream().map(Evidence::getSourceService).distinct().sorted().toList();
        String deploymentId = evidence.stream().map(Evidence::getDeploymentId).filter(Objects::nonNull).findFirst().orElse(null);
        String remediation = top.getHypothesisType() == HypothesisType.BAD_DEPLOYMENT
                ? "Rollback the correlated deployment and verify service recovery"
                : "Restore the failed dependency and verify service recovery";
        IncidentMemory memory = new IncidentMemory(UUID.randomUUID(), incident.getId(), incident.getUpdatedAt(),
                top.getHypothesisType(), top.getTitle(), top.getScore(), symptoms, summary, remediation,
                "Recovery evidence observed; incident resolved", deploymentId, services, Instant.now());
        return Optional.of(repository.save(memory));
    }
}
