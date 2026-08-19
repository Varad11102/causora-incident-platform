package io.causora.incident.controller;

import io.causora.incident.model.Incident;
import io.causora.incident.repository.IncidentRepository;
import io.causora.incident.repository.EvidenceRepository;
import io.causora.incident.repository.HypothesisRepository;
import io.causora.incident.repository.TimelineRepository;
import io.causora.incident.model.Evidence;
import io.causora.incident.model.Hypothesis;
import io.causora.incident.model.TimelineEntry;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/incidents")
public class IncidentController {
    private final IncidentRepository repository;
    private final EvidenceRepository evidenceRepository;
    private final TimelineRepository timelineRepository;
    private final HypothesisRepository hypothesisRepository;

    public IncidentController(IncidentRepository repository, EvidenceRepository evidenceRepository,
                              TimelineRepository timelineRepository, HypothesisRepository hypothesisRepository) {
        this.repository = repository;
        this.evidenceRepository = evidenceRepository;
        this.timelineRepository = timelineRepository;
        this.hypothesisRepository = hypothesisRepository;
    }

    @GetMapping
    public List<Incident> list() { return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")); }
    @GetMapping("/{id}")
    public ResponseEntity<Incident> get(@PathVariable UUID id) {
        return repository.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/evidence")
    public ResponseEntity<List<Evidence>> evidence(@PathVariable UUID id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(evidenceRepository.findByIncidentIdOrderByObservedAtAsc(id));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<TimelineEntry>> timeline(@PathVariable UUID id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(timelineRepository.findByIncidentIdOrderByOccurredAtAsc(id));
    }

    @GetMapping("/{id}/hypotheses")
    public ResponseEntity<List<Hypothesis>> hypotheses(@PathVariable UUID id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(hypothesisRepository.findByIncidentIdOrderByScoreDescHypothesisTypeAsc(id));
    }
}
