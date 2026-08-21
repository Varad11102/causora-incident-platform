package io.causora.remediation.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "remediation_proposals", schema = "causora_remediation")
public class RemediationProposal {
    @Id private UUID id;
    @Column(nullable = false) private UUID incidentId;
    @Column(nullable = false, unique = true) private String idempotencyKey;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private PlaybookKey playbookKey;
    @Column(nullable = false) private String target;
    @Column(nullable = false, length = 2000) private String reason;
    @Column(nullable = false, columnDefinition = "TEXT") private String parametersJson;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private RemediationRisk risk;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ProposalStatus status;
    @Column(nullable = false) private String createdBy;
    @Column(nullable = false) private Instant createdAt;
    private String decidedBy;
    private Instant decidedAt;

    protected RemediationProposal() {}

    public RemediationProposal(UUID id, UUID incidentId, String idempotencyKey, PlaybookKey playbookKey,
                               String target, String reason, String parametersJson, String createdBy, Instant createdAt) {
        this.id = id; this.incidentId = incidentId; this.idempotencyKey = idempotencyKey;
        this.playbookKey = playbookKey; this.target = target; this.reason = reason;
        this.parametersJson = parametersJson; this.risk = playbookKey.risk(); this.status = ProposalStatus.PROPOSED;
        this.createdBy = createdBy; this.createdAt = createdAt;
    }

    public void decide(ProposalStatus decision, String actor, Instant at) {
        if (status != ProposalStatus.PROPOSED) throw new IllegalStateException("proposal is already decided");
        if (decision == ProposalStatus.PROPOSED) throw new IllegalArgumentException("decision must be APPROVED or REJECTED");
        status = decision; decidedBy = actor; decidedAt = at;
    }

    public UUID getId() { return id; }
    public UUID getIncidentId() { return incidentId; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public PlaybookKey getPlaybookKey() { return playbookKey; }
    public String getTarget() { return target; }
    public String getReason() { return reason; }
    public String getParametersJson() { return parametersJson; }
    public RemediationRisk getRisk() { return risk; }
    public ProposalStatus getStatus() { return status; }
    public String getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public String getDecidedBy() { return decidedBy; }
    public Instant getDecidedAt() { return decidedAt; }
}
