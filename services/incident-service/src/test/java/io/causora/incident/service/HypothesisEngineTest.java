package io.causora.incident.service;

import io.causora.events.Severity;
import io.causora.incident.model.*;
import io.causora.incident.repository.EvidenceRepository;
import io.causora.incident.repository.HypothesisRepository;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

class HypothesisEngineTest {
    private final EvidenceRepository evidenceRepository = mock(EvidenceRepository.class);
    private final HypothesisRepository hypothesisRepository = mock(HypothesisRepository.class);
    private final HypothesisEngine engine = new HypothesisEngine(evidenceRepository, hypothesisRepository);

    @Test
    void ranksCompetingDatabaseAndDeploymentHypothesesWithTransparentScoresAndCounterEvidence() {
        UUID incidentId = UUID.randomUUID();
        Instant start = Instant.parse("2026-08-19T10:00:00Z");
        Evidence deployment = evidence(incidentId, EvidenceType.DEPLOYMENT_CHANGE, start, "deployment");
        Evidence database = evidence(incidentId, EvidenceType.DATABASE_FAILURE, start.plusSeconds(5), "database failed");
        Evidence error = evidence(incidentId, EvidenceType.ERROR_EVENT, start.plusSeconds(10), "requests failed");
        Evidence latency = evidence(incidentId, EvidenceType.LATENCY_SPIKE, start.plusSeconds(15), "latency increased");
        Evidence recovery = evidence(incidentId, EvidenceType.RECOVERY_EVENT, start.plusSeconds(20), "rollback recovered");
        when(evidenceRepository.findByIncidentIdOrderByObservedAtAsc(incidentId))
                .thenReturn(List.of(deployment, database, error, latency, recovery));
        when(hypothesisRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        List<Hypothesis> result = engine.refresh(incidentId);

        assertThat(result).extracting(Hypothesis::getHypothesisType)
                .containsExactly(HypothesisType.DATABASE_CONNECTIVITY_FAILURE, HypothesisType.BAD_DEPLOYMENT);
        assertThat(result).allSatisfy(hypothesis -> {
            assertThat(hypothesis.getCounterEvidenceIds()).containsExactly(recovery.getId());
            assertThat(hypothesis.getExplanation()).contains("40").contains("-20");
        });
        assertThat(result).filteredOn(item -> item.getHypothesisType() == HypothesisType.DATABASE_CONNECTIVITY_FAILURE)
                .singleElement().satisfies(item -> assertThat(item.getScore()).isEqualTo(50));
        assertThat(result).filteredOn(item -> item.getHypothesisType() == HypothesisType.BAD_DEPLOYMENT)
                .singleElement().satisfies(item -> {
                    assertThat(item.getScore()).isEqualTo(65);
                    assertThat(item.getExplanation()).contains("+15 shared deployment correlation");
                });
        assertThat(result.get(0).getSupportingEvidenceIds()).contains(database.getId(), error.getId(), latency.getId());
        assertThat(result.get(1).getSupportingEvidenceIds()).contains(deployment.getId(), database.getId());
    }

    @Test
    void clampsResourceScoreAndDoesNotInventUntriggeredHypotheses() {
        UUID incidentId = UUID.randomUUID();
        Evidence pressure = evidence(incidentId, EvidenceType.RESOURCE_PRESSURE, Instant.now(), "memory pressure");
        when(evidenceRepository.findByIncidentIdOrderByObservedAtAsc(incidentId)).thenReturn(List.of(pressure));
        when(hypothesisRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        List<Hypothesis> result = engine.refresh(incidentId);

        assertThat(result).singleElement().satisfies(hypothesis -> {
            assertThat(hypothesis.getHypothesisType()).isEqualTo(HypothesisType.RESOURCE_EXHAUSTION);
            assertThat(hypothesis.getScore()).isBetween(0, 100).isEqualTo(40);
        });
    }

    private Evidence evidence(UUID incidentId, EvidenceType type, Instant observedAt, String value) {
        return new Evidence(UUID.randomUUID(), UUID.randomUUID(), incidentId, observedAt, "TELEMETRY",
                "payment", "node-1", type, Severity.ERROR, type.name(), value,
                "trace-1", "deployment-1", Map.of("scenario", "test"), 100);
    }
}
