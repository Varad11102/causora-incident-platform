package io.causora.incident.account;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class AuthRateLimitFilterTest {
    @Test
    void limitsRepeatedLoginAttemptsPerForwardedClient() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter();
        FilterChain chain = mock(FilterChain.class);

        for (int attempt = 0; attempt < 10; attempt++) {
            MockHttpServletRequest request = request("/api/v1/auth/login");
            filter.doFilter(request, new MockHttpServletResponse(), chain);
        }

        MockHttpServletResponse rejected = new MockHttpServletResponse();
        filter.doFilter(request("/api/v1/auth/login"), rejected, chain);

        verify(chain, times(10)).doFilter(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
        assertThat(rejected.getStatus()).isEqualTo(429);
        assertThat(rejected.getHeader("Retry-After")).isNotBlank();
        assertThat(rejected.getContentAsString()).contains("too_many_authentication_attempts");
    }

    private MockHttpServletRequest request(String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", uri);
        request.addHeader("X-Forwarded-For", "203.0.113.8");
        return request;
    }
}
