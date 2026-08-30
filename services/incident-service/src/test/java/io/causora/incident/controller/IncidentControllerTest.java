package io.causora.incident.controller;

import io.causora.incident.repository.EvidenceRepository;
import io.causora.incident.repository.HypothesisRepository;
import io.causora.incident.repository.IncidentRepository;
import io.causora.incident.repository.TimelineRepository;
import io.causora.incident.service.IncidentMemorySimilarityService;
import io.causora.incident.service.IncidentOverview;
import io.causora.incident.service.IncidentOverviewService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class IncidentControllerTest {
    private final IncidentRepository incidents = mock(IncidentRepository.class);
    private final IncidentOverviewService overviewService = mock(IncidentOverviewService.class);
    private final IncidentController controller = new IncidentController(
            incidents,
            mock(EvidenceRepository.class),
            mock(TimelineRepository.class),
            mock(HypothesisRepository.class),
            mock(IncidentMemorySimilarityService.class),
            overviewService);

    @Test
    void clampsThePublicListToTwoHundredRecords() {
        when(incidents.findAll(any(Pageable.class))).thenAnswer(invocation -> {
            Pageable page = invocation.getArgument(0);
            assertThat(page.getPageSize()).isEqualTo(200);
            assertThat(page.getSort().getOrderFor("createdAt").isDescending()).isTrue();
            return new PageImpl<>(List.of());
        });

        assertThat(controller.list(10_000)).isEmpty();
    }

    @Test
    void exposesTheLiveOverview() {
        IncidentOverview overview = new IncidentOverview(100, 3, 97, 2, 485, 194, 97,
                Instant.parse("2026-08-29T09:34:00Z"));
        when(overviewService.get()).thenReturn(overview);

        assertThat(controller.overview()).isSameAs(overview);
        verify(overviewService).get();
    }
}
