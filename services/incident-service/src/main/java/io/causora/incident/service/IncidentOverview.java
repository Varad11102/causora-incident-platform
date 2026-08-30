package io.causora.incident.service;

import java.time.Instant;

public record IncidentOverview(
        long totalIncidents,
        long activeIncidents,
        long resolvedIncidents,
        long criticalActiveIncidents,
        long evidenceSignals,
        long rankedHypotheses,
        int resolutionRate,
        Instant latestActivityAt) {
}
