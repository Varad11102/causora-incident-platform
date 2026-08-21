package io.causora.incident.service;

import io.causora.incident.model.IncidentMemory;
import java.util.List;

public record SimilarIncidentMemory(
        IncidentMemory memory,
        int score,
        int causeScore,
        int serviceScore,
        int evidenceTypeScore,
        int deploymentScore,
        List<String> reasons) {
}
