package io.causora.incident.service;

import io.causora.events.Severity;
import io.causora.incident.model.*;
import io.causora.incident.repository.IncidentMemoryRepository;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class IncidentMemoryServiceTest {
    private final IncidentMemoryRepository repository = mock(IncidentMemoryRepository.class);
    private final IncidentMemoryService service = new IncidentMemoryService(repository);

    @Test
    void snapshotsTheHighestRankedCauseAndStructuredResolvedIncidentContext() {
        UUID incidentId = UUID.randomUUID();
        Instant now = Instant.now();
        Incident incident = new Incident(incidentId, now.minusSeconds(30), now.minusSeconds(30), IncidentStatus.OPEN,
                Severity.CRITICAL, "Database failure", "payment", "node-1", UUID.randomUUID(), "failure");
        incident.resolve(now);
        Evidence deployment = evidence(incidentId, EvidenceType.DEPLOYMENT_CHANGE, "deployment changed");
        Evidence database = evidence(incidentId, EvidenceType.DATABASE_FAILURE, "database unavailable");
        Evidence recovery = evidence(incidentId, EvidenceType.RECOVERY_EVENT, "rollback recovered");
        Hypothesis databaseCause = hypothesis(incidentId, HypothesisType.DATABASE_CONNECTIVITY_FAILURE, 50);
        Hypothesis deploymentCause = hypothesis(incidentId, HypothesisType.BAD_DEPLOYMENT, 65);
        when(repository.save(any(IncidentMemory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        IncidentMemory memory = service.snapshot(incident, List.of(deployment, database, recovery),
                List.of(databaseCause, deploymentCause)).orElseThrow();

        assertThat(memory.getCauseType()).isEqualTo(HypothesisType.BAD_DEPLOYMENT);
        assertThat(memory.getCauseScore()).isEqualTo(65);
        assertThat(memory.getSymptoms()).containsExactly("database unavailable");
        assertThat(memory.getEvidenceSummary()).hasSize(3);
        assertThat(memory.getServices()).containsExactly("payment");
        assertThat(memory.getRemediation()).contains("Rollback");
        assertThat(memory.getResult()).contains("resolved");
    }

    @Test
    void doesNotOverwriteAnExistingIncidentMemory() {
        UUID incidentId = UUID.randomUUID();
        Instant now = Instant.now();
        Incident incident = new Incident(incidentId, now, now, IncidentStatus.RESOLVED, Severity.ERROR,
                "Resolved", "payment", "node-1", UUID.randomUUID(), "resolved");
        when(repository.existsByIncidentId(incidentId)).thenReturn(true);

        assertThat(service.snapshot(incident, List.of(), List.of(hypothesis(incidentId, HypothesisType.BAD_DEPLOYMENT, 60))))
                .isEmpty();
        verify(repository, never()).save(any());
    }

    private Evidence evidence(UUID incidentId, EvidenceType type, String value) {
        return new Evidence(UUID.randomUUID(), UUID.randomUUID(), incidentId, Instant.now(), "TELEMETRY", "payment",
                "node-1", type, Severity.ERROR, type.name(), value, "trace", "deploy-1", Map.of(), 100);
    }

    private Hypothesis hypothesis(UUID incidentId, HypothesisType type, int score) {
        return new Hypothesis(UUID.randomUUID(), incidentId, type, type.name(), score, Set.of(), Set.of(),
                "deterministic", Instant.now());
    }
}
