package io.causora.incident.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "hypotheses", uniqueConstraints = @UniqueConstraint(columnNames = {"incident_id", "hypothesis_type"}))
public class Hypothesis {
    @Id private UUID id;
    @Column(nullable = false) private UUID incidentId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private HypothesisType hypothesisType;
    @Column(nullable = false) private String title;
    @Column(nullable = false) private int score;
    @Column(nullable = false, length = 2000) private String explanation;
    @Column(nullable = false) private Instant createdAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "hypothesis_supporting_evidence", joinColumns = @JoinColumn(name = "hypothesis_id"))
    @Column(name = "evidence_id")
    private Set<UUID> supportingEvidenceIds = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "hypothesis_counter_evidence", joinColumns = @JoinColumn(name = "hypothesis_id"))
    @Column(name = "evidence_id")
    private Set<UUID> counterEvidenceIds = new LinkedHashSet<>();

    protected Hypothesis() {}

    public Hypothesis(UUID id, UUID incidentId, HypothesisType hypothesisType, String title, int score,
                      Set<UUID> supportingEvidenceIds, Set<UUID> counterEvidenceIds,
                      String explanation, Instant createdAt) {
        this.id = id;
        this.incidentId = incidentId;
        this.hypothesisType = hypothesisType;
        this.title = title;
        this.score = Math.max(0, Math.min(100, score));
        this.supportingEvidenceIds = new LinkedHashSet<>(supportingEvidenceIds);
        this.counterEvidenceIds = new LinkedHashSet<>(counterEvidenceIds);
        this.explanation = explanation;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public UUID getIncidentId() { return incidentId; }
    public HypothesisType getHypothesisType() { return hypothesisType; }
    public String getTitle() { return title; }
    public int getScore() { return score; }
    public Set<UUID> getSupportingEvidenceIds() { return supportingEvidenceIds; }
    public Set<UUID> getCounterEvidenceIds() { return counterEvidenceIds; }
    public String getExplanation() { return explanation; }
    public Instant getCreatedAt() { return createdAt; }
}
