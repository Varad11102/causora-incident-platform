package io.causora.incident.service;

import io.causora.events.EventType;
import io.causora.events.OperationalEvent;
import io.causora.incident.model.*;
import io.causora.incident.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
public class InvestigationCoordinator {
    private static final Logger log = LoggerFactory.getLogger(InvestigationCoordinator.class);
    private static final Duration CORRELATION_WINDOW = Duration.ofMinutes(10);
    private final IncidentCreationService incidentCreationService;
    private final IncidentRepository incidentRepository;
    private final EvidenceRepository evidenceRepository;
    private final TimelineRepository timelineRepository;
    private final HypothesisEngine hypothesisEngine;
    private final IncidentMemoryService incidentMemoryService;

    public InvestigationCoordinator(IncidentCreationService incidentCreationService, IncidentRepository incidentRepository,
                                    EvidenceRepository evidenceRepository, TimelineRepository timelineRepository,
                                    HypothesisEngine hypothesisEngine, IncidentMemoryService incidentMemoryService) {
        this.incidentCreationService = incidentCreationService;
        this.incidentRepository = incidentRepository;
        this.evidenceRepository = evidenceRepository;
        this.timelineRepository = timelineRepository;
        this.hypothesisEngine = hypothesisEngine;
        this.incidentMemoryService = incidentMemoryService;
    }

    @Transactional
    public void process(OperationalEvent event) {
        if (evidenceRepository.existsByEventId(event.eventId())) {
            log.info("evidence_duplicate_ignored eventId={}", event.eventId());
            return;
        }

        Optional<Incident> correlated = findCorrelatedIncident(event);
        Optional<Incident> created = correlated.isEmpty() ? incidentCreationService.process(event) : Optional.empty();
        Incident incident = correlated.orElseGet(() -> created.orElse(null));
        Evidence evidence = evidenceRepository.save(toEvidence(event, incident == null ? null : incident.getId()));

        if (incident == null) {
            log.info("evidence_pending_correlation evidenceId={} eventId={} sourceService={}",
                    evidence.getId(), event.eventId(), event.sourceService());
            return;
        }

        createTimelineEntry(evidence, incident.getId());
        if (created.isPresent()) linkPendingEvidence(event, incident.getId());
        if (evidence.getEvidenceType() == EvidenceType.RECOVERY_EVENT && incident.getStatus() != IncidentStatus.RESOLVED) {
            incident.resolve(event.timestamp());
            log.info("incident_resolved incidentId={} recoveryEvidenceId={}", incident.getId(), evidence.getId());
        }
        List<Hypothesis> hypotheses = hypothesisEngine.refresh(incident.getId());
        if (incident.getStatus() == IncidentStatus.RESOLVED) {
            incidentMemoryService.snapshot(incident,
                    evidenceRepository.findByIncidentIdOrderByObservedAtAsc(incident.getId()), hypotheses);
        }
        log.info("investigation_refreshed incidentId={} evidenceId={} evidenceType={}",
                incident.getId(), evidence.getId(), evidence.getEvidenceType());
    }

    private Optional<Incident> findCorrelatedIncident(OperationalEvent event) {
        Optional<UUID> evidenceIncident = Optional.empty();
        if (event.traceId() != null) {
            evidenceIncident = evidenceRepository.findFirstByTraceIdAndIncidentIdIsNotNullOrderByObservedAtDesc(event.traceId())
                    .map(Evidence::getIncidentId);
        }
        if (evidenceIncident.isEmpty() && event.deploymentId() != null) {
            evidenceIncident = evidenceRepository.findFirstByDeploymentIdAndIncidentIdIsNotNullOrderByObservedAtDesc(event.deploymentId())
                    .map(Evidence::getIncidentId);
        }
        if (evidenceIncident.isPresent()) return incidentRepository.findById(evidenceIncident.get());
        if (event.traceId() != null || event.deploymentId() != null) return Optional.empty();
        return incidentRepository.findFirstBySourceServiceAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(
                event.sourceService(), IncidentStatus.OPEN, Instant.now().minus(CORRELATION_WINDOW));
    }

    private void linkPendingEvidence(OperationalEvent trigger, UUID incidentId) {
        List<Evidence> pending = evidenceRepository
                .findByIncidentIdIsNullAndSourceServiceAndObservedAtAfterOrderByObservedAtAsc(
                        trigger.sourceService(), trigger.timestamp().minus(CORRELATION_WINDOW));
        for (Evidence item : pending) {
            boolean sameTrace = trigger.traceId() != null && trigger.traceId().equals(item.getTraceId());
            boolean sameDeployment = trigger.deploymentId() != null && trigger.deploymentId().equals(item.getDeploymentId());
            if (sameTrace || sameDeployment) {
                item.linkToIncident(incidentId);
                createTimelineEntry(item, incidentId);
            }
        }
    }

    private void createTimelineEntry(Evidence evidence, UUID incidentId) {
        if (timelineRepository.existsByEvidenceId(evidence.getId())) return;
        timelineRepository.save(new TimelineEntry(UUID.randomUUID(), incidentId, evidence.getId(), evidence.getObservedAt(),
                evidence.getEvidenceType(), evidence.getSourceService(), evidence.getSourceNode(), evidence.getValue(),
                evidence.getTraceId(), evidence.getDeploymentId()));
    }

    private Evidence toEvidence(OperationalEvent event, UUID incidentId) {
        EvidenceType type = evidenceType(event);
        return new Evidence(UUID.randomUUID(), event.eventId(), incidentId, event.timestamp(), "TELEMETRY",
                event.sourceService(), event.nodeId(), type, event.severity(), event.eventType().name(), event.message(),
                event.traceId(), event.deploymentId(), event.attributes(), 100);
    }

    private EvidenceType evidenceType(OperationalEvent event) {
        if (isRecovery(event)) return EvidenceType.RECOVERY_EVENT;
        return switch (event.eventType()) {
            case DATABASE_ERROR -> EvidenceType.DATABASE_FAILURE;
            case HIGH_LATENCY -> EvidenceType.LATENCY_SPIKE;
            case KAFKA_LAG -> EvidenceType.KAFKA_LAG;
            case RESOURCE_EXHAUSTION -> EvidenceType.RESOURCE_PRESSURE;
            case DEPLOYMENT -> EvidenceType.DEPLOYMENT_CHANGE;
            case SERVICE_DOWN -> EvidenceType.SERVICE_STATE;
            case SERVICE_ERROR -> EvidenceType.ERROR_EVENT;
        };
    }

    private boolean isRecovery(OperationalEvent event) {
        String message = event.message().toLowerCase(Locale.ROOT);
        return event.severity() == io.causora.events.Severity.INFO
                && (message.contains("recover") || message.contains("restored") || message.contains("rollback completed"));
    }
}
