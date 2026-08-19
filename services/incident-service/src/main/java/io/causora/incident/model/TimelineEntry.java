package io.causora.incident.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incident_timeline_entries")
public class TimelineEntry {
    @Id private UUID id;
    @Column(nullable = false) private UUID incidentId;
    @Column(nullable = false, unique = true) private UUID evidenceId;
    @Column(nullable = false) private Instant occurredAt;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private EvidenceType entryType;
    @Column(nullable = false) private String sourceService;
    @Column(nullable = false) private String sourceNode;
    @Column(nullable = false, length = 2000) private String summary;
    private String traceId;
    private String deploymentId;

    protected TimelineEntry() {}

    public TimelineEntry(UUID id, UUID incidentId, UUID evidenceId, Instant occurredAt, EvidenceType entryType,
                         String sourceService, String sourceNode, String summary, String traceId, String deploymentId) {
        this.id = id;
        this.incidentId = incidentId;
        this.evidenceId = evidenceId;
        this.occurredAt = occurredAt;
        this.entryType = entryType;
        this.sourceService = sourceService;
        this.sourceNode = sourceNode;
        this.summary = summary;
        this.traceId = traceId;
        this.deploymentId = deploymentId;
    }

    public UUID getId() { return id; }
    public UUID getIncidentId() { return incidentId; }
    public UUID getEvidenceId() { return evidenceId; }
    public Instant getTimestamp() { return occurredAt; }
    public EvidenceType getEventType() { return entryType; }
    public String getService() { return sourceService; }
    public String getNode() { return sourceNode; }
    public String getSummary() { return summary; }
    public String getTraceId() { return traceId; }
    public String getDeploymentId() { return deploymentId; }
}
