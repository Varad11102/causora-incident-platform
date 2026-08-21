package io.causora.remediation.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DecisionRequest(@NotBlank @Size(max = 2000) String reason) {}
