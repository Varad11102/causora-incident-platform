package io.causora.remediation.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "remediation_audit_entries", schema = "causora_remediation")
public class RemediationAuditEntry {
    @Id private UUID id;
    @Column(nullable = false) private UUID proposalId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private AuditAction action;
    @Column(nullable = false) private String actor;
    @Column(nullable = false, length = 2000) private String detail;
    @Column(nullable = false) private Instant occurredAt;

    protected RemediationAuditEntry() {}
    public RemediationAuditEntry(UUID id, UUID proposalId, AuditAction action, String actor, String detail, Instant occurredAt) {
        this.id = id; this.proposalId = proposalId; this.action = action; this.actor = actor;
        this.detail = detail; this.occurredAt = occurredAt;
    }
    public UUID getId() { return id; }
    public UUID getProposalId() { return proposalId; }
    public AuditAction getAction() { return action; }
    public String getActor() { return actor; }
    public String getDetail() { return detail; }
    public Instant getOccurredAt() { return occurredAt; }
}
