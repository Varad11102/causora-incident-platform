package io.causora.incident.service;

import io.causora.incident.model.*;
import io.causora.incident.repository.EvidenceRepository;
import io.causora.incident.repository.HypothesisRepository;
import io.causora.incident.repository.IncidentMemoryRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class IncidentMemorySimilarityService {
    private final IncidentMemoryRepository memoryRepository;
    private final EvidenceRepository evidenceRepository;
    private final HypothesisRepository hypothesisRepository;

    public IncidentMemorySimilarityService(IncidentMemoryRepository memoryRepository,
                                           EvidenceRepository evidenceRepository,
                                           HypothesisRepository hypothesisRepository) {
        this.memoryRepository = memoryRepository;
        this.evidenceRepository = evidenceRepository;
        this.hypothesisRepository = hypothesisRepository;
    }

    public List<SimilarIncidentMemory> findSimilar(UUID incidentId, int requestedLimit) {
        int limit = Math.clamp(requestedLimit, 1, 20);
        List<Evidence> evidence = evidenceRepository.findByIncidentIdOrderByObservedAtAsc(incidentId);
        Optional<HypothesisType> topCause = hypothesisRepository
                .findByIncidentIdOrderByScoreDescHypothesisTypeAsc(incidentId).stream()
                .findFirst().map(Hypothesis::getHypothesisType);
        Set<String> services = new HashSet<>();
        Set<EvidenceType> evidenceTypes = EnumSet.noneOf(EvidenceType.class);
        Set<String> deploymentIds = new HashSet<>();
        for (Evidence item : evidence) {
            services.add(item.getSourceService());
            evidenceTypes.add(item.getEvidenceType());
            if (item.getDeploymentId() != null) deploymentIds.add(item.getDeploymentId());
        }

        return memoryRepository.findAllByOrderByResolvedAtDesc().stream()
                .filter(memory -> !memory.getIncidentId().equals(incidentId))
                .map(memory -> score(memory, topCause, services, evidenceTypes, deploymentIds))
                .filter(match -> match.score() > 0)
                .sorted(Comparator.comparingInt(SimilarIncidentMemory::score).reversed()
                        .thenComparing(match -> match.memory().getResolvedAt(), Comparator.reverseOrder()))
                .limit(limit)
                .toList();
    }

    private SimilarIncidentMemory score(IncidentMemory memory, Optional<HypothesisType> topCause,
                                        Set<String> services, Set<EvidenceType> evidenceTypes,
                                        Set<String> deploymentIds) {
        List<String> reasons = new ArrayList<>();
        int causeScore = topCause.filter(type -> type == memory.getCauseType()).map(type -> 45).orElse(0);
        if (causeScore > 0) reasons.add("same highest-ranked cause: " + memory.getCauseType());

        Set<String> sharedServices = new TreeSet<>(services);
        sharedServices.retainAll(memory.getServices());
        int serviceScore = sharedServices.isEmpty() ? 0 : 30;
        if (serviceScore > 0) reasons.add("shared services: " + String.join(", ", sharedServices));

        Set<EvidenceType> historicalTypes = evidenceTypes(memory);
        Set<EvidenceType> sharedTypes = EnumSet.noneOf(EvidenceType.class);
        sharedTypes.addAll(evidenceTypes);
        sharedTypes.retainAll(historicalTypes);
        int evidenceTypeScore = sharedTypes.isEmpty() ? 0 : 20;
        if (evidenceTypeScore > 0) reasons.add("shared evidence types: " + sharedTypes);

        int deploymentScore = memory.getDeploymentId() != null && deploymentIds.contains(memory.getDeploymentId()) ? 5 : 0;
        if (deploymentScore > 0) reasons.add("same deployment: " + memory.getDeploymentId());

        return new SimilarIncidentMemory(memory, causeScore + serviceScore + evidenceTypeScore + deploymentScore,
                causeScore, serviceScore, evidenceTypeScore, deploymentScore, List.copyOf(reasons));
    }

    private Set<EvidenceType> evidenceTypes(IncidentMemory memory) {
        Set<EvidenceType> result = EnumSet.noneOf(EvidenceType.class);
        for (String summary : memory.getEvidenceSummary()) {
            int separator = summary.indexOf(':');
            if (separator < 1) continue;
            try {
                result.add(EvidenceType.valueOf(summary.substring(0, separator)));
            } catch (IllegalArgumentException ignored) {
                // Older memory formats remain readable but do not receive an evidence-type match.
            }
        }
        return result;
    }
}
