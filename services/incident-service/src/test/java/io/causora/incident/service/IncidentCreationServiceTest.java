package io.causora.incident.service;

import io.causora.events.*;
import io.causora.incident.model.Incident;
import io.causora.incident.repository.IncidentRepository;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class IncidentCreationServiceTest {
    private final IncidentRepository repository = mock(IncidentRepository.class);
    private final IncidentCreationService service = new IncidentCreationService(repository);
    @Test void createsIncidentForServiceDown() {
        OperationalEvent event = event(EventType.SERVICE_DOWN, Severity.ERROR);
        when(repository.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));
        Incident incident = service.process(event).orElseThrow();
        assertThat(incident.getTriggeringEventId()).isEqualTo(event.eventId());
        assertThat(incident.getTitle()).contains("Service down");
    }
    @Test void ignoresNonCriticalServiceError() {
        assertThat(service.process(event(EventType.SERVICE_ERROR, Severity.ERROR))).isEmpty();
        verifyNoInteractions(repository);
    }
    @Test void preventsDuplicateTriggeringEvent() {
        OperationalEvent event = event(EventType.DATABASE_ERROR, Severity.CRITICAL);
        when(repository.existsByTriggeringEventId(event.eventId())).thenReturn(true);
        assertThat(service.process(event)).isEmpty();
        verify(repository, never()).save(any());
    }
    private OperationalEvent event(EventType type, Severity severity) {
        return new OperationalEvent(UUID.randomUUID(), Instant.now(), "payment", "node-1", type, severity,
                "failure", "trace-1", null, Map.of());
    }
}
