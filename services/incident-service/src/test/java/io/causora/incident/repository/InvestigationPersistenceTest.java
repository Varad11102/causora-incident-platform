package io.causora.incident.repository;

import io.causora.events.Severity;
import io.causora.incident.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import java.time.Instant;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(properties = {"spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop"})
class InvestigationPersistenceTest {
    @Autowired private IncidentRepository incidentRepository;
    @Autowired private EvidenceRepository evidenceRepository;
    @Autowired private TimelineRepository timelineRepository;
    @Autowired private HypothesisRepository hypothesisRepository;

    @Test
    void persistsEvidenceMetadataTimelineOrderAndHypothesisRelationships() {
        Instant now = Instant.parse("2026-08-19T10:00:00Z");
        Incident incident = incidentRepository.save(new Incident(UUID.randomUUID(), now, now, IncidentStatus.OPEN,
                Severity.CRITICAL, "Database failure", "payment", "node-1", UUID.randomUUID(), "failure"));
        Evidence later = evidenceRepository.save(evidence(incident.getId(), now.plusSeconds(10), EvidenceType.ERROR_EVENT));
        Evidence earlier = evidenceRepository.save(evidence(incident.getId(), now, EvidenceType.DATABASE_FAILURE));
        timelineRepository.save(new TimelineEntry(UUID.randomUUID(), incident.getId(), later.getId(), later.getObservedAt(),
                later.getEvidenceType(), "payment", "node-1", "later", "trace-1", "deploy-1"));
        timelineRepository.save(new TimelineEntry(UUID.randomUUID(), incident.getId(), earlier.getId(), earlier.getObservedAt(),
                earlier.getEvidenceType(), "payment", "node-1", "earlier", "trace-1", "deploy-1"));
        hypothesisRepository.save(new Hypothesis(UUID.randomUUID(), incident.getId(),
                HypothesisType.DATABASE_CONNECTIVITY_FAILURE, "Database", 70, Set.of(earlier.getId(), later.getId()),
                Set.of(), "deterministic", now));

        assertThat(evidenceRepository.findByIncidentIdOrderByObservedAtAsc(incident.getId()))
                .extracting(Evidence::getEvidenceType)
                .containsExactly(EvidenceType.DATABASE_FAILURE, EvidenceType.ERROR_EVENT);
        assertThat(earlier.getMetadata()).containsEntry("scenario", "test");
        assertThat(timelineRepository.findByIncidentIdOrderByOccurredAtAsc(incident.getId()))
                .extracting(TimelineEntry::getSummary).containsExactly("earlier", "later");
        assertThat(hypothesisRepository.findByIncidentIdOrderByScoreDescHypothesisTypeAsc(incident.getId()))
                .singleElement().satisfies(item -> assertThat(item.getSupportingEvidenceIds()).hasSize(2));
    }

    @Test
    void rejectsDuplicateEvidenceEventId() {
        UUID eventId = UUID.randomUUID();
        Evidence first = evidence(null, Instant.now(), EvidenceType.ERROR_EVENT, eventId);
        Evidence duplicate = evidence(null, Instant.now().plusSeconds(1), EvidenceType.ERROR_EVENT, eventId);
        evidenceRepository.saveAndFlush(first);
        assertThatThrownBy(() -> evidenceRepository.saveAndFlush(duplicate))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private Evidence evidence(UUID incidentId, Instant observedAt, EvidenceType type) {
        return evidence(incidentId, observedAt, type, UUID.randomUUID());
    }

    private Evidence evidence(UUID incidentId, Instant observedAt, EvidenceType type, UUID eventId) {
        return new Evidence(UUID.randomUUID(), eventId, incidentId, observedAt, "TELEMETRY", "payment", "node-1",
                type, Severity.ERROR, type.name(), "value", "trace-1", "deploy-1",
                Map.of("scenario", "test"), 100);
    }
}
