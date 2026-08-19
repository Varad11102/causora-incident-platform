package io.causora.demo.payment;

import io.causora.events.EventType;
import io.causora.events.OperationalEvent;
import io.causora.events.Severity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

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
}
