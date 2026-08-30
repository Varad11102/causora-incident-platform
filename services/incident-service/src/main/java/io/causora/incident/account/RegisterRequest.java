package io.causora.incident.account;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 2, max = 80) String displayName,
        @NotBlank @Size(min = 12, max = 64) String password) {
}
