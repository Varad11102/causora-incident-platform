package io.causora.incident.service;

import io.causora.events.Severity;
import io.causora.incident.model.IncidentStatus;
import io.causora.incident.repository.EvidenceRepository;
import io.causora.incident.repository.HypothesisRepository;
import io.causora.incident.repository.IncidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IncidentOverviewService {
    private final IncidentRepository incidentRepository;
    private final EvidenceRepository evidenceRepository;
    private final HypothesisRepository hypothesisRepository;

    public IncidentOverviewService(IncidentRepository incidentRepository,
                                   EvidenceRepository evidenceRepository,
                                   HypothesisRepository hypothesisRepository) {
        this.incidentRepository = incidentRepository;
        this.evidenceRepository = evidenceRepository;
        this.hypothesisRepository = hypothesisRepository;
    }

    @Transactional(readOnly = true)
    public IncidentOverview get() {
        long total = incidentRepository.count();
        long active = incidentRepository.countByStatus(IncidentStatus.OPEN);
        long resolved = incidentRepository.countByStatus(IncidentStatus.RESOLVED);
        long criticalActive = incidentRepository.countByStatusAndSeverity(IncidentStatus.OPEN, Severity.CRITICAL);
        int resolutionRate = total == 0 ? 0 : (int) Math.round((resolved * 100.0) / total);

        return new IncidentOverview(
                total,
                active,
                resolved,
                criticalActive,
                evidenceRepository.count(),
                hypothesisRepository.count(),
                resolutionRate,
                incidentRepository.findFirstByOrderByUpdatedAtDesc().map(item -> item.getUpdatedAt()).orElse(null));
    }
}
