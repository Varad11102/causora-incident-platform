package io.causora.telemetry.controller;

import io.causora.telemetry.service.TelemetryIngestionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TelemetryController.class)
class TelemetryControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockBean private TelemetryIngestionService ingestionService;
    @Test void rejectsMissingRequiredFields() throws Exception {
        mockMvc.perform(post("/api/v1/telemetry/events").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nodeId\":\"node-1\",\"severity\":\"ERROR\",\"message\":\"failure\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(ingestionService);
    }
}
