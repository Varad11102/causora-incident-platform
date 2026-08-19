# Causora

Causora is a cloud-ready incident investigation and remediation platform focused on causal reasoning from structured operational evidence.

The cloud MVP now normalizes structured telemetry, publishes it through Kafka, creates incidents idempotently, persists correlated evidence and ordered timelines, and ranks explainable deterministic hypotheses. AI analysis, authentication, and approval-controlled remediation remain later milestones.

## Services

| Service | Port | Responsibility |
| --- | ---: | --- |
| gateway | 8080 | External API entry point |
| telemetry-service | 8081 | Receives and normalizes telemetry and events |
| incident-service | 8082 | Creates and manages incidents |
| investigation-service | 8083 | Evidence, hypotheses, confidence, counter-evidence, and AI investigation |
| remediation-service | 8084 | Approval-controlled Ansible actions |

## Prerequisites

- Java 21
- Maven 3.9+
- Node.js 20+ for the frontend
- Docker Compose for the future local stack

## Verify backend services

```bash
mvn clean verify
```

Each Spring Boot service exposes its health endpoint at `/actuator/health` when running.

See [docs/architecture.md](docs/architecture.md) for the planned architecture and delivery sequence.

## Phase 1: telemetry to incident

```text
demo-payment-service -> telemetry-service -> Kafka -> incident-service -> PostgreSQL
```

Kafka uses the JSON topic `telemetry.operational.v1`. Telemetry validates incoming events, supplies missing event IDs and timestamps, and publishes the normalized contract. Incident Service creates an `OPEN` incident for service-down, database-error, resource-exhaustion, and critical service-error events. A unique triggering event ID makes repeated delivery idempotent.

Build the JARs before the images, create a local runtime secret, then start the local stack:

```bash
mvn clean verify
cp .env.example .env
# Replace POSTGRES_PASSWORD in .env with a unique random value.
docker compose up --build
```

Host-run services use Kafka at `localhost:9092`; containers use `kafka:29092`.

```bash
curl -X POST http://localhost:8090/demo/fail
curl http://localhost:8082/api/v1/incidents
curl -X POST http://localhost:8090/demo/recover
```

Recovery emits an informational `DEPLOYMENT` event. Automatic incident resolution is outside Phase 1.

## Deterministic investigation

Trigger the richer database/deployment scenario from the host through SSM:

```bash
curl -X POST http://127.0.0.1:8090/demo/scenarios/database-failure
curl http://127.0.0.1:8082/api/v1/incidents/{incidentId}/evidence
curl http://127.0.0.1:8082/api/v1/incidents/{incidentId}/timeline
curl http://127.0.0.1:8082/api/v1/incidents/{incidentId}/hypotheses
```

The scenario emits a deployment change, database failure, service error, latency spike, and recovery. Correlation uses trace/deployment identifiers and a bounded recent-incident window. Scores are rule-based and include supporting and counter-evidence IDs; no AI or statistical model participates.

## AWS Phase 1 deployment

The current low-cost deployment runs on one ARM64 `t4g.small` instance and is managed over AWS Systems Manager. Kafka and PostgreSQL are internal Compose services. The three temporary diagnostic application ports bind only to host loopback, and the EC2 security group has no inbound rules.

See [docs/deployment.md](docs/deployment.md) for deployment, verification, security, capacity, and cost notes.
