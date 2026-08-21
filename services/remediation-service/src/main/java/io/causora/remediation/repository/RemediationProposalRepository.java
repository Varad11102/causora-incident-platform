package io.causora.remediation.repository;

import io.causora.remediation.model.RemediationProposal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface RemediationProposalRepository extends JpaRepository<RemediationProposal, UUID> {
    Optional<RemediationProposal> findByIdempotencyKey(String idempotencyKey);
    List<RemediationProposal> findByIncidentIdOrderByCreatedAtDesc(UUID incidentId);
    List<RemediationProposal> findAllByOrderByCreatedAtDesc();
}
