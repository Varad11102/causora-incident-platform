package io.causora.incident.controller;

import io.causora.incident.model.Incident;
import io.causora.incident.repository.IncidentRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/incidents")
public class IncidentController {
    private final IncidentRepository repository;
    public IncidentController(IncidentRepository repository) { this.repository = repository; }

    @GetMapping
    public List<Incident> list() { return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")); }
    @GetMapping("/{id}")
    public ResponseEntity<Incident> get(@PathVariable UUID id) {
        return repository.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
