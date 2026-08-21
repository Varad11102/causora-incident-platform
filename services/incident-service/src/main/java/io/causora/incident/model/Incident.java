package io.causora.incident.model;

import io.causora.events.Severity;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incidents")
public class Incident {
    @Id private UUID id;
    @Column(nullable = false) private Instant createdAt;
    @Column(nullable = false) private Instant updatedAt;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private IncidentStatus status;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Severity severity;
    @Column(nullable = false) private String title;
    @Column(nullable = false) private String sourceService;
    @Column(nullable = false) private String sourceNode;
    @Column(nullable = false, unique = true) private UUID triggeringEventId;
    @Column(nullable = false, length = 2000) private String summary;

    protected Incident() {}
    public Incident(UUID id, Instant createdAt, Instant updatedAt, IncidentStatus status, Severity severity,
                    String title, String sourceService, String sourceNode, UUID triggeringEventId, String summary) {
        this.id = id; this.createdAt = createdAt; this.updatedAt = updatedAt; this.status = status;
        this.severity = severity; this.title = title; this.sourceService = sourceService;
        this.sourceNode = sourceNode; this.triggeringEventId = triggeringEventId; this.summary = summary;
    }
    public UUID getId() { return id; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public IncidentStatus getStatus() { return status; }
    public Severity getSeverity() { return severity; }
    public String getTitle() { return title; }
    public String getSourceService() { return sourceService; }
    public String getSourceNode() { return sourceNode; }
    public UUID getTriggeringEventId() { return triggeringEventId; }
    public String getSummary() { return summary; }
    public void resolve(Instant resolvedAt) {
        this.status = IncidentStatus.RESOLVED;
        this.updatedAt = resolvedAt.isBefore(createdAt) ? createdAt : resolvedAt;
    }
}
