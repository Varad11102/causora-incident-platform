package io.causora.remediation.api;

import io.causora.remediation.model.PlaybookKey;
import jakarta.validation.constraints.*;
import java.util.Map;
import java.util.UUID;

public record CreateProposalRequest(
        @NotNull UUID incidentId,
        @NotBlank @Size(max = 255) String idempotencyKey,
        @NotNull PlaybookKey playbookKey,
        @NotBlank @Size(max = 255) String target,
        @NotBlank @Size(max = 2000) String reason,
        Map<String, String> parameters) {
    public CreateProposalRequest {
        parameters = parameters == null ? Map.of() : Map.copyOf(parameters);
    }
}
