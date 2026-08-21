package io.causora.remediation.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.causora.remediation.api.CreateProposalRequest;
import io.causora.remediation.model.*;
import io.causora.remediation.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class RemediationService {
    private final RemediationProposalRepository proposals;
    private final RemediationAuditRepository audit;
    private final ObjectMapper objectMapper;
    private final boolean executionEnabled;

    public RemediationService(RemediationProposalRepository proposals, RemediationAuditRepository audit,
                              ObjectMapper objectMapper,
                              @Value("${causora.remediation.execution-enabled:false}") boolean executionEnabled) {
        this.proposals = proposals; this.audit = audit; this.objectMapper = objectMapper;
        this.executionEnabled = executionEnabled;
    }

    @Transactional
    public RemediationProposal propose(CreateProposalRequest request, String actor) {
        requireActor(actor);
        Optional<RemediationProposal> existing = proposals.findByIdempotencyKey(request.idempotencyKey());
        if (existing.isPresent()) {
            RemediationProposal proposal = existing.get();
            if (!proposal.getIncidentId().equals(request.incidentId())
                    || proposal.getPlaybookKey() != request.playbookKey()
                    || !proposal.getTarget().equals(request.target())) {
                throw new RemediationConflictException("idempotency key belongs to a different proposal");
            }
            return proposal;
        }
        Instant now = Instant.now();
        RemediationProposal proposal = proposals.save(new RemediationProposal(UUID.randomUUID(), request.incidentId(),
                request.idempotencyKey(), request.playbookKey(), request.target(), request.reason(),
                json(request.parameters()), actor, now));
        record(proposal.getId(), AuditAction.PROPOSED, actor,
                "Proposed allowlisted playbook " + request.playbookKey(), now);
        return proposal;
    }

    @Transactional
    public RemediationProposal decide(UUID proposalId, ProposalStatus decision, String actor, String reason) {
        requireActor(actor);
        RemediationProposal proposal = get(proposalId);
        try {
            proposal.decide(decision, actor, Instant.now());
        } catch (IllegalStateException exception) {
            throw new RemediationConflictException(exception.getMessage());
        }
        record(proposalId, decision == ProposalStatus.APPROVED ? AuditAction.APPROVED : AuditAction.REJECTED,
                actor, reason, proposal.getDecidedAt());
        return proposal;
    }

    @Transactional
    public boolean requestExecution(UUID proposalId, String actor) {
        requireActor(actor);
        RemediationProposal proposal = get(proposalId);
        if (proposal.getStatus() != ProposalStatus.APPROVED)
            throw new RemediationConflictException("proposal must be approved before execution");
        if (!executionEnabled) {
            record(proposalId, AuditAction.EXECUTION_BLOCKED, actor,
                    "Execution disabled by causora.remediation.execution-enabled=false", Instant.now());
            return false;
        }
        throw new RemediationConflictException("execution adapter is not configured");
    }

    @Transactional(readOnly = true)
    public RemediationProposal get(UUID id) {
        return proposals.findById(id).orElseThrow(() -> new RemediationNotFoundException("proposal not found"));
    }

    private void record(UUID proposalId, AuditAction action, String actor, String detail, Instant at) {
        audit.save(new RemediationAuditEntry(UUID.randomUUID(), proposalId, action, actor, detail, at));
    }

    private String json(Map<String, String> parameters) {
        try { return objectMapper.writeValueAsString(parameters); }
        catch (JsonProcessingException exception) { throw new IllegalArgumentException("invalid parameters", exception); }
    }

    private void requireActor(String actor) {
        if (actor == null || actor.isBlank() || actor.length() > 255)
            throw new IllegalArgumentException("X-Causora-Actor must contain 1-255 characters");
    }
}
