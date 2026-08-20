# AWS Phase 1 Deployment

## Current deployment

- Region: `ap-south-1`
- Compute: one `t4g.small` Amazon Linux 2023 ARM64 instance
- Storage: one encrypted 16 GiB gp3 root volume
- Management: AWS Systems Manager; SSH and public ingress remain disabled
- Runtime: Docker Compose with Kafka, PostgreSQL, Telemetry Service, Incident Service, and demo-payment-service

Kafka and PostgreSQL are available only on the Compose network. Application ports `8081`, `8082`, and `8090` bind to `127.0.0.1`, so verification is performed through SSM rather than public ingress.

## Build and deploy

The backend requires Java 21. On a small ARM host, compile before starting the runtime stack and constrain the build container:

```bash
cd /opt/causora
docker run --rm --memory=900m --cpus=2 \
  -v /opt/causora:/workspace \
  -v causora-maven-cache:/root/.m2 \
  -w /workspace \
  maven:3.9.11-eclipse-temurin-21 \
  mvn --batch-mode clean verify

umask 077
printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 24)" > .env
docker compose build telemetry-service incident-service demo-payment-service
docker compose up -d
```

Never commit `.env`. The database password is generated on the instance and supplied to Compose at runtime.

## Verification

```bash
curl -fsS http://127.0.0.1:8081/actuator/health
curl -fsS http://127.0.0.1:8082/actuator/health
curl -fsS http://127.0.0.1:8090/actuator/health
curl -fsS -X POST http://127.0.0.1:8090/demo/fail
curl -fsS http://127.0.0.1:8082/api/v1/incidents
docker compose exec -T kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server kafka:29092 --describe --group incident-service-v1
docker stats --no-stream
```

Idempotency is verified by posting the same explicit `eventId` twice to Telemetry Service and confirming one PostgreSQL incident row plus an `incident_duplicate_ignored` log entry.

The deterministic investigation scenario is:

```bash
curl -fsS -X POST http://127.0.0.1:8090/demo/scenarios/database-failure
```

It produces one incident with five correlated records: deployment change, database failure, service error, latency spike, and recovery. Verify the evidence, timeline, and ranked hypotheses at the three nested incident endpoints. Recovery is retained as counter-evidence rather than silently discarded.

The final recovery event also transitions the incident to `RESOLVED`. Scrape-ready metrics can be inspected through SSM at `/actuator/prometheus` on ports `8081`, `8082`, and `8090`; these ports remain bound to `127.0.0.1` and are not publicly exposed.

Resolved-incident memory is available from `/api/v1/incident-memory` and `/api/v1/incident-memory/incidents/{incidentId}` on Incident Service. The snapshot is generated locally from persisted evidence and hypotheses and requires no external AI or managed data service.

## Capacity

The minimum stack uses explicit container limits and small JVM heaps. A persistent 1 GiB swapfile protects the 2 GiB instance against transient startup spikes. This is appropriate for the first demonstration flow, not for running all planned Java services, Grafana, Prometheus, Kafka, and PostgreSQL simultaneously. Measure before adding components and optimize before considering `t4g.medium`.

## Cost and security

The only continuously cost-sensitive resources are the `t4g.small`, 16 GiB gp3 volume, and public IPv4 address. There is no NAT Gateway, Elastic IP, load balancer, RDS, MSK, EKS, ElastiCache, or second EC2 instance.

IMDSv2 is required. The instance role contains the SSM managed-instance policy. No AWS credentials are stored in the repository or containers, no internal service ports are public, and Docker logs are size-bounded.
