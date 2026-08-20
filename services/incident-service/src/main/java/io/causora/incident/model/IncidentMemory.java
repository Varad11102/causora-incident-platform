package io.causora.incident.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "incident_memories")
public class IncidentMemory {
    @Id private UUID id;
    @Column(nullable = false, unique = true) private UUID incidentId;
    @Column(nullable = false) private Instant resolvedAt;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private HypothesisType causeType;
    @Column(nullable = false) private String causeTitle;
    @Column(nullable = false) private int causeScore;
    @Convert(converter = StringListConverter.class) @Column(name = "symptoms_json", nullable = false, columnDefinition = "TEXT")
    private List<String> symptoms;
    @Convert(converter = StringListConverter.class) @Column(name = "evidence_summary_json", nullable = false, columnDefinition = "TEXT")
    private List<String> evidenceSummary;
    @Column(nullable = false, length = 2000) private String remediation;
    @Column(nullable = false, length = 2000) private String result;
    private String deploymentId;
    @Convert(converter = StringListConverter.class) @Column(name = "services_json", nullable = false, columnDefinition = "TEXT")
    private List<String> services;
    @Column(nullable = false) private Instant createdAt;

    protected IncidentMemory() {}

    public IncidentMemory(UUID id, UUID incidentId, Instant resolvedAt, HypothesisType causeType, String causeTitle,
                          int causeScore, List<String> symptoms, List<String> evidenceSummary, String remediation,
                          String result, String deploymentId, List<String> services, Instant createdAt) {
        this.id = id; this.incidentId = incidentId; this.resolvedAt = resolvedAt; this.causeType = causeType;
        this.causeTitle = causeTitle; this.causeScore = causeScore; this.symptoms = List.copyOf(symptoms);
        this.evidenceSummary = List.copyOf(evidenceSummary); this.remediation = remediation; this.result = result;
        this.deploymentId = deploymentId; this.services = List.copyOf(services); this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public UUID getIncidentId() { return incidentId; }
    public Instant getResolvedAt() { return resolvedAt; }
    public HypothesisType getCauseType() { return causeType; }
    public String getCauseTitle() { return causeTitle; }
    public int getCauseScore() { return causeScore; }
    public List<String> getSymptoms() { return symptoms; }
    public List<String> getEvidenceSummary() { return evidenceSummary; }
    public String getRemediation() { return remediation; }
    public String getResult() { return result; }
    public String getDeploymentId() { return deploymentId; }
    public List<String> getServices() { return services; }
    public Instant getCreatedAt() { return createdAt; }
}
