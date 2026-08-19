package io.causora.incident.messaging;

import io.causora.events.*;
import io.causora.incident.service.InvestigationCoordinator;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import static org.mockito.Mockito.*;

class OperationalEventConsumerTest {
    @Test void delegatesConsumedEventForIncidentEvaluation() {
        InvestigationCoordinator service = mock(InvestigationCoordinator.class);
        OperationalEvent event = new OperationalEvent(UUID.randomUUID(), Instant.now(), "payment", "node-1",
                EventType.RESOURCE_EXHAUSTION, Severity.CRITICAL, "memory exhausted", null, null, Map.of());
        new OperationalEventConsumer(service).consume(event);
        verify(service).process(event);
    }
}
