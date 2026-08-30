package io.causora.incident.account;

import java.time.Instant;
import java.util.UUID;

public record AccountView(
        UUID id,
        String email,
        String displayName,
        AccountRole role,
        Instant createdAt,
        Instant lastLoginAt) {

    public static AccountView from(UserAccount account) {
        return new AccountView(account.getId(), account.getEmail(), account.getDisplayName(), account.getRole(),
                account.getCreatedAt(), account.getLastLoginAt());
    }
}
