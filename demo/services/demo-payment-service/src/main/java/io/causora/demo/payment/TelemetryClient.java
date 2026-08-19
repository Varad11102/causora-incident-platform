package io.causora.demo.payment;

import io.causora.events.EventType;
import io.causora.events.OperationalEvent;
import io.causora.events.Severity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.util.Map;

@Component
public class TelemetryClient {
    private static final Logger log = LoggerFactory.getLogger(TelemetryClient.class);
    private final RestClient restClient;
    public TelemetryClient(RestClient.Builder builder, @Value("${causora.telemetry-base-url}") String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }
    public OperationalEvent send(EventType eventType, Severity severity, String message) {
        return send(eventType, severity, message, null, "demo-deployment-v1", Map.of("environment", "demo"));
    }

    public OperationalEvent send(EventType eventType, Severity severity, String message, String traceId,
                                 String deploymentId, Map<String, String> attributes) {
        OperationalEvent event = new OperationalEvent(null, null, "demo-payment-service", "demo-node-1",
                eventType, severity, message, traceId, deploymentId, attributes);
        OperationalEvent accepted = restClient.post().uri("/api/v1/telemetry/events").body(event)
                .retrieve().body(OperationalEvent.class);
        log.info("demo_event_sent eventId={} eventType={} severity={}", accepted == null ? null : accepted.eventId(), eventType, severity);
        return accepted;
    }
}
