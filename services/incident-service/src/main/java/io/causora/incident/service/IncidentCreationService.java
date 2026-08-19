package io.causora.incident.service;

import io.causora.events.EventType;
import io.causora.events.OperationalEvent;
import io.causora.events.Severity;
import io.causora.incident.model.Incident;
import io.causora.incident.model.IncidentStatus;
import io.causora.incident.repository.IncidentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class IncidentCreationService {
    private static final Logger log = LoggerFactory.getLogger(IncidentCreationService.class);
    private final IncidentRepository repository;
    public IncidentCreationService(IncidentRepository repository) { this.repository = repository; }

    @Transactional
    public Optional<Incident> process(OperationalEvent event) {
        if (!isIncidentCondition(event)) {
            log.info("incident_not_required eventId={} eventType={} severity={}", event.eventId(), event.eventType(), event.severity());
            return Optional.empty();
        }
        if (repository.existsByTriggeringEventId(event.eventId())) {
            log.info("incident_duplicate_ignored eventId={}", event.eventId());
            return Optional.empty();
        }
        Instant now = Instant.now();
        Incident incident = new Incident(UUID.randomUUID(), now, now, IncidentStatus.OPEN, event.severity(),
                titleFor(event), event.sourceService(), event.nodeId(), event.eventId(), event.message());
        Incident saved = repository.save(incident);
        log.warn("incident_created incidentId={} eventId={} sourceService={} sourceNode={} eventType={} severity={}",
                saved.getId(), event.eventId(), event.sourceService(), event.nodeId(), event.eventType(), event.severity());
        return Optional.of(saved);
    }

    boolean isIncidentCondition(OperationalEvent event) {
        return event.eventType() == EventType.SERVICE_DOWN
                || event.eventType() == EventType.DATABASE_ERROR
                || event.eventType() == EventType.RESOURCE_EXHAUSTION
                || (event.eventType() == EventType.SERVICE_ERROR && event.severity() == Severity.CRITICAL);
    }

    private String titleFor(OperationalEvent event) {
        return switch (event.eventType()) {
            case SERVICE_DOWN -> "Service down: " + event.sourceService();
            case DATABASE_ERROR -> "Database failure: " + event.sourceService();
            case RESOURCE_EXHAUSTION -> "Resource exhaustion: " + event.nodeId();
            case SERVICE_ERROR -> "Critical service error: " + event.sourceService();
            default -> "Operational incident: " + event.sourceService();
        };
    }
}
