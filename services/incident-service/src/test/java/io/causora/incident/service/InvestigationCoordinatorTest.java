package io.causora.incident.service;

import io.causora.events.*;
import io.causora.incident.repository.*;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import io.causora.incident.model.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class InvestigationCoordinatorTest {
    @Test
    void ignoresDuplicateEvidenceBeforeCreatingAnotherIncidentOrTimelineEntry() {
        IncidentCreationService incidentCreation = mock(IncidentCreationService.class);
        IncidentRepository incidents = mock(IncidentRepository.class);
        EvidenceRepository evidence = mock(EvidenceRepository.class);
        TimelineRepository timeline = mock(TimelineRepository.class);
        HypothesisEngine hypotheses = mock(HypothesisEngine.class);
        IncidentMemoryService memory = mock(IncidentMemoryService.class);
        OperationalEvent event = new OperationalEvent(UUID.randomUUID(), Instant.now(), "payment", "node-1",
                EventType.DATABASE_ERROR, Severity.CRITICAL, "database unavailable", "trace-1", "deploy-1", Map.of());
        when(evidence.existsByEventId(event.eventId())).thenReturn(true);

        new InvestigationCoordinator(incidentCreation, incidents, evidence, timeline, hypotheses, memory).process(event);

        verify(evidence).existsByEventId(event.eventId());
        verifyNoInteractions(incidentCreation, incidents, timeline, hypotheses, memory);
        verifyNoMoreInteractions(evidence);
    }

    @Test
    void explicitNewTraceCreatesANewIncidentInsteadOfFallingBackToAnOlderServiceIncident() {
        IncidentCreationService incidentCreation = mock(IncidentCreationService.class);
        IncidentRepository incidents = mock(IncidentRepository.class);
        EvidenceRepository evidence = mock(EvidenceRepository.class);
        TimelineRepository timeline = mock(TimelineRepository.class);
        HypothesisEngine hypotheses = mock(HypothesisEngine.class);
        IncidentMemoryService memory = mock(IncidentMemoryService.class);
        Instant now = Instant.now();
        OperationalEvent event = new OperationalEvent(UUID.randomUUID(), now, "payment", "node-1",
                EventType.DATABASE_ERROR, Severity.CRITICAL, "database unavailable", "new-trace", "new-deploy", Map.of());
        Incident created = new Incident(UUID.randomUUID(), now, now, IncidentStatus.OPEN, Severity.CRITICAL,
                "Database failure", "payment", "node-1", event.eventId(), event.message());
        when(evidence.findFirstByTraceIdAndIncidentIdIsNotNullOrderByObservedAtDesc("new-trace")).thenReturn(Optional.empty());
        when(evidence.findFirstByDeploymentIdAndIncidentIdIsNotNullOrderByObservedAtDesc("new-deploy")).thenReturn(Optional.empty());
        when(incidentCreation.process(event)).thenReturn(Optional.of(created));
        when(evidence.save(any(Evidence.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(evidence.findByIncidentIdIsNullAndSourceServiceAndObservedAtAfterOrderByObservedAtAsc(anyString(), any()))
                .thenReturn(java.util.List.of());

        new InvestigationCoordinator(incidentCreation, incidents, evidence, timeline, hypotheses, memory).process(event);

        verify(incidentCreation).process(event);
        verify(incidents, never()).findFirstBySourceServiceAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(any(), any(), any());
        verify(hypotheses).refresh(created.getId());
    }

    @Test
    void recoveryEvidenceResolvesTheCorrelatedIncidentWithoutDeletingItsInvestigation() {
        IncidentCreationService incidentCreation = mock(IncidentCreationService.class);
        IncidentRepository incidents = mock(IncidentRepository.class);
        EvidenceRepository evidence = mock(EvidenceRepository.class);
        TimelineRepository timeline = mock(TimelineRepository.class);
        HypothesisEngine hypotheses = mock(HypothesisEngine.class);
        IncidentMemoryService memory = mock(IncidentMemoryService.class);
        Instant createdAt = Instant.now().minusSeconds(30);
        Incident incident = new Incident(UUID.randomUUID(), createdAt, createdAt, IncidentStatus.OPEN, Severity.CRITICAL,
                "Database failure", "payment", "node-1", UUID.randomUUID(), "failure");
        OperationalEvent recovery = new OperationalEvent(UUID.randomUUID(), Instant.now(), "payment", "node-1",
                EventType.DEPLOYMENT, Severity.INFO, "Rollback completed and database connectivity recovered",
                "trace-1", "deploy-1", Map.of());
        Evidence prior = new Evidence(UUID.randomUUID(), UUID.randomUUID(), incident.getId(), createdAt, "TELEMETRY",
                "payment", "node-1", EvidenceType.DATABASE_FAILURE, Severity.CRITICAL, "DATABASE_ERROR", "failure",
                "trace-1", "deploy-1", Map.of(), 100);
        when(evidence.findFirstByTraceIdAndIncidentIdIsNotNullOrderByObservedAtDesc("trace-1"))
                .thenReturn(Optional.of(prior));
        when(incidents.findById(incident.getId())).thenReturn(Optional.of(incident));
        when(evidence.save(any(Evidence.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(hypotheses.refresh(incident.getId())).thenReturn(java.util.List.of());

        new InvestigationCoordinator(incidentCreation, incidents, evidence, timeline, hypotheses, memory).process(recovery);

        assertThat(incident.getStatus()).isEqualTo(IncidentStatus.RESOLVED);
        verify(timeline).save(any(TimelineEntry.class));
        verify(hypotheses).refresh(incident.getId());
        verify(memory).snapshot(eq(incident), anyList(), eq(java.util.List.of()));
    }
}
