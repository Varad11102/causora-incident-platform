package io.causora.remediation.controller;

import io.causora.remediation.api.*;
import io.causora.remediation.model.*;
import io.causora.remediation.repository.*;
import io.causora.remediation.service.RemediationService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/remediations")
public class RemediationController {
    private final RemediationService service;
    private final RemediationProposalRepository proposals;
    private final RemediationAuditRepository audit;

    public RemediationController(RemediationService service, RemediationProposalRepository proposals,
                                 RemediationAuditRepository audit) {
        this.service = service; this.proposals = proposals; this.audit = audit;
    }

    @PostMapping
    public ResponseEntity<RemediationProposal> propose(@Valid @RequestBody CreateProposalRequest request,
                                                        @RequestHeader("X-Causora-Actor") String actor) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.propose(request, actor));
    }

    @GetMapping
    public List<RemediationProposal> list(@RequestParam(required = false) UUID incidentId) {
        return incidentId == null ? proposals.findAllByOrderByCreatedAtDesc()
                : proposals.findByIncidentIdOrderByCreatedAtDesc(incidentId);
    }

    @GetMapping("/{id}")
    public RemediationProposal get(@PathVariable UUID id) { return service.get(id); }

    @GetMapping("/{id}/audit")
    public List<RemediationAuditEntry> audit(@PathVariable UUID id) {
        service.get(id);
        return audit.findByProposalIdOrderByOccurredAtAsc(id);
    }

    @PostMapping("/{id}/approve")
    public RemediationProposal approve(@PathVariable UUID id, @Valid @RequestBody DecisionRequest request,
                                       @RequestHeader("X-Causora-Actor") String actor) {
        return service.decide(id, ProposalStatus.APPROVED, actor, request.reason());
    }

    @PostMapping("/{id}/reject")
    public RemediationProposal reject(@PathVariable UUID id, @Valid @RequestBody DecisionRequest request,
                                      @RequestHeader("X-Causora-Actor") String actor) {
        return service.decide(id, ProposalStatus.REJECTED, actor, request.reason());
    }

    @PostMapping("/{id}/execute")
    public ResponseEntity<ExecutionBlockedResponse> execute(@PathVariable UUID id,
                                                             @RequestHeader("X-Causora-Actor") String actor) {
        service.requestExecution(id, actor);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ExecutionBlockedResponse(id, "EXECUTION_BLOCKED",
                "Ansible execution is disabled; the attempt was audited"));
    }
}
