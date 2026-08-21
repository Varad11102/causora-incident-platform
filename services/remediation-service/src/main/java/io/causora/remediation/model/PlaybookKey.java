package io.causora.remediation.model;

public enum PlaybookKey {
    SERVICE_HEALTH_CHECK(RemediationRisk.LOW),
    SERVICE_RESTART(RemediationRisk.MEDIUM),
    CONFIG_ROLLBACK(RemediationRisk.MEDIUM);

    private final RemediationRisk risk;
    PlaybookKey(RemediationRisk risk) { this.risk = risk; }
    public RemediationRisk risk() { return risk; }
}
