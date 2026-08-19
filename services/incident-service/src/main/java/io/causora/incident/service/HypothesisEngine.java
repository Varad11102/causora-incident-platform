package io.causora.incident.service;

import io.causora.incident.model.*;
import io.causora.incident.repository.EvidenceRepository;
import io.causora.incident.repository.HypothesisRepository;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;
import java.util.function.Predicate;

@Service
public class HypothesisEngine {
    private final EvidenceRepository evidenceRepository;
    private final HypothesisRepository hypothesisRepository;

    public HypothesisEngine(EvidenceRepository evidenceRepository, HypothesisRepository hypothesisRepository) {
        this.evidenceRepository = evidenceRepository;
        this.hypothesisRepository = hypothesisRepository;
    }

    public List<Hypothesis> refresh(UUID incidentId) {
        List<Evidence> evidence = evidenceRepository.findByIncidentIdOrderByObservedAtAsc(incidentId);
        List<Hypothesis> hypotheses = new ArrayList<>();
        addDatabaseHypothesis(incidentId, evidence, hypotheses);
        addDeploymentHypothesis(incidentId, evidence, hypotheses);
        addKafkaHypothesis(incidentId, evidence, hypotheses);
        addResourceHypothesis(incidentId, evidence, hypotheses);
        hypothesisRepository.deleteByIncidentId(incidentId);
        hypothesisRepository.flush();
        return hypothesisRepository.saveAll(hypotheses);
    }

    private void addDatabaseHypothesis(UUID incidentId, List<Evidence> all, List<Hypothesis> result) {
        List<Evidence> direct = matching(all, e -> e.getEvidenceType() == EvidenceType.DATABASE_FAILURE);
        if (direct.isEmpty()) return;
        List<Evidence> secondary = matching(all, e -> e.getEvidenceType() == EvidenceType.ERROR_EVENT
                || e.getEvidenceType() == EvidenceType.LATENCY_SPIKE);
        List<Evidence> recovery = matching(all, e -> e.getEvidenceType() == EvidenceType.RECOVERY_EVENT);
        int score = 40 + (hasEvidenceAfter(secondary, direct.get(0)) ? 20 : 0) + (secondary.isEmpty() ? 0 : 10)
                - (recovery.isEmpty() ? 0 : 20);
        result.add(hypothesis(incidentId, HypothesisType.DATABASE_CONNECTIVITY_FAILURE,
                "Database connectivity failure", score, concat(direct, secondary), recovery,
                "40 direct database-failure evidence +20 when downstream symptoms follow +10 secondary support -20 recovery evidence."));
    }

    private void addDeploymentHypothesis(UUID incidentId, List<Evidence> all, List<Hypothesis> result) {
        List<Evidence> deployments = matching(all, e -> e.getEvidenceType() == EvidenceType.DEPLOYMENT_CHANGE);
        List<Evidence> failures = matching(all, e -> e.getEvidenceType() == EvidenceType.DATABASE_FAILURE
                || e.getEvidenceType() == EvidenceType.ERROR_EVENT || e.getEvidenceType() == EvidenceType.LATENCY_SPIKE);
        if (deployments.isEmpty() || failures.isEmpty()) return;
        boolean follows = hasEvidenceAfter(failures, deployments.get(0));
        boolean sharedDeployment = deployments.get(0).getDeploymentId() != null
                && failures.stream().anyMatch(item -> deployments.get(0).getDeploymentId().equals(item.getDeploymentId()));
        List<Evidence> recovery = matching(all, e -> e.getEvidenceType() == EvidenceType.RECOVERY_EVENT);
        int score = 40 + (follows ? 20 : 0) + (sharedDeployment ? 15 : 0)
                + (failures.size() > 1 ? 10 : 0) - (recovery.isEmpty() ? 0 : 20);
        result.add(hypothesis(incidentId, HypothesisType.BAD_DEPLOYMENT, "Bad deployment", score,
                concat(deployments, failures), recovery,
                "40 deployment-change evidence +20 failures after deployment +15 shared deployment correlation +10 multiple failure signals -20 recovery evidence."));
    }

    private void addKafkaHypothesis(UUID incidentId, List<Evidence> all, List<Hypothesis> result) {
        List<Evidence> direct = matching(all, e -> e.getEvidenceType() == EvidenceType.KAFKA_LAG);
        if (direct.isEmpty()) return;
        List<Evidence> errors = matching(all, e -> e.getEvidenceType() == EvidenceType.ERROR_EVENT);
        List<Evidence> recovery = matching(all, e -> e.getEvidenceType() == EvidenceType.RECOVERY_EVENT);
        int score = 40 + (errors.isEmpty() ? 0 : 10) - (recovery.isEmpty() ? 0 : 20);
        result.add(hypothesis(incidentId, HypothesisType.KAFKA_CONSUMER_DEGRADATION,
                "Kafka consumer degradation", score, concat(direct, errors), recovery,
                "40 direct Kafka-lag evidence +10 consumer/service errors -20 recovery evidence."));
    }

    private void addResourceHypothesis(UUID incidentId, List<Evidence> all, List<Hypothesis> result) {
        List<Evidence> direct = matching(all, e -> e.getEvidenceType() == EvidenceType.RESOURCE_PRESSURE);
        if (direct.isEmpty()) return;
        List<Evidence> symptoms = matching(all, e -> e.getEvidenceType() == EvidenceType.LATENCY_SPIKE
                || e.getEvidenceType() == EvidenceType.ERROR_EVENT);
        List<Evidence> recovery = matching(all, e -> e.getEvidenceType() == EvidenceType.RECOVERY_EVENT);
        int score = 40 + (hasEvidenceAfter(symptoms, direct.get(0)) ? 20 : 0) + (symptoms.isEmpty() ? 0 : 10)
                - (recovery.isEmpty() ? 0 : 20);
        result.add(hypothesis(incidentId, HypothesisType.RESOURCE_EXHAUSTION,
                "Resource exhaustion", score, concat(direct, symptoms), recovery,
                "40 direct resource-pressure evidence +20 later symptoms +10 secondary support -20 recovery evidence."));
    }

    private Hypothesis hypothesis(UUID incidentId, HypothesisType type, String title, int score,
                                  List<Evidence> supporting, List<Evidence> counter, String explanation) {
        return new Hypothesis(UUID.randomUUID(), incidentId, type, title, score,
                ids(supporting), ids(counter), explanation + " Normalized score: " + Math.max(0, Math.min(100, score)) + ".",
                Instant.now());
    }

    private List<Evidence> matching(List<Evidence> all, Predicate<Evidence> predicate) {
        return all.stream().filter(predicate).toList();
    }

    private boolean hasEvidenceAfter(List<Evidence> candidates, Evidence anchor) {
        return candidates.stream().anyMatch(item -> !item.getObservedAt().isBefore(anchor.getObservedAt()));
    }

    private List<Evidence> concat(List<Evidence> first, List<Evidence> second) {
        LinkedHashMap<UUID, Evidence> unique = new LinkedHashMap<>();
        first.forEach(item -> unique.put(item.getId(), item));
        second.forEach(item -> unique.put(item.getId(), item));
        return List.copyOf(unique.values());
    }

    private Set<UUID> ids(List<Evidence> evidence) {
        LinkedHashSet<UUID> ids = new LinkedHashSet<>();
        evidence.forEach(item -> ids.add(item.getId()));
        return ids;
    }
}
