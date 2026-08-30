package io.causora.incident.account;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class SecurityConfigTest {
    @Autowired private MockMvc mvc;
    @MockitoBean private AccountService accounts;

    @Test
    void exposesCsrfBootstrapButProtectsIdentityAndIncidentData() throws Exception {
        mvc.perform(get("/api/v1/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.headerName").isNotEmpty());

        mvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("authentication_required"));

        mvc.perform(get("/api/v1/incidents"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsStateChangingRequestsWithoutCsrf() throws Exception {
        mvc.perform(post("/api/v1/auth/register")
                        .contentType("application/json")
                        .content("{\"email\":\"viewer@example.com\",\"displayName\":\"Viewer\",\"password\":\"a-secure-password\"}"))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"email\":\"invalid\",\"displayName\":\"V\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest());
    }
}
