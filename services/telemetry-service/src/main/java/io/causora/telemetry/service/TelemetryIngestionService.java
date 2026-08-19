package io.causora.telemetry.service;

import io.causora.events.OperationalEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class TelemetryIngestionService {
    private static final Logger log = LoggerFactory.getLogger(TelemetryIngestionService.class);
    private final TelemetryEventPublisher publisher;

    public TelemetryIngestionService(TelemetryEventPublisher publisher) { this.publisher = publisher; }

    public OperationalEvent ingest(OperationalEvent incoming) {
        OperationalEvent event = new OperationalEvent(
                incoming.eventId() == null ? UUID.randomUUID() : incoming.eventId(),
                incoming.timestamp() == null ? Instant.now() : incoming.timestamp(),
                incoming.sourceService().trim(), incoming.nodeId().trim(), incoming.eventType(), incoming.severity(),
                incoming.message().trim(), clean(incoming.traceId()), clean(incoming.deploymentId()),
                incoming.attributes() == null ? Map.of() : Map.copyOf(incoming.attributes()));
        log.info("telemetry_accepted eventId={} traceId={} sourceService={} nodeId={} eventType={} severity={}",
                event.eventId(), event.traceId(), event.sourceService(), event.nodeId(), event.eventType(), event.severity());
        publisher.publish(event);
        return event;
    }

    private String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
