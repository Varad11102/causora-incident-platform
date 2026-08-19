package io.causora.demo.payment;

import io.causora.events.EventType;
import io.causora.events.OperationalEvent;
import io.causora.events.Severity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class DemoController {
    private final TelemetryClient telemetryClient;
    public DemoController(TelemetryClient telemetryClient) { this.telemetryClient = telemetryClient; }
    @GetMapping("/health-demo")
    public Map<String, String> health() { return Map.of("service", "demo-payment-service", "status", "UP"); }
    @PostMapping("/demo/fail")
    public OperationalEvent fail() {
        return telemetryClient.send(EventType.SERVICE_DOWN, Severity.CRITICAL, "Demo payment service is unavailable");
    }
    @PostMapping("/demo/recover")
    public OperationalEvent recover() {
        return telemetryClient.send(EventType.DEPLOYMENT, Severity.INFO, "Demo payment service recovered");
    }

    @PostMapping("/demo/scenarios/database-failure")
    public List<OperationalEvent> databaseFailureScenario() {
        String traceId = "scenario-" + UUID.randomUUID();
        String deploymentId = "payment-bad-db-" + UUID.randomUUID();
        Map<String, String> context = Map.of("environment", "demo", "scenario", "database-failure");
        return List.of(
                telemetryClient.send(EventType.DEPLOYMENT, Severity.INFO,
                        "Payment deployment introduced a database endpoint change", traceId, deploymentId, context),
                telemetryClient.send(EventType.DATABASE_ERROR, Severity.CRITICAL,
                        "JDBC connection refused for payment database", traceId, deploymentId, context),
                telemetryClient.send(EventType.SERVICE_ERROR, Severity.ERROR,
                        "Payment requests are failing after database connection errors", traceId, deploymentId, context),
                telemetryClient.send(EventType.HIGH_LATENCY, Severity.WARNING,
                        "Payment p95 latency increased to 4200ms", traceId, deploymentId, context),
                telemetryClient.send(EventType.DEPLOYMENT, Severity.INFO,
                        "Rollback completed and database connectivity recovered", traceId, deploymentId, context));
    }
}
