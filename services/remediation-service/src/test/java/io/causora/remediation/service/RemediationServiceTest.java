package io.causora.remediation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.causora.remediation.api.CreateProposalRequest;
import io.causora.remediation.model.*;
import io.causora.remediation.repository.*;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RemediationServiceTest {
    private final RemediationProposalRepository proposals = mock(RemediationProposalRepository.class);
    private final RemediationAuditRepository audit = mock(RemediationAuditRepository.class);
    private final RemediationService service = new RemediationService(proposals, audit, new ObjectMapper(), false);

    @Test
    void createsAnAllowlistedProposalAndAuditEntryIdempotently() {
        CreateProposalRequest request = request("incident-restart-1");
        when(proposals.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(audit.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        RemediationProposal created = service.propose(request, "investigator@example.test");
        when(proposals.findByIdempotencyKey(request.idempotencyKey())).thenReturn(Optional.of(created));
        RemediationProposal replay = service.propose(request, "investigator@example.test");

        assertThat(created.getStatus()).isEqualTo(ProposalStatus.PROPOSED);
        assertThat(created.getRisk()).isEqualTo(RemediationRisk.MEDIUM);
        assertThat(replay.getId()).isEqualTo(created.getId());
        verify(proposals, times(1)).save(any());
        verify(audit, times(1)).save(argThat(entry -> entry.getAction() == AuditAction.PROPOSED));
    }

    @Test
    void rejectsIdempotencyKeyReuseForDifferentWork() {
        CreateProposalRequest request = request("same-key");
        RemediationProposal existing = proposal(request);
        when(proposals.findByIdempotencyKey("same-key")).thenReturn(Optional.of(existing));
        CreateProposalRequest different = new CreateProposalRequest(UUID.randomUUID(), "same-key",
                PlaybookKey.CONFIG_ROLLBACK, "demo", "rollback", Map.of());

        assertThatThrownBy(() -> service.propose(different, "actor"))
                .isInstanceOf(RemediationConflictException.class);
    }

    @Test
    void approvesOnceAndAuditsTheDecision() {
        RemediationProposal proposal = proposal(request("approve-1"));
        when(proposals.findById(proposal.getId())).thenReturn(Optional.of(proposal));

        service.decide(proposal.getId(), ProposalStatus.APPROVED, "operator", "evidence reviewed");

        assertThat(proposal.getStatus()).isEqualTo(ProposalStatus.APPROVED);
        assertThat(proposal.getDecidedBy()).isEqualTo("operator");
        verify(audit).save(argThat(entry -> entry.getAction() == AuditAction.APPROVED));
        assertThatThrownBy(() -> service.decide(proposal.getId(), ProposalStatus.REJECTED, "other", "late"))
                .isInstanceOf(RemediationConflictException.class);
    }

    @Test
    void blocksAndAuditsExecutionWhenDisabled() {
        RemediationProposal proposal = proposal(request("execute-1"));
        proposal.decide(ProposalStatus.APPROVED, "operator", Instant.now());
        when(proposals.findById(proposal.getId())).thenReturn(Optional.of(proposal));

        assertThat(service.requestExecution(proposal.getId(), "operator")).isFalse();
        verify(audit).save(argThat(entry -> entry.getAction() == AuditAction.EXECUTION_BLOCKED));
    }

    @Test
    void requiresAnExplicitNonBlankActor() {
        assertThatThrownBy(() -> service.propose(request("missing-actor"), " "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("X-Causora-Actor");
        verifyNoInteractions(audit);
    }

    private CreateProposalRequest request(String key) {
        return new CreateProposalRequest(UUID.randomUUID(), key, PlaybookKey.SERVICE_RESTART,
                "demo-payment-service", "restart after verified failure", Map.of("service", "demo-payment-service"));
    }

    private RemediationProposal proposal(CreateProposalRequest request) {
        return new RemediationProposal(UUID.randomUUID(), request.incidentId(), request.idempotencyKey(),
                request.playbookKey(), request.target(), request.reason(), "{}", "creator", Instant.now());
    }
}
