package io.causora.telemetry.service;

import io.causora.events.*;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class TelemetryIngestionServiceTest {
    @Test void generatesIdentityAndTimestampAndNormalizesFields() {
        TelemetryEventPublisher publisher = mock(TelemetryEventPublisher.class);
        TelemetryIngestionService service = new TelemetryIngestionService(publisher);
        OperationalEvent incoming = new OperationalEvent(null, null, " payment ", " node-1 ",
                EventType.SERVICE_DOWN, Severity.CRITICAL, " down ", " ", null, null);
        OperationalEvent normalized = service.ingest(incoming);
        assertThat(normalized.eventId()).isNotNull();
        assertThat(normalized.timestamp()).isNotNull();
        assertThat(normalized.sourceService()).isEqualTo("payment");
        assertThat(normalized.nodeId()).isEqualTo("node-1");
        assertThat(normalized.message()).isEqualTo("down");
        assertThat(normalized.traceId()).isNull();
        assertThat(normalized.attributes()).isEqualTo(Map.of());
        verify(publisher).publish(normalized);
    }
}
