package io.causora.incident.model;

public enum EvidenceType {
    ERROR_EVENT,
    SERVICE_STATE,
    LATENCY_SPIKE,
    KAFKA_LAG,
    DATABASE_FAILURE,
    RESOURCE_PRESSURE,
    DEPLOYMENT_CHANGE,
    RECOVERY_EVENT
}
