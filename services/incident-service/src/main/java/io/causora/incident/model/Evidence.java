package io.causora.incident.model;

import io.causora.events.Severity;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "evidence")
public class Evidence {
    @Id private UUID id;
    @Column(nullable = false, unique = true) private UUID eventId;
    private UUID incidentId;
    @Column(nullable = false) private Instant observedAt;
    @Column(nullable = false) private String sourceType;
    @Column(nullable = false) private String sourceService;
    @Column(nullable = false) private String sourceNode;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private EvidenceType evidenceType;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Severity severity;
    @Column(name = "evidence_key", nullable = false) private String key;
    @Column(name = "evidence_value", nullable = false, length = 2000) private String value;
    private String traceId;
    private String deploymentId;
    @Convert(converter = StringMapConverter.class)
    @Column(name = "metadata_json", nullable = false, columnDefinition = "TEXT")
    private Map<String, String> metadata;
    private Integer confidence;

    protected Evidence() {}

    public Evidence(UUID id, UUID eventId, UUID incidentId, Instant observedAt, String sourceType,
                    String sourceService, String sourceNode, EvidenceType evidenceType, Severity severity,
                    String key, String value, String traceId, String deploymentId,
                    Map<String, String> metadata, Integer confidence) {
        this.id = id;
        this.eventId = eventId;
        this.incidentId = incidentId;
        this.observedAt = observedAt;
        this.sourceType = sourceType;
        this.sourceService = sourceService;
        this.sourceNode = sourceNode;
        this.evidenceType = evidenceType;
        this.severity = severity;
        this.key = key;
        this.value = value;
        this.traceId = traceId;
        this.deploymentId = deploymentId;
        this.metadata = metadata == null ? Map.of() : Map.copyOf(metadata);
        this.confidence = confidence;
    }

    public void linkToIncident(UUID incidentId) { this.incidentId = incidentId; }
    public UUID getId() { return id; }
    public UUID getEventId() { return eventId; }
    public UUID getIncidentId() { return incidentId; }
    public Instant getObservedAt() { return observedAt; }
    public String getSourceType() { return sourceType; }
    public String getSourceService() { return sourceService; }
    public String getSourceNode() { return sourceNode; }
    public EvidenceType getEvidenceType() { return evidenceType; }
    public Severity getSeverity() { return severity; }
    public String getKey() { return key; }
    public String getValue() { return value; }
    public String getTraceId() { return traceId; }
    public String getDeploymentId() { return deploymentId; }
    public Map<String, String> getMetadata() { return metadata; }
    public Integer getConfidence() { return confidence; }
}
