package io.causora.incident.controller;

import io.causora.incident.model.IncidentMemory;
import io.causora.incident.repository.IncidentMemoryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/incident-memory")
public class IncidentMemoryController {
    private final IncidentMemoryRepository repository;
    public IncidentMemoryController(IncidentMemoryRepository repository) { this.repository = repository; }

    @GetMapping
    public List<IncidentMemory> list() { return repository.findAllByOrderByResolvedAtDesc(); }

    @GetMapping("/incidents/{incidentId}")
    public ResponseEntity<IncidentMemory> byIncident(@PathVariable UUID incidentId) {
        return repository.findByIncidentId(incidentId).map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
