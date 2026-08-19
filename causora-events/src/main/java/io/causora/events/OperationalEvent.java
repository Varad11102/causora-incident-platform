package io.causora.events;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record OperationalEvent(
        UUID eventId,
        Instant timestamp,
        @NotBlank String sourceService,
        @NotBlank String nodeId,
        @NotNull EventType eventType,
        @NotNull Severity severity,
        @NotBlank String message,
        String traceId,
        String deploymentId,
        Map<String, String> attributes) {
}
