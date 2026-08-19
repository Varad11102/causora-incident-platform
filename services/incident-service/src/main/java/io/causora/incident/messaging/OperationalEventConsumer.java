package io.causora.incident.messaging;

import io.causora.events.OperationalEvent;
import io.causora.incident.service.IncidentCreationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OperationalEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(OperationalEventConsumer.class);
    private final IncidentCreationService incidentCreationService;
    public OperationalEventConsumer(IncidentCreationService incidentCreationService) { this.incidentCreationService = incidentCreationService; }

    @KafkaListener(topics = "${causora.kafka.operational-events-topic}")
    public void consume(OperationalEvent event) {
        log.info("telemetry_consumed eventId={} traceId={} sourceService={} eventType={} severity={}",
                event.eventId(), event.traceId(), event.sourceService(), event.eventType(), event.severity());
        incidentCreationService.process(event);
    }
}
