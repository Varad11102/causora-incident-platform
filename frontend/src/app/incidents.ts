export type Incident = {
  id: string; title: string; service: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  status: "INVESTIGATING" | "OPEN" | "RESOLVED";
  started: string; confidence: number; summary: string;
  sourceNode: string; createdAt: string; cause: string; remediation: string;
};

const scenarios = [
  ["Payment API database connectivity failure", "payment-service", "Bad database endpoint deployment", "Rollback the payment service and restore the previous database endpoint."],
  ["Checkout latency above SLO", "checkout-service", "Connection pool exhaustion", "Increase the connection pool limit and recycle saturated instances."],
  ["Kafka consumer lag increasing", "notification-service", "Slow downstream email provider", "Scale consumers and temporarily throttle email delivery."],
  ["Elevated authentication failures", "identity-service", "Expired signing key cache", "Refresh the signing-key cache across identity instances."],
  ["Inventory updates delayed", "inventory-service", "Dead-letter queue growth", "Replay valid dead-letter messages after correcting the schema mapping."],
  ["Search requests timing out", "search-service", "Elasticsearch shard relocation", "Pause rebalancing and reroute the affected shards."],
  ["Order creation error spike", "order-service", "Invalid feature flag rollout", "Disable the new validation flag and retry failed orders."],
  ["Image processing backlog", "media-worker", "Worker memory pressure", "Roll workers with a lower concurrency limit."],
  ["Cache hit rate degraded", "catalog-service", "Redis key eviction surge", "Increase cache capacity and warm the highest-volume keys."],
  ["Webhook deliveries failing", "webhook-service", "TLS certificate mismatch", "Restore the prior certificate bundle and retry queued deliveries."],
  ["Fraud scoring unavailable", "risk-service", "Model endpoint health-check failure", "Fail over scoring traffic to the previous model version."],
  ["Shipping quotes incomplete", "shipping-service", "Carrier API rate limiting", "Enable cached quotes and reduce carrier request concurrency."],
  ["Metrics ingestion dropping samples", "telemetry-service", "Collector batch size regression", "Restore the previous batch size and restart collectors gradually."],
  ["Invoice generation stalled", "billing-worker", "Object storage permission change", "Restore the worker role policy and replay the invoice queue."],
  ["Session refresh latency elevated", "session-service", "Cross-region Redis latency", "Route session reads to the regional replica."],
  ["Recommendation feed returning empty", "recommendation-service", "Feature store schema drift", "Pin the compatible feature schema and rebuild the affected view."],
  ["Audit event delivery delayed", "audit-service", "Kafka partition imbalance", "Reassign hot partitions and restart the lagging consumer group."],
  ["Profile writes intermittently failing", "profile-service", "Database lock contention", "Terminate the blocking transaction and reduce batch update size."],
  ["API gateway 502 responses", "api-gateway", "Unhealthy upstream retained in pool", "Evict the unhealthy upstream and refresh service discovery."],
  ["DNS resolution errors in workers", "job-runner", "Stale node resolver cache", "Restart DNS caching on affected nodes and roll workers."],
] as const;

const severities: Incident["severity"][] = ["CRITICAL", "WARNING", "INFO", "WARNING", "INFO"];
const statuses: Incident["status"][] = ["INVESTIGATING", "OPEN", "RESOLVED", "OPEN", "RESOLVED"];

export const incidents: Incident[] = Array.from({ length: 100 }, (_, index) => {
  const scenario = scenarios[index % scenarios.length];
  const occurrence = Math.floor(index / scenarios.length) + 1;
  const minutesAgo = 8 + index * 11;
  return {
    id: `demo-${String(index + 1).padStart(3, "0")}`,
    title: occurrence === 1 ? scenario[0] : `${scenario[0]} — recurrence ${occurrence}`,
    service: scenario[1], severity: severities[index % 5], status: statuses[index % 5],
    started: minutesAgo < 60 ? `${minutesAgo} minutes ago` : `${Math.floor(minutesAgo / 60)} hours ago`,
    confidence: 62 + ((index * 7) % 36),
    summary: `${scenario[0]} was detected by correlated telemetry from ${scenario[1]}. The investigation links the alert to recent operational changes and service health signals.`,
    sourceNode: `${scenario[1]}-${String((index % 9) + 1).padStart(2, "0")}`,
    createdAt: new Date(Date.UTC(2026, 7, 29, 5, 2) - minutesAgo * 60_000).toISOString(),
    cause: scenario[2], remediation: scenario[3],
  };
});

export const getIncident = (id: string) => incidents.find((incident) => incident.id === id) ?? incidents[0];
