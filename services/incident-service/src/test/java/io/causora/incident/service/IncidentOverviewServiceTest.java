package io.causora.incident.service;

import io.causora.events.Severity;
import io.causora.incident.model.Incident;
import io.causora.incident.model.IncidentStatus;
import io.causora.incident.repository.EvidenceRepository;
import io.causora.incident.repository.HypothesisRepository;
import io.causora.incident.repository.IncidentRepository;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class IncidentOverviewServiceTest {
    private final IncidentRepository incidents = mock(IncidentRepository.class);
    private final EvidenceRepository evidence = mock(EvidenceRepository.class);
    private final HypothesisRepository hypotheses = mock(HypothesisRepository.class);
    private final IncidentOverviewService service = new IncidentOverviewService(incidents, evidence, hypotheses);

    @Test
    void returnsLiveAggregateCountsAndResolutionRate() {
        Instant latest = Instant.parse("2026-08-29T09:34:00Z");
        Incident item = new Incident(UUID.randomUUID(), latest.minusSeconds(30), latest,
                IncidentStatus.RESOLVED, Severity.CRITICAL, "Database failure", "payments", "node-1",
                UUID.randomUUID(), "Connection refused");
        when(incidents.count()).thenReturn(100L);
        when(incidents.countByStatus(IncidentStatus.OPEN)).thenReturn(3L);
        when(incidents.countByStatus(IncidentStatus.RESOLVED)).thenReturn(97L);
        when(incidents.countByStatusAndSeverity(IncidentStatus.OPEN, Severity.CRITICAL)).thenReturn(2L);
        when(incidents.findFirstByOrderByUpdatedAtDesc()).thenReturn(Optional.of(item));
        when(evidence.count()).thenReturn(485L);
        when(hypotheses.count()).thenReturn(194L);

        IncidentOverview result = service.get();

        assertThat(result.totalIncidents()).isEqualTo(100);
        assertThat(result.activeIncidents()).isEqualTo(3);
        assertThat(result.criticalActiveIncidents()).isEqualTo(2);
        assertThat(result.evidenceSignals()).isEqualTo(485);
        assertThat(result.rankedHypotheses()).isEqualTo(194);
        assertThat(result.resolutionRate()).isEqualTo(97);
        assertThat(result.latestActivityAt()).isEqualTo(latest);
    }

    @Test
    void handlesAnEmptySystemWithoutDividingByZero() {
        when(incidents.findFirstByOrderByUpdatedAtDesc()).thenReturn(Optional.empty());

        IncidentOverview result = service.get();

        assertThat(result.resolutionRate()).isZero();
        assertThat(result.latestActivityAt()).isNull();
    }
}
