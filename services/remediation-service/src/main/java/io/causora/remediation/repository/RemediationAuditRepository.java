package io.causora.remediation.repository;

import io.causora.remediation.model.RemediationAuditEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface RemediationAuditRepository extends JpaRepository<RemediationAuditEntry, UUID> {
    List<RemediationAuditEntry> findByProposalIdOrderByOccurredAtAsc(UUID proposalId);
}
