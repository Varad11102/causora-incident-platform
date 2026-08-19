package io.causora.telemetry.service;

import io.causora.events.*;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import static org.mockito.Mockito.*;

class TelemetryEventPublisherTest {
    @Test void publishesToVersionedTopicUsingEventIdAsKey() {
        @SuppressWarnings("unchecked") KafkaTemplate<String, OperationalEvent> kafkaTemplate = mock(KafkaTemplate.class);
        OperationalEvent event = new OperationalEvent(UUID.randomUUID(), Instant.now(), "payment", "node-1",
                EventType.DATABASE_ERROR, Severity.ERROR, "database unavailable", null, null, Map.of());
        when(kafkaTemplate.send("telemetry.operational.v1", event.eventId().toString(), event)).thenReturn(new CompletableFuture<>());
        new TelemetryEventPublisher(kafkaTemplate, "telemetry.operational.v1").publish(event);
        verify(kafkaTemplate).send("telemetry.operational.v1", event.eventId().toString(), event);
    }
}
