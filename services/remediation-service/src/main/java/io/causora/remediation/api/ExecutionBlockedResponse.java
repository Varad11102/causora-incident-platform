package io.causora.remediation.api;

import java.util.UUID;

public record ExecutionBlockedResponse(UUID proposalId, String status, String message) {}
