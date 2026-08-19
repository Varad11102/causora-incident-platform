package io.causora.telemetry.controller;

import io.causora.events.OperationalEvent;
import io.causora.telemetry.service.TelemetryIngestionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/telemetry/events")
public class TelemetryController {
    private final TelemetryIngestionService ingestionService;
    public TelemetryController(TelemetryIngestionService ingestionService) { this.ingestionService = ingestionService; }

    @PostMapping
    public ResponseEntity<OperationalEvent> accept(@Valid @RequestBody OperationalEvent event) {
        return ResponseEntity.accepted().body(ingestionService.ingest(event));
    }
}
