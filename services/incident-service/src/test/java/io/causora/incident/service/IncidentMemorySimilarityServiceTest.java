package io.causora.incident.service;

import io.causora.events.Severity;
import io.causora.incident.model.*;
import io.causora.incident.repository.EvidenceRepository;
import io.causora.incident.repository.HypothesisRepository;
import io.causora.incident.repository.IncidentMemoryRepository;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class IncidentMemorySimilarityServiceTest {
    private final IncidentMemoryRepository memoryRepository = mock(IncidentMemoryRepository.class);
    private final EvidenceRepository evidenceRepository = mock(EvidenceRepository.class);
    private final HypothesisRepository hypothesisRepository = mock(HypothesisRepository.class);
    private final IncidentMemorySimilarityService service = new IncidentMemorySimilarityService(
            memoryRepository, evidenceRepository, hypothesisRepository);

    @Test
    void ranksMatchesWithTransparentDeterministicComponents() {
        UUID incidentId = UUID.randomUUID();
        when(evidenceRepository.findByIncidentIdOrderByObservedAtAsc(incidentId)).thenReturn(List.of(
                evidence(incidentId, EvidenceType.DATABASE_FAILURE, "payment", "deploy-2"),
                evidence(incidentId, EvidenceType.ERROR_EVENT, "payment", "deploy-2")));
        when(hypothesisRepository.findByIncidentIdOrderByScoreDescHypothesisTypeAsc(incidentId)).thenReturn(List.of(
                hypothesis(incidentId, HypothesisType.BAD_DEPLOYMENT, 65)));

        IncidentMemory strong = memory(UUID.randomUUID(), HypothesisType.BAD_DEPLOYMENT,
                List.of("payment"), "deploy-1", List.of("DATABASE_FAILURE: unavailable"), Instant.now());
        IncidentMemory weak = memory(UUID.randomUUID(), HypothesisType.RESOURCE_EXHAUSTION,
                List.of("catalog"), null, List.of("ERROR_EVENT: failure"), Instant.now().minusSeconds(60));
        when(memoryRepository.findAllByOrderByResolvedAtDesc()).thenReturn(List.of(weak, strong));

        List<SimilarIncidentMemory> result = service.findSimilar(incidentId, 5);

        assertThat(result).extracting(SimilarIncidentMemory::score).containsExactly(95, 20);
        assertThat(result.getFirst().causeScore()).isEqualTo(45);
        assertThat(result.getFirst().serviceScore()).isEqualTo(30);
        assertThat(result.getFirst().evidenceTypeScore()).isEqualTo(20);
        assertThat(result.getFirst().deploymentScore()).isZero();
        assertThat(result.getFirst().reasons()).hasSize(3);
    }

    @Test
    void excludesTheCurrentIncidentMemoryAndClampsResultLimit() {
        UUID incidentId = UUID.randomUUID();
        when(evidenceRepository.findByIncidentIdOrderByObservedAtAsc(incidentId)).thenReturn(List.of(
                evidence(incidentId, EvidenceType.ERROR_EVENT, "payment", null)));
        when(hypothesisRepository.findByIncidentIdOrderByScoreDescHypothesisTypeAsc(incidentId)).thenReturn(List.of());
        IncidentMemory current = memory(incidentId, HypothesisType.BAD_DEPLOYMENT,
                List.of("payment"), null, List.of("ERROR_EVENT: failure"), Instant.now());
        IncidentMemory prior = memory(UUID.randomUUID(), HypothesisType.BAD_DEPLOYMENT,
                List.of("payment"), null, List.of("ERROR_EVENT: failure"), Instant.now().minusSeconds(60));
        when(memoryRepository.findAllByOrderByResolvedAtDesc()).thenReturn(List.of(current, prior));

        List<SimilarIncidentMemory> result = service.findSimilar(incidentId, 0);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().memory().getIncidentId()).isEqualTo(prior.getIncidentId());
        assertThat(result.getFirst().score()).isEqualTo(50);
    }

    private Evidence evidence(UUID incidentId, EvidenceType type, String sourceService, String deploymentId) {
        return new Evidence(UUID.randomUUID(), UUID.randomUUID(), incidentId, Instant.now(), "TELEMETRY",
                sourceService, "node-1", type, Severity.ERROR, type.name(), "failure", "trace", deploymentId,
                Map.of(), 100);
    }

    private Hypothesis hypothesis(UUID incidentId, HypothesisType type, int score) {
        return new Hypothesis(UUID.randomUUID(), incidentId, type, type.name(), score, Set.of(), Set.of(),
                "deterministic", Instant.now());
    }

    private IncidentMemory memory(UUID incidentId, HypothesisType cause, List<String> services,
                                  String deploymentId, List<String> evidenceSummary, Instant resolvedAt) {
        return new IncidentMemory(UUID.randomUUID(), incidentId, resolvedAt, cause, cause.name(), 65,
                List.of("failure"), evidenceSummary, "remediate", "resolved", deploymentId, services, resolvedAt);
    }
}
