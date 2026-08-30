package io.causora.incident.account;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_accounts")
public class UserAccount {
    @Id private UUID id;
    @Column(nullable = false, unique = true, length = 254) private String email;
    @Column(nullable = false, length = 80) private String displayName;
    @Column(nullable = false, length = 100) private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32) private AccountRole role;
    @Column(nullable = false) private boolean enabled;
    @Column(nullable = false) private Instant createdAt;
    private Instant lastLoginAt;

    protected UserAccount() {}

    public UserAccount(UUID id, String email, String displayName, String passwordHash, AccountRole role,
                       boolean enabled, Instant createdAt, Instant lastLoginAt) {
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.passwordHash = passwordHash;
        this.role = role;
        this.enabled = enabled;
        this.createdAt = createdAt;
        this.lastLoginAt = lastLoginAt;
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getDisplayName() { return displayName; }
    public String getPasswordHash() { return passwordHash; }
    public AccountRole getRole() { return role; }
    public boolean isEnabled() { return enabled; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastLoginAt() { return lastLoginAt; }
    public void recordLogin(Instant at) { this.lastLoginAt = at; }
}
